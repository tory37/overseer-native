import { ipcMain, BrowserWindow, dialog, clipboard, Menu, shell, app } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { SessionService } from './session-service/index'
import { SyncService } from './services/sync-service'
import { ConfigService } from './services/config-service'
import { UpdateService } from './services/update-service'
import { IPC } from '../renderer/types/ipc'
import type { Session, CreateSessionOptions, Keybindings, ThemeSettings } from '../renderer/types/ipc'
import { runGitCommand } from './git-service'
import { CompanionPtyManager } from './companion-pty-manager'
import { SpriteParser } from './sprite-parser'
import { discoverPlugins } from './plugin-discovery'

export async function isDirectory(p: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(p)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export function registerIpcHandlers(
  service: SessionService,
  syncService: SyncService,
  updateService: UpdateService,
  getWindow: () => BrowserWindow | null,
  baseDir: string,
  isDev: boolean
): void {
  const configService = new ConfigService(baseDir)
  const defaultPluginsDir = path.join(os.homedir(), '.overseer', 'plugins')
  const spriteParsers = new Map<string, SpriteParser>()
  
  service.onData((sessionId, data) => {
    getWindow()?.webContents.send(`pty:data:${sessionId}`, data)
    try {
      if (!spriteParsers.has(sessionId)) {
        spriteParsers.set(sessionId, new SpriteParser())
      }
      const events = spriteParsers.get(sessionId)!.parse(data)
      for (const ev of events) {
        if (ev.type === 'speech') {
          getWindow()?.webContents.send(IPC.SPRITE_SPEECH, { sessionId, text: ev.text })
        }
      }
    } catch (err) {
      console.error('[Sprite] Speech parse error:', err)
    }
  })

  service.onError((sessionId, err) => {
    getWindow()?.webContents.send(`pty:error:${sessionId}`, err)
  })

  ipcMain.handle(IPC.SESSION_LIST, () => service.list())

  ipcMain.handle(IPC.SESSION_CREATE, (_event, options: CreateSessionOptions) => {
    const session = service.create(options)
    syncService.runSync().catch(() => {})
    return session
  })

  ipcMain.handle(IPC.SESSION_KILL, (_event, sessionId: string) => {
    spriteParsers.delete(sessionId)
    return service.kill(sessionId)
  })
  ipcMain.handle(IPC.SESSION_UPDATE, (_event, sessionId: string, partial: Partial<Session>) => {
    service.updateSession(sessionId, partial)
  })
  ipcMain.handle(IPC.SCROLLBACK_GET, (_event, sessionId: string) => {
    return service.getScrollback(sessionId)
  })
  ipcMain.handle(IPC.PTY_INPUT,  (_event, sessionId: string, data: string) => service.writeToSession(sessionId, data))
  ipcMain.handle(IPC.PTY_RESIZE, (_event, sessionId: string, cols: number, rows: number) => service.resizeSession(sessionId, cols, rows))
  ipcMain.handle(IPC.GIT_STATUS, (_event, cwd: string) => runGitCommand('status', cwd))
  ipcMain.handle(IPC.GIT_COMMIT, (_event, cwd: string, message: string) => runGitCommand(`add -A && git commit -m ${JSON.stringify(message)}`, cwd))
  ipcMain.handle(IPC.GIT_PUSH,   (_event, cwd: string) => runGitCommand('push', cwd))
  ipcMain.handle(IPC.GIT_PULL,   (_event, cwd: string) => runGitCommand('pull', cwd))

  ipcMain.handle(IPC.DIALOG_OPEN_DIR, async (_event, currentPath: string) => {
    const defaultPath = currentPath || os.homedir()
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], defaultPath })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.FS_IS_DIR, (_event, p: string) => isDirectory(p))

  ipcMain.handle(IPC.SYNC_STATUS, () => syncService.getDriftStatus())
  ipcMain.handle(IPC.SYNC_RUN,    () => syncService.runSync())

  ipcMain.handle(IPC.KEYBINDINGS_READ,  () => configService.read<Keybindings>('keybindings.json'))
  ipcMain.handle(IPC.KEYBINDINGS_WRITE, (_event, kb: Keybindings) => configService.write('keybindings.json', kb))

  ipcMain.handle(IPC.THEME_READ,  () => configService.read<ThemeSettings>('theme-settings.json'))
  ipcMain.handle(IPC.THEME_WRITE, (_event, settings: ThemeSettings) => configService.write('theme-settings.json', settings))

  ipcMain.handle(IPC.PLUGINS_GET, async () => {
    const config = await configService.read<{ pluginsDir?: string }>('app-config.json')
    const pluginsDir = config?.pluginsDir ?? defaultPluginsDir
    return discoverPlugins(pluginsDir)
  })

  ipcMain.handle(IPC.SPRITE_READ,  () => configService.read<any>('sprites.json'))
  ipcMain.handle(IPC.SPRITE_WRITE, (_event, settings: any) => {
    configService.write('sprites.json', settings)
    
    // Propagate updates to active sessions using these sprites
    const sessions = service.list()
    for (const session of sessions) {
      if (session.spriteId) {
        const sprite = settings.sprites?.find((s: any) => s.id === session.spriteId)
        if (sprite) {
          service.updateSprite(session.id, sprite.id, sprite.name, sprite.persona)
        }
      }
    }
  })

  ipcMain.handle(IPC.USER_SETTINGS_READ,  () => configService.read<any>('user-settings.json'))
  ipcMain.handle(IPC.USER_SETTINGS_WRITE, (_event, settings: any) => configService.write('user-settings.json', settings))

  ipcMain.handle(IPC.CHANGELOG_READ, async () => {
    try {
      // In dev, it's in the project root. In prod, it's in the app path.
      // app.getAppPath() usually points to the directory containing package.json
      const changelogPath = path.join(app.getAppPath(), 'CHANGELOG.json')
      const raw = await fs.promises.readFile(changelogPath, 'utf8')
      return JSON.parse(raw)
    } catch (err) {
      console.error('[Changelog] Failed to read CHANGELOG.json:', err)
      return {}
    }
  })

  const companionMgr = new CompanionPtyManager()

  ipcMain.handle(IPC.COMPANION_SPAWN, (_event, cwd: string) =>
    companionMgr.spawn(
      cwd,
      (id, data) => getWindow()?.webContents.send('companion:data', { id, data }),
      (id)       => getWindow()?.webContents.send('companion:exit', { id }),
    )
  )

  ipcMain.handle(IPC.COMPANION_KILL,   (_event, companionId: string) => companionMgr.kill(companionId))
  ipcMain.handle(IPC.COMPANION_INPUT,  (_event, companionId: string, data: string) => companionMgr.write(companionId, data))
  ipcMain.handle(IPC.COMPANION_RESIZE, (_event, companionId: string, cols: number, rows: number) => companionMgr.resize(companionId, cols, rows))

  ipcMain.handle(IPC.CLIPBOARD_WRITE, (_event, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(IPC.CLIPBOARD_READ, () => {
    return clipboard.readText()
  })

  ipcMain.on(IPC.CONTEXT_MENU_SHOW, (event, options: { x: number; y: number; hasSelection: boolean }) => {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+Shift+C',
        enabled: options.hasSelection,
        click: () => {
          // The renderer already handles the selection retrieval if we send it back,
          // but for robustness we can just assume the renderer has already copied if it could.
          // However, standard context menu "Copy" should trigger the renderer to copy.
          event.reply('terminal:copy')
        }
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+Shift+V',
        click: () => {
          event.reply('terminal:paste')
        }
      },
      { type: 'separator' },
      { role: 'selectAll' as any }
    ]
    const menu = Menu.buildFromTemplate(template)
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      menu.popup({ window: win, x: options.x, y: options.y })
    }
  })

  ipcMain.handle(IPC.DEV_OPEN_DATA_FOLDER, async () => {
    await shell.openPath(baseDir)
  })

  ipcMain.handle(IPC.DEV_CLEAR_AND_RESTART, async () => {
    if (!isDev) return
    await fs.promises.rm(baseDir, { recursive: true, force: true })
    app.relaunch()
    app.exit()
  })

  ipcMain.handle(IPC.UPDATE_CHECK, () => updateService.manualCheck())
  ipcMain.handle(IPC.UPDATE_INSTALL, () => updateService.install())
}

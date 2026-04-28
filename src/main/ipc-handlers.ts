import { ipcMain, BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { SessionService } from './session-service/index'
import { SyncService } from './services/sync-service'
import { IPC } from '../renderer/types/ipc'
import type { CreateSessionOptions, Keybindings, ThemeSettings } from '../renderer/types/ipc'
import { runGitCommand } from './git-service'
import { CompanionPtyManager } from './companion-pty-manager'

export async function readKeybindingsFromDisk(baseDir = os.homedir()): Promise<Keybindings | null> {
  const p = path.join(baseDir, '.overseer', 'keybindings.json')
  try {
    const raw = await fs.promises.readFile(p, 'utf8')
    return JSON.parse(raw) as Keybindings
  } catch {
    return null
  }
}

export async function writeKeybindingsToDisk(kb: Keybindings, baseDir = os.homedir()): Promise<void> {
  const p = path.join(baseDir, '.overseer', 'keybindings.json')
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
  await fs.promises.writeFile(p, JSON.stringify(kb, null, 2), 'utf8')
}

export async function readThemeFromDisk(baseDir = os.homedir()): Promise<ThemeSettings | null> {
  const p = path.join(baseDir, '.overseer', 'theme-settings.json')
  try {
    const raw = await fs.promises.readFile(p, 'utf8')
    return JSON.parse(raw) as ThemeSettings
  } catch {
    return null
  }
}

export async function writeThemeToDisk(settings: ThemeSettings, baseDir = os.homedir()): Promise<void> {
  const p = path.join(baseDir, '.overseer', 'theme-settings.json')
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
  await fs.promises.writeFile(p, JSON.stringify(settings, null, 2), 'utf8')
}

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
  getWindow: () => BrowserWindow | null
): void {
  service.onData((sessionId, data) => {
    getWindow()?.webContents.send(`pty:data:${sessionId}`, data)
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

  ipcMain.handle(IPC.SESSION_KILL, (_event, sessionId: string) => service.kill(sessionId))
  ipcMain.handle(IPC.SCROLLBACK_GET, (_event, sessionId: string) => {
    const buf = service.getScrollback(sessionId)
    return buf ? buf.toString('binary') : null
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

  ipcMain.handle(IPC.KEYBINDINGS_READ,  () => readKeybindingsFromDisk())
  ipcMain.handle(IPC.KEYBINDINGS_WRITE, (_event, kb: Keybindings) => writeKeybindingsToDisk(kb))

  ipcMain.handle(IPC.THEME_READ,  () => readThemeFromDisk())
  ipcMain.handle(IPC.THEME_WRITE, (_event, settings: ThemeSettings) => writeThemeToDisk(settings))

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
}

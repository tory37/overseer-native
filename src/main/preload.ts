import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../renderer/types/ipc'
import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult, Keybindings, ThemeSettings, UpdateStatus } from '../renderer/types/ipc'

contextBridge.exposeInMainWorld('overseer', {
  listSessions: (): Promise<Session[]> =>
    ipcRenderer.invoke(IPC.SESSION_LIST),

  createSession: (options: CreateSessionOptions): Promise<Session> =>
    ipcRenderer.invoke(IPC.SESSION_CREATE, options),

  killSession: (sessionId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SESSION_KILL, sessionId),

  updateSession: (sessionId: string, partial: Partial<Session>): Promise<void> =>
    ipcRenderer.invoke(IPC.SESSION_UPDATE, sessionId, partial),

  getScrollback: (sessionId: string): Promise<Uint8Array | null> =>
    ipcRenderer.invoke(IPC.SCROLLBACK_GET, sessionId),

  sendInput: (sessionId: string, data: string): Promise<void> =>
    ipcRenderer.invoke(IPC.PTY_INPUT, sessionId, data),

  resize: (sessionId: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke(IPC.PTY_RESIZE, sessionId, cols, rows),

  onPtyData: (sessionId: string, callback: (data: string) => void) => {
    const channel = `pty:data:${sessionId}`
    const handler = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  onPtyError: (sessionId: string, callback: (err: string) => void) => {
    const channel = `pty:error:${sessionId}`
    const handler = (_event: Electron.IpcRendererEvent, err: string) => callback(err)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  gitStatus: (cwd: string): Promise<GitCommandResult> =>
    ipcRenderer.invoke(IPC.GIT_STATUS, cwd),

  gitCommit: (cwd: string, message: string): Promise<GitCommandResult> =>
    ipcRenderer.invoke(IPC.GIT_COMMIT, cwd, message),

  gitPush: (cwd: string): Promise<GitCommandResult> =>
    ipcRenderer.invoke(IPC.GIT_PUSH, cwd),

  gitPull: (cwd: string): Promise<GitCommandResult> =>
    ipcRenderer.invoke(IPC.GIT_PULL, cwd),

  openDirectory: (currentPath: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.DIALOG_OPEN_DIR, currentPath),

  isDirectory: (p: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.FS_IS_DIR, p),

  syncStatus: (): Promise<DriftStatus> =>
    ipcRenderer.invoke(IPC.SYNC_STATUS),

  syncRun: (): Promise<SyncResult> =>
    ipcRenderer.invoke(IPC.SYNC_RUN),

  readTheme: (): Promise<ThemeSettings | null> =>
    ipcRenderer.invoke(IPC.THEME_READ),

  writeTheme: (settings: ThemeSettings): Promise<void> =>
    ipcRenderer.invoke(IPC.THEME_WRITE, settings),

  readKeybindings: (): Promise<Keybindings | null> =>
    ipcRenderer.invoke(IPC.KEYBINDINGS_READ),

  writeKeybindings: (kb: Keybindings): Promise<void> =>
    ipcRenderer.invoke(IPC.KEYBINDINGS_WRITE, kb),

  spawnCompanion: (cwd: string): Promise<string> =>
    ipcRenderer.invoke(IPC.COMPANION_SPAWN, cwd),

  killCompanion: (companionId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_KILL, companionId),

  sendCompanionInput: (companionId: string, data: string): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_INPUT, companionId, data),

  resizeCompanion: (companionId: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_RESIZE, companionId, cols, rows),

  onCompanionData: (callback: (id: string, data: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, { id, data }: { id: string; data: string }) => callback(id, data)
    ipcRenderer.on('companion:data', handler)
    return () => ipcRenderer.removeListener('companion:data', handler)
  },

  onCompanionExit: (callback: (id: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, { id }: { id: string }) => callback(id)
    ipcRenderer.on('companion:exit', handler)
    return () => ipcRenderer.removeListener('companion:exit', handler)
  },

  onSpriteSpeech: (callback: (payload: { sessionId: string; text: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { sessionId: string; text: string }) => callback(payload)
    ipcRenderer.on(IPC.SPRITE_SPEECH, handler)
    return () => ipcRenderer.removeListener(IPC.SPRITE_SPEECH, handler)
  },

  readSprites: (): Promise<any> =>
    ipcRenderer.invoke(IPC.SPRITE_READ),

  writeSprites: (settings: any): Promise<void> =>
    ipcRenderer.invoke(IPC.SPRITE_WRITE, settings),

  copyToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke(IPC.CLIPBOARD_WRITE, text),

  readFromClipboard: (): Promise<string> =>
    ipcRenderer.invoke(IPC.CLIPBOARD_READ),

  showContextMenu: (options: { x: number; y: number; hasSelection: boolean }): void => {
    ipcRenderer.send(IPC.CONTEXT_MENU_SHOW, options)
  },

  onTerminalPaste: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('terminal:paste', handler)
    return () => ipcRenderer.removeListener('terminal:paste', handler)
  },

  onTerminalCopy: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('terminal:copy', handler)
    return () => ipcRenderer.removeListener('terminal:copy', handler)
  },

  updateStatus: (callback: (status: UpdateStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status)
    ipcRenderer.on(IPC.UPDATE_STATUS, handler)
    return () => ipcRenderer.removeListener(IPC.UPDATE_STATUS, handler)
  },

  updateCheck: (): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_CHECK),

  updateInstall: (): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_INSTALL),

  isDev: process.env.OVERSEER_IS_DEV === 'true',
  appVersion: process.env.OVERSEER_VERSION || '0.5.0',
  openDataFolder: () => ipcRenderer.invoke(IPC.DEV_OPEN_DATA_FOLDER),
  clearAndRestart: () => ipcRenderer.invoke(IPC.DEV_CLEAR_AND_RESTART),
})

import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../renderer/types/ipc'
import type { Session, CreateSessionOptions, GitCommandResult } from '../renderer/types/ipc'

contextBridge.exposeInMainWorld('overseer', {
  listSessions: (): Promise<Session[]> =>
    ipcRenderer.invoke(IPC.SESSION_LIST),

  createSession: (options: CreateSessionOptions): Promise<Session> =>
    ipcRenderer.invoke(IPC.SESSION_CREATE, options),

  killSession: (sessionId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SESSION_KILL, sessionId),

  getScrollback: (sessionId: string): Promise<string | null> =>
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
})

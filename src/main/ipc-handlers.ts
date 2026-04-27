import { ipcMain, BrowserWindow } from 'electron'
import { SessionService } from './session-service/index'
import { IPC } from '../renderer/types/ipc'
import type { CreateSessionOptions } from '../renderer/types/ipc'
import { runGitCommand } from './git-service'

export function registerIpcHandlers(service: SessionService, getWindow: () => BrowserWindow | null): void {
  service.onData((sessionId, data) => {
    getWindow()?.webContents.send(`pty:data:${sessionId}`, data)
  })

  service.onError((sessionId, err) => {
    getWindow()?.webContents.send(`pty:error:${sessionId}`, err)
  })

  ipcMain.handle(IPC.SESSION_LIST, () => service.list())

  ipcMain.handle(IPC.SESSION_CREATE, (_event, options: CreateSessionOptions) => {
    return service.create(options)
  })

  ipcMain.handle(IPC.SESSION_KILL, (_event, sessionId: string) => {
    service.kill(sessionId)
  })

  ipcMain.handle(IPC.SCROLLBACK_GET, (_event, sessionId: string) => {
    const buf = service.getScrollback(sessionId)
    return buf ? buf.toString('binary') : null
  })

  ipcMain.handle(IPC.PTY_INPUT, (_event, sessionId: string, data: string) => {
    service.writeToSession(sessionId, data)
  })

  ipcMain.handle(IPC.PTY_RESIZE, (_event, sessionId: string, cols: number, rows: number) => {
    service.resizeSession(sessionId, cols, rows)
  })

  ipcMain.handle(IPC.GIT_STATUS, (_event, cwd: string) =>
    runGitCommand('status', cwd))

  ipcMain.handle(IPC.GIT_COMMIT, (_event, cwd: string, message: string) =>
    runGitCommand(`add -A && git commit -m ${JSON.stringify(message)}`, cwd))

  ipcMain.handle(IPC.GIT_PUSH, (_event, cwd: string) =>
    runGitCommand('push', cwd))

  ipcMain.handle(IPC.GIT_PULL, (_event, cwd: string) =>
    runGitCommand('pull', cwd))
}

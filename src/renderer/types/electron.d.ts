import type { Session, CreateSessionOptions, GitCommandResult } from './ipc'

declare global {
  interface Window {
    overseer: {
      listSessions: () => Promise<Session[]>
      createSession: (options: CreateSessionOptions) => Promise<Session>
      killSession: (sessionId: string) => Promise<void>
      getScrollback: (sessionId: string) => Promise<string | null>
      sendInput: (sessionId: string, data: string) => Promise<void>
      resize: (sessionId: string, cols: number, rows: number) => Promise<void>
      onPtyData: (sessionId: string, callback: (data: string) => void) => () => void
      onPtyError: (sessionId: string, callback: (err: string) => void) => () => void
      gitStatus: (cwd: string) => Promise<GitCommandResult>
      gitCommit: (cwd: string, message: string) => Promise<GitCommandResult>
      gitPush: (cwd: string) => Promise<GitCommandResult>
      gitPull: (cwd: string) => Promise<GitCommandResult>
      openDirectory: (currentPath: string) => Promise<string | null>
      isDirectory: (path: string) => Promise<boolean>
    }
  }
}

import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult, Keybindings, ThemeSettings } from './ipc'

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
      syncStatus: () => Promise<DriftStatus>
      syncRun: () => Promise<SyncResult>
      readTheme: () => Promise<ThemeSettings | null>
      writeTheme: (settings: ThemeSettings) => Promise<void>
      readKeybindings: () => Promise<Keybindings | null>
      writeKeybindings: (kb: Keybindings) => Promise<void>
      spawnCompanion: (cwd: string) => Promise<string>
      killCompanion: (companionId: string) => Promise<void>
      sendCompanionInput: (companionId: string, data: string) => Promise<void>
      resizeCompanion: (companionId: string, cols: number, rows: number) => Promise<void>
      onCompanionData: (callback: (id: string, data: string) => void) => () => void
      onCompanionExit: (callback: (id: string) => void) => () => void
      onSpriteSpeech: (callback: (payload: { sessionId: string; text: string }) => void) => () => void
      readSprites: () => Promise<any>
      writeSprites: (settings: any) => Promise<void>
    }
  }
}

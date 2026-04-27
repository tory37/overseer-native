export interface Session {
  id: string
  name: string
  agentType: 'claude' | 'gemini' | 'cursor' | 'shell'
  cwd: string
  envVars: Record<string, string>
  scrollbackPath: string
}

export interface CreateSessionOptions {
  name: string
  agentType: Session['agentType']
  cwd?: string
}

export interface GitCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

export const IPC = {
  SESSION_CREATE:    'session:create',
  SESSION_LIST:      'session:list',
  SESSION_KILL:      'session:kill',
  PTY_INPUT:         'pty:input',
  PTY_RESIZE:        'pty:resize',
  SCROLLBACK_GET:    'scrollback:get',
  GIT_STATUS:        'git:status',
  GIT_COMMIT:        'git:commit',
  GIT_PUSH:          'git:push',
  GIT_PULL:          'git:pull',
  DIALOG_OPEN_DIR:   'dialog:open-directory',
  FS_IS_DIR:         'fs:is-directory',
} as const

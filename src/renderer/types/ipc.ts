export interface Session {
  id: string
  name: string
  agentType: 'claude' | 'gemini' | 'cursor' | 'shell'
  cwd: string
  envVars: Record<string, string>
  scrollbackPath: string
  spriteId: string | null
}

export interface CreateSessionOptions {
  name: string
  agentType: Session['agentType']
  cwd?: string
  spriteId?: string | null
  persona?: string
}

export interface GitCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface DriftStatus {
  lastSyncedAt: string | null
  rules: string[]
  skills: string[]
}

export interface SyncResult {
  ok: boolean
  output: string
}

export interface Theme {
  id: string
  name: string
  colors: Record<string, string>
}

export interface ThemeSettings {
  activeThemeId: string
  customThemes: Theme[]
}

export interface Keybinding {
  code: string
  ctrl: boolean
  shift: boolean
  alt: boolean
}

export type KeybindingAction =
  | 'newSession'
  | 'killSession'
  | 'nextSession'
  | 'prevSession'
  | 'sessionByIndex1'
  | 'sessionByIndex2'
  | 'sessionByIndex3'
  | 'sessionByIndex4'
  | 'sessionByIndex5'
  | 'sessionByIndex6'
  | 'sessionByIndex7'
  | 'sessionByIndex8'
  | 'sessionByIndex9'
  | 'openDrawer'
  | 'openSettings'
  | 'openShortcuts'
  | 'splitFocus'
  | 'splitFocusPrev'
  | 'splitOpenThreeWay'
  | 'splitClose'
  | 'splitSwap'
  | 'splitSwapSecondary'
  | 'splitToggleDirection'
  | 'toggleSpritePanel'
  | 'openSpriteStudio'

export type Keybindings = Record<KeybindingAction, Keybinding>

export const DEFAULT_KEYBINDINGS: Keybindings = {
  newSession:      { code: 'KeyN',         ctrl: true,  shift: true,  alt: false },
  killSession:     { code: 'KeyW',         ctrl: true,  shift: true,  alt: false },
  nextSession:     { code: 'BracketRight', ctrl: true,  shift: true,  alt: false },
  prevSession:     { code: 'BracketLeft',  ctrl: true,  shift: true,  alt: false },
  sessionByIndex1: { code: 'Digit1',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex2: { code: 'Digit2',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex3: { code: 'Digit3',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex4: { code: 'Digit4',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex5: { code: 'Digit5',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex6: { code: 'Digit6',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex7: { code: 'Digit7',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex8: { code: 'Digit8',       ctrl: true,  shift: true,  alt: false },
  sessionByIndex9: { code: 'Digit9',       ctrl: true,  shift: true,  alt: false },
  openDrawer:           { code: 'KeyE',        ctrl: true,  shift: true,  alt: false },
  openSettings:         { code: 'Comma',       ctrl: true,  shift: true,  alt: false },
  openShortcuts:        { code: 'Slash',        ctrl: true,  shift: true,  alt: false },
  splitFocus:           { code: 'Backslash',   ctrl: true,  shift: true,  alt: false },
  splitFocusPrev:       { code: 'Backslash',   ctrl: true,  shift: true,  alt: true  },
  splitOpenThreeWay:    { code: 'Equal',        ctrl: true,  shift: true,  alt: false },
  splitClose:           { code: 'KeyX',         ctrl: true,  shift: true,  alt: false },
  splitSwap:            { code: 'KeyM',         ctrl: true,  shift: true,  alt: false },
  splitSwapSecondary:   { code: 'KeyJ',         ctrl: true,  shift: true,  alt: false },
  splitToggleDirection: { code: 'Backquote',    ctrl: true,  shift: true,  alt: false },
  toggleSpritePanel:    { code: 'KeyS',         ctrl: true,  shift: true,  alt: false },
  openSpriteStudio:     { code: 'KeyP',         ctrl: true,  shift: true,  alt: false },
}

const CODE_LABELS: Record<string, string> = {
  KeyA:'A', KeyB:'B', KeyC:'C', KeyD:'D', KeyE:'E', KeyF:'F', KeyG:'G',
  KeyH:'H', KeyI:'I', KeyJ:'J', KeyK:'K', KeyL:'L', KeyM:'M', KeyN:'N',
  KeyO:'O', KeyP:'P', KeyQ:'Q', KeyR:'R', KeyS:'S', KeyT:'T', KeyU:'U',
  KeyV:'V', KeyW:'W', KeyX:'X', KeyY:'Y', KeyZ:'Z',
  Digit0:'0', Digit1:'1', Digit2:'2', Digit3:'3', Digit4:'4',
  Digit5:'5', Digit6:'6', Digit7:'7', Digit8:'8', Digit9:'9',
  BracketLeft:'[', BracketRight:']', Comma:',', Period:'.', Slash:'/',
  Semicolon:';', Quote:"'", Backquote:'`', Backslash:'\\', Minus:'-', Equal:'=',
  Tab:'Tab', Enter:'Enter', Escape:'Escape', Space:'Space',
  F1:'F1', F2:'F2', F3:'F3', F4:'F4', F5:'F5', F6:'F6',
  F7:'F7', F8:'F8', F9:'F9', F10:'F10', F11:'F11', F12:'F12',
}

export function formatKeybinding(kb: Keybinding): string {
  const parts: string[] = []
  if (kb.ctrl)  parts.push('Ctrl')
  if (kb.shift) parts.push('Shift')
  if (kb.alt)   parts.push('Alt')
  parts.push(CODE_LABELS[kb.code] ?? kb.code)
  return parts.join('+')
}

export function matchKeybinding(keybindings: Keybindings, e: KeyboardEvent): KeybindingAction | null {
  for (const [action, binding] of Object.entries(keybindings) as [KeybindingAction, Keybinding][]) {
    if (
      e.code      === binding.code &&
      e.ctrlKey   === binding.ctrl &&
      e.shiftKey  === binding.shift &&
      e.altKey    === binding.alt
    ) {
      return action
    }
  }
  return null
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
  SYNC_STATUS:       'sync:status',
  SYNC_RUN:          'sync:run',
  KEYBINDINGS_READ:  'keybindings:read',
  KEYBINDINGS_WRITE: 'keybindings:write',
  THEME_READ:        'theme:read',
  THEME_WRITE:       'theme:write',
  COMPANION_SPAWN:   'companion:spawn',
  COMPANION_KILL:    'companion:kill',
  COMPANION_INPUT:   'companion:input',
  COMPANION_RESIZE:  'companion:resize',
  SPRITE_SPEECH:     'sprite:speech',
} as const

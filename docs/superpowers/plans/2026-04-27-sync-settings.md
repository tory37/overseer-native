# Sync & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SyncService that detects drift in `~/.ai-context/rules/` and `~/.ai-context/skills/` and shells out to `~/.local/bin/ai-sync`, wired to a SettingsModal (gear icon in header) and auto-fired on session start.

**Architecture:** `SyncService` (main process) reads a state file for last-synced timestamp, diffs mtimes of rule/skill files against it, and shells out to the existing `ai-sync` script. IPC channels expose drift status and sync trigger to the renderer. A `SettingsModal` component opened by a header gear icon displays the drift state and a Sync Now button.

**Tech Stack:** Node.js `fs`/`child_process` (sync-service), Electron IPC (`ipcMain.handle`/`contextBridge`), React (SettingsModal), Jest + Testing Library (tests).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/renderer/types/ipc.ts` | Add `DriftStatus`, `SyncResult` types; `SYNC_STATUS`, `SYNC_RUN` IPC constants |
| Modify | `src/renderer/types/electron.d.ts` | Add `syncStatus`, `syncRun` to `window.overseer` interface |
| **Create** | `src/main/services/sync-service.ts` | `SyncService` class — drift detection + ai-sync invocation |
| Modify | `src/main/ipc-handlers.ts` | Accept `SyncService`, register `SYNC_STATUS`/`SYNC_RUN` handlers, fire auto-sync on session create |
| Modify | `src/main/preload.ts` | Expose `syncStatus`, `syncRun` via contextBridge |
| Modify | `src/main/index.ts` | Instantiate `SyncService`, pass to `registerIpcHandlers` |
| **Create** | `src/renderer/components/SettingsModal.tsx` | Settings overlay with sync section |
| Modify | `src/renderer/App.tsx` | Add gear icon button, `showSettings` state, render `SettingsModal` |
| Modify | `~/.overseer/agents/claude.json` | Remove useless API key and config dir entries |
| Modify | `~/.overseer/agents/gemini.json` | Remove useless API key and config dir entries |
| **Create** | `tests/main/sync-service.test.ts` | Unit tests for `SyncService` |
| **Create** | `tests/renderer/SettingsModal.test.tsx` | Rendering tests for `SettingsModal` |

---

## Task 1: Types & IPC Constants

**Files:**
- Modify: `src/renderer/types/ipc.ts`
- Modify: `src/renderer/types/electron.d.ts`

- [ ] **Step 1: Add types and constants to `src/renderer/types/ipc.ts`**

Replace the file with:

```typescript
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

export interface DriftStatus {
  lastSyncedAt: string | null
  rules: string[]
  skills: string[]
}

export interface SyncResult {
  ok: boolean
  output: string
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
} as const
```

- [ ] **Step 2: Update `src/renderer/types/electron.d.ts`**

Replace the file with:

```typescript
import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult } from './ipc'

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
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/types/ipc.ts src/renderer/types/electron.d.ts
git commit -m "feat: add DriftStatus, SyncResult types and SYNC_STATUS/SYNC_RUN IPC constants"
```

---

## Task 2: SyncService

**Files:**
- Create: `src/main/services/sync-service.ts`
- Create: `tests/main/sync-service.test.ts`

- [ ] **Step 1: Write the failing tests in `tests/main/sync-service.test.ts`**

```typescript
import fs from 'fs'
import os from 'os'
import path from 'path'
import { SyncService } from '../../src/main/services/sync-service'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overseer-sync-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeService(overrides: {
  stateFile?: string
  aiSync?: string
  rulesDir?: string
  skillsDir?: string
} = {}) {
  return new SyncService({
    stateFile: overrides.stateFile ?? path.join(tmpDir, 'sync-state.json'),
    aiSync: overrides.aiSync ?? path.join(tmpDir, 'no-such-script'),
    rulesDir: overrides.rulesDir ?? path.join(tmpDir, 'rules'),
    skillsDir: overrides.skillsDir ?? path.join(tmpDir, 'skills'),
  })
}

test('getDriftStatus returns null lastSyncedAt and empty arrays when nothing exists', () => {
  const svc = makeService()
  const status = svc.getDriftStatus()
  expect(status.lastSyncedAt).toBeNull()
  expect(status.rules).toEqual([])
  expect(status.skills).toEqual([])
})

test('getDriftStatus lists all .md files as drifted when never synced', () => {
  const rulesDir = path.join(tmpDir, 'rules')
  const skillsDir = path.join(tmpDir, 'skills')
  fs.mkdirSync(rulesDir)
  fs.mkdirSync(skillsDir)
  fs.writeFileSync(path.join(rulesDir, 'global.md'), '# global')
  fs.writeFileSync(path.join(rulesDir, 'not-md.txt'), 'ignored')
  fs.writeFileSync(path.join(skillsDir, 'brainstorming.md'), '# brainstorming')
  const svc = makeService({ rulesDir, skillsDir })
  const status = svc.getDriftStatus()
  expect(status.rules).toEqual(['global.md'])
  expect(status.skills).toEqual(['brainstorming.md'])
})

test('getDriftStatus returns empty lists when files predate lastSyncedAt', () => {
  const rulesDir = path.join(tmpDir, 'rules')
  fs.mkdirSync(rulesDir)
  fs.writeFileSync(path.join(rulesDir, 'global.md'), '# global')
  const stateFile = path.join(tmpDir, 'sync-state.json')
  fs.writeFileSync(stateFile, JSON.stringify({ lastSyncedAt: new Date(Date.now() + 60_000).toISOString() }))
  const svc = new SyncService({
    stateFile,
    rulesDir,
    skillsDir: path.join(tmpDir, 'skills'),
    aiSync: path.join(tmpDir, 'no-such-script'),
  })
  const status = svc.getDriftStatus()
  expect(status.rules).toEqual([])
})

test('getDriftStatus returns null lastSyncedAt for malformed state file', () => {
  const stateFile = path.join(tmpDir, 'sync-state.json')
  fs.writeFileSync(stateFile, 'not json')
  const svc = makeService({ stateFile })
  expect(svc.getDriftStatus().lastSyncedAt).toBeNull()
})

test('runSync returns ok:false when ai-sync not found', async () => {
  const svc = makeService({ aiSync: path.join(tmpDir, 'no-such-script') })
  const result = await svc.runSync()
  expect(result.ok).toBe(false)
  expect(result.output).toMatch(/not found/)
})

test('runSync returns ok:true and writes state file when script exits 0', async () => {
  const scriptPath = path.join(tmpDir, 'ai-sync')
  fs.writeFileSync(scriptPath, '#!/bin/sh\necho synced')
  fs.chmodSync(scriptPath, 0o755)
  const stateFile = path.join(tmpDir, 'sync-state.json')
  const svc = new SyncService({
    aiSync: scriptPath,
    stateFile,
    rulesDir: path.join(tmpDir, 'rules'),
    skillsDir: path.join(tmpDir, 'skills'),
  })
  const result = await svc.runSync()
  expect(result.ok).toBe(true)
  expect(result.output).toContain('synced')
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
  expect(typeof state.lastSyncedAt).toBe('string')
})

test('runSync returns ok:false and does not update state file when script exits non-zero', async () => {
  const scriptPath = path.join(tmpDir, 'ai-sync')
  fs.writeFileSync(scriptPath, '#!/bin/sh\necho failed >&2\nexit 1')
  fs.chmodSync(scriptPath, 0o755)
  const stateFile = path.join(tmpDir, 'sync-state.json')
  const svc = new SyncService({
    aiSync: scriptPath,
    stateFile,
    rulesDir: path.join(tmpDir, 'rules'),
    skillsDir: path.join(tmpDir, 'skills'),
  })
  const result = await svc.runSync()
  expect(result.ok).toBe(false)
  expect(fs.existsSync(stateFile)).toBe(false)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest tests/main/sync-service.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/main/services/sync-service'`

- [ ] **Step 3: Create `src/main/services/sync-service.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { DriftStatus, SyncResult } from '../../renderer/types/ipc'

const execAsync = promisify(exec)

interface SyncServicePaths {
  stateFile?: string
  aiSync?: string
  rulesDir?: string
  skillsDir?: string
}

export class SyncService {
  private stateFile: string
  private aiSync: string
  private rulesDir: string
  private skillsDir: string

  constructor(paths: SyncServicePaths = {}) {
    const home = os.homedir()
    this.stateFile = paths.stateFile ?? path.join(home, '.overseer', 'sync-state.json')
    this.aiSync    = paths.aiSync    ?? path.join(home, '.local', 'bin', 'ai-sync')
    this.rulesDir  = paths.rulesDir  ?? path.join(home, '.ai-context', 'rules')
    this.skillsDir = paths.skillsDir ?? path.join(home, '.ai-context', 'skills')
  }

  private getLastSyncedAt(): Date | null {
    try {
      const raw = fs.readFileSync(this.stateFile, 'utf-8')
      const parsed = JSON.parse(raw)
      if (typeof parsed.lastSyncedAt === 'string') return new Date(parsed.lastSyncedAt)
    } catch {
      // missing or malformed
    }
    return null
  }

  private writeSyncedAt(date: Date): void {
    fs.writeFileSync(this.stateFile, JSON.stringify({ lastSyncedAt: date.toISOString() }), 'utf-8')
  }

  private driftedFiles(dir: string, since: Date | null): string[] {
    try {
      return fs.readdirSync(dir).filter(name => {
        if (!name.endsWith('.md')) return false
        const mtime = fs.statSync(path.join(dir, name)).mtime
        return since === null || mtime > since
      })
    } catch {
      return []
    }
  }

  getDriftStatus(): DriftStatus {
    const lastSyncedAt = this.getLastSyncedAt()
    return {
      lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
      rules:  this.driftedFiles(this.rulesDir,  lastSyncedAt),
      skills: this.driftedFiles(this.skillsDir, lastSyncedAt),
    }
  }

  async runSync(): Promise<SyncResult> {
    try {
      fs.accessSync(this.aiSync, fs.constants.X_OK)
    } catch {
      return { ok: false, output: `ai-sync not found at ${this.aiSync}` }
    }
    try {
      const { stdout, stderr } = await execAsync(this.aiSync)
      this.writeSyncedAt(new Date())
      return { ok: true, output: stdout + stderr }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      const output = ((e.stdout ?? '') + (e.stderr ?? '')) || (e.message ?? 'Unknown error')
      return { ok: false, output }
    }
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest tests/main/sync-service.test.ts --no-coverage
```

Expected: PASS — 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/main/services/sync-service.ts tests/main/sync-service.test.ts
git commit -m "feat: SyncService — drift detection and ai-sync invocation"
```

---

## Task 3: IPC Wiring

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/preload.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: Update `src/main/ipc-handlers.ts`**

Replace the file with:

```typescript
import { ipcMain, BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import { SessionService } from './session-service/index'
import { SyncService } from './services/sync-service'
import { IPC } from '../renderer/types/ipc'
import type { CreateSessionOptions } from '../renderer/types/ipc'
import { runGitCommand } from './git-service'

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
}
```

- [ ] **Step 2: Update `src/main/preload.ts`**

Replace the file with:

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../renderer/types/ipc'
import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult } from '../renderer/types/ipc'

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

  syncStatus: (): Promise<DriftStatus> =>
    ipcRenderer.invoke(IPC.SYNC_STATUS),

  syncRun: (): Promise<SyncResult> =>
    ipcRenderer.invoke(IPC.SYNC_RUN),
})
```

- [ ] **Step 3: Update `src/main/index.ts`**

Replace the file with:

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { SessionService } from './session-service/index'
import { SyncService } from './services/sync-service'
import { registerIpcHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null
const sessionService = new SessionService()
const syncService = new SyncService()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  registerIpcHandlers(sessionService, syncService, () => mainWindow)
  sessionService.restoreAll()

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

- [ ] **Step 4: Run existing tests to confirm nothing broke**

```bash
npx jest --no-coverage
```

Expected: All tests pass (including the 7 new SyncService tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc-handlers.ts src/main/preload.ts src/main/index.ts
git commit -m "feat: wire SyncService into IPC handlers and preload"
```

---

## Task 4: SettingsModal Component

**Files:**
- Create: `src/renderer/components/SettingsModal.tsx`
- Create: `tests/renderer/SettingsModal.test.tsx`

- [ ] **Step 1: Write the failing tests in `tests/renderer/SettingsModal.test.tsx`**

```typescript
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SettingsModal } from '../../src/renderer/components/SettingsModal'
import type { DriftStatus, SyncResult } from '../../src/renderer/types/ipc'

const noDrift: DriftStatus = { lastSyncedAt: '2026-04-27T12:00:00.000Z', rules: [], skills: [] }
const withDrift: DriftStatus = { lastSyncedAt: null, rules: ['global.md', 'compression.md'], skills: ['brainstorming.md'] }
const successResult: SyncResult = { ok: true, output: 'Synced.' }
const failResult: SyncResult = { ok: false, output: 'Error: script not found' }

function setupMocks(status: DriftStatus, syncResult: SyncResult) {
  Object.defineProperty(window, 'overseer', {
    value: {
      syncStatus: jest.fn().mockResolvedValue(status),
      syncRun: jest.fn().mockResolvedValue(syncResult),
    },
    writable: true,
    configurable: true,
  })
}

test('shows "Never" when lastSyncedAt is null', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/Never/)).toBeInTheDocument())
})

test('shows drift counts when status loads', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/Rules:.*2 changed/)).toBeInTheDocument())
  expect(screen.getByText(/Skills:.*1 changed/)).toBeInTheDocument()
})

test('shows drifted filenames', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/global\.md/)).toBeInTheDocument())
  expect(screen.getByText(/brainstorming\.md/)).toBeInTheDocument()
})

test('shows "0 changed" when no drift', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => expect(screen.getAllByText(/0 changed/).length).toBeGreaterThan(0))
})

test('clicking Sync Now calls syncRun', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(window.overseer.syncRun as jest.Mock).toHaveBeenCalled())
})

test('shows error output when sync fails', async () => {
  setupMocks(noDrift, failResult)
  render(<SettingsModal onClose={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(screen.getByText(/Error: script not found/)).toBeInTheDocument())
})

test('calls onClose when close button clicked', async () => {
  setupMocks(noDrift, successResult)
  const onClose = jest.fn()
  render(<SettingsModal onClose={onClose} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByTitle('Close settings'))
  expect(onClose).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest tests/renderer/SettingsModal.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/renderer/components/SettingsModal'`

- [ ] **Step 3: Create `src/renderer/components/SettingsModal.tsx`**

```tsx
import React, { useEffect, useState } from 'react'
import type { DriftStatus, SyncResult } from '../types/ipc'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<DriftStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    window.overseer.syncStatus().then(setStatus)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setLastResult(null)
    const result = await window.overseer.syncRun()
    setLastResult(result)
    if (result.ok) {
      const updated = await window.overseer.syncStatus()
      setStatus(updated)
    }
    setSyncing(false)
  }

  const formatTimestamp = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : 'Never'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 480, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Settings</h2>
          <button
            title="Close settings"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Sync</h3>
          <div style={{ borderTop: '1px solid #444', paddingTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              Last synced: {status ? formatTimestamp(status.lastSyncedAt) : '…'}
            </div>
            {status && (
              <>
                <div style={{ marginBottom: 4 }}>
                  Rules: {status.rules.length} changed
                  {status.rules.length > 0 && (
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      ({status.rules.join(', ')})
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  Skills: {status.skills.length} changed
                  {status.skills.length > 0 && (
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      ({status.skills.join(', ')})
                    </span>
                  )}
                </div>
              </>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ background: '#0e639c', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            {lastResult && !lastResult.ok && (
              <pre style={{ marginTop: 12, padding: 8, background: '#1e1e1e', border: '1px solid #c00', borderRadius: 4, color: '#f88', fontSize: 11, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>
                {lastResult.output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest tests/renderer/SettingsModal.test.tsx --no-coverage
```

Expected: PASS — 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/SettingsModal.tsx tests/renderer/SettingsModal.test.tsx
git commit -m "feat: SettingsModal component with sync section"
```

---

## Task 5: App.tsx Header Update

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Update `src/renderer/App.tsx`**

Replace the file with:

```tsx
import React, { useEffect, useState } from 'react'
import { useSessionStore } from './store/sessions'
import { TabBar } from './components/TabBar'
import { TerminalPane } from './components/TerminalPane'
import { GitPanel } from './components/GitPanel'
import { NewSessionDialog } from './components/NewSessionDialog'
import { SessionDrawer } from './components/SessionDrawer'
import { SettingsModal } from './components/SettingsModal'
import type { CreateSessionOptions } from './types/ipc'

export default function App() {
  const { sessions, activeSessionId, load, createSession, killSession, setActive } = useSessionStore()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { load() }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const handleCreate = async (options: CreateSessionOptions) => {
    await createSession(options)
    setShowNewDialog(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#2d2d2d' }}>
        <button
          onClick={() => setShowDrawer(true)}
          style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}
          title="All sessions"
        >
          ☰
        </button>
        <TabBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActive}
          onNew={() => setShowNewDialog(true)}
        />
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', marginLeft: 'auto' }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TerminalPane sessions={sessions} activeSessionId={activeSessionId} />
        {activeSession && <GitPanel cwd={activeSession.cwd} />}
      </div>

      {showNewDialog && (
        <NewSessionDialog
          onCreate={handleCreate}
          onCancel={() => setShowNewDialog(false)}
        />
      )}

      {showDrawer && (
        <SessionDrawer
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActive}
          onKill={async (id) => { try { await killSession(id) } catch (err) { console.error('kill session failed:', err) } }}
          onClose={() => setShowDrawer(false)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: add gear icon to header and wire SettingsModal"
```

---

## Task 6: Agent Config Cleanup

**Files:**
- Modify: `~/.overseer/agents/claude.json`
- Modify: `~/.overseer/agents/gemini.json`

- [ ] **Step 1: Clean up `~/.overseer/agents/claude.json`**

Replace the file contents with:

```json
{ "env": {} }
```

- [ ] **Step 2: Clean up `~/.overseer/agents/gemini.json`**

Replace the file contents with:

```json
{ "env": {} }
```

- [ ] **Step 3: Run the full test suite one final time**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add ~/.overseer/agents/claude.json ~/.overseer/agents/gemini.json
git commit -m "chore: remove stale API key and config dir entries from agent configs"
```

---

## Self-Review

**Spec coverage check:**
- SyncService with `getDriftStatus()` and `runSync()` — Task 2 ✓
- `~/.overseer/sync-state.json` state file — Task 2 ✓
- IPC channels `sync:status` and `sync:run` — Tasks 1 & 3 ✓
- Preload exposes `syncStatus` and `syncRun` — Task 3 ✓
- `SettingsModal` with last-synced, drift counts, file list, Sync Now button — Task 4 ✓
- Gear icon in header opens SettingsModal — Task 5 ✓
- Auto-sync fires on session create (fire-and-forget) — Task 3 ✓
- Error display when sync fails — Task 4 ✓
- Agent config cleanup — Task 6 ✓
- `ai-sync` not found → graceful error message — Task 2 ✓
- Missing dirs/state file → zero drift, no crash — Task 2 ✓

**Placeholder scan:** No TBD, TODO, or "similar to" references found.

**Type consistency check:** `DriftStatus` and `SyncResult` defined once in `ipc.ts` and referenced by name in `sync-service.ts`, `electron.d.ts`, `preload.ts`, and `SettingsModal.tsx`. `SyncService` constructor parameter type `SyncServicePaths` is local to `sync-service.ts`. Test helper `makeService()` matches all four fields (`stateFile`, `aiSync`, `rulesDir`, `skillsDir`). `registerIpcHandlers` signature change (added `syncService: SyncService` as second param) is consistent in both `ipc-handlers.ts` and `index.ts`.

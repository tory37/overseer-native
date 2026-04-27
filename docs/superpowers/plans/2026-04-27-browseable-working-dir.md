# Browseable Working Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Browse button and live debounced path validation to the Working Directory field in NewSessionDialog; make the field optional (empty = home dir).

**Architecture:** Two new Electron IPC channels (`dialog:open-directory`, `fs:is-directory`) are added to the main process and exposed via preload. The renderer component gains a Browse button, optional `cwd` state (defaults to empty string), and a 400ms debounced validation effect that shows a red border + error when the typed path is not a real directory.

**Tech Stack:** Electron (dialog, fs.promises, os), React (useState, useEffect), TypeScript, Jest + @testing-library/react

---

### Task 1: Make cwd optional in types and session service

**Files:**
- Modify: `src/renderer/types/ipc.ts`
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Update `ipc.ts` — make `cwd` optional in `CreateSessionOptions` and add two IPC constants**

Replace the contents of `src/renderer/types/ipc.ts`:

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
```

- [ ] **Step 2: Default empty/missing cwd to `os.homedir()` in session service**

In `src/main/session-service/index.ts`, change the `create` method's session construction from:

```typescript
cwd: options.cwd,
```

to:

```typescript
cwd: options.cwd || os.homedir(),
```

(`os` is already imported in that file.)

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/renderer/types/ipc.ts src/main/session-service/index.ts
git commit -m "feat: make session cwd optional, add dialog+fs IPC constants"
```

---

### Task 2: Add main-process IPC handlers

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Create: `tests/main/ipc-helpers.test.ts`

- [ ] **Step 1: Write failing tests for `isDirectory`**

Create `tests/main/ipc-helpers.test.ts`:

```typescript
import os from 'os'
import path from 'path'
import fs from 'fs'
import { isDirectory } from '../../src/main/ipc-handlers'

const tmpDir = path.join(os.tmpdir(), 'overseer-ipchelpers-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

test('returns true for an existing directory', async () => {
  expect(await isDirectory(tmpDir)).toBe(true)
})

test('returns false for a nonexistent path', async () => {
  expect(await isDirectory(path.join(tmpDir, 'nope'))).toBe(false)
})

test('returns false for a file', async () => {
  const file = path.join(tmpDir, 'file.txt')
  fs.writeFileSync(file, 'x')
  expect(await isDirectory(file)).toBe(false)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
npm test -- --testPathPattern=ipc-helpers
```

Expected: FAIL — "isDirectory is not exported"

- [ ] **Step 3: Export `isDirectory` and add both IPC handlers in `ipc-handlers.ts`**

Replace the contents of `src/main/ipc-handlers.ts`:

```typescript
import { ipcMain, BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import { SessionService } from './session-service/index'
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

export function registerIpcHandlers(service: SessionService, getWindow: () => BrowserWindow | null): void {
  service.onData((sessionId, data) => {
    getWindow()?.webContents.send(`pty:data:${sessionId}`, data)
  })

  service.onError((sessionId, err) => {
    getWindow()?.webContents.send(`pty:error:${sessionId}`, err)
  })

  ipcMain.handle(IPC.SESSION_LIST, () => service.list())
  ipcMain.handle(IPC.SESSION_CREATE, (_event, options: CreateSessionOptions) => service.create(options))
  ipcMain.handle(IPC.SESSION_KILL, (_event, sessionId: string) => service.kill(sessionId))
  ipcMain.handle(IPC.SCROLLBACK_GET, (_event, sessionId: string) => {
    const buf = service.getScrollback(sessionId)
    return buf ? buf.toString('binary') : null
  })
  ipcMain.handle(IPC.PTY_INPUT, (_event, sessionId: string, data: string) => service.writeToSession(sessionId, data))
  ipcMain.handle(IPC.PTY_RESIZE, (_event, sessionId: string, cols: number, rows: number) => service.resizeSession(sessionId, cols, rows))
  ipcMain.handle(IPC.GIT_STATUS, (_event, cwd: string) => runGitCommand('status', cwd))
  ipcMain.handle(IPC.GIT_COMMIT, (_event, cwd: string, message: string) => runGitCommand(`add -A && git commit -m ${JSON.stringify(message)}`, cwd))
  ipcMain.handle(IPC.GIT_PUSH, (_event, cwd: string) => runGitCommand('push', cwd))
  ipcMain.handle(IPC.GIT_PULL, (_event, cwd: string) => runGitCommand('pull', cwd))

  ipcMain.handle(IPC.DIALOG_OPEN_DIR, async (_event, currentPath: string) => {
    const defaultPath = currentPath || os.homedir()
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], defaultPath })
    return result.cancelled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.FS_IS_DIR, (_event, p: string) => isDirectory(p))
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --testPathPattern=ipc-helpers
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc-handlers.ts tests/main/ipc-helpers.test.ts
git commit -m "feat: add isDirectory helper and dialog/fs IPC handlers"
```

---

### Task 3: Expose new channels in preload and type declarations

**Files:**
- Modify: `src/main/preload.ts`
- Modify: `src/renderer/types/electron.d.ts`

- [ ] **Step 1: Add two entries to `preload.ts`**

Inside the `contextBridge.exposeInMainWorld('overseer', { ... })` object in `src/main/preload.ts`, add after the existing `gitPull` entry:

```typescript
  openDirectory: (currentPath: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.DIALOG_OPEN_DIR, currentPath),

  isDirectory: (p: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.FS_IS_DIR, p),
```

- [ ] **Step 2: Add type signatures to `electron.d.ts`**

In `src/renderer/types/electron.d.ts`, add two lines inside the `overseer` interface after `gitPull`:

```typescript
      openDirectory: (currentPath: string) => Promise<string | null>
      isDirectory: (path: string) => Promise<boolean>
```

- [ ] **Step 3: Build main process to verify no TypeScript errors**

```
npm run build:main
```

Expected: exits 0, no errors

- [ ] **Step 4: Commit**

```bash
git add src/main/preload.ts src/renderer/types/electron.d.ts
git commit -m "feat: expose openDirectory and isDirectory via preload"
```

---

### Task 4: Update NewSessionDialog with Browse button and validation

**Files:**
- Modify: `src/renderer/components/NewSessionDialog.tsx`
- Modify: `tests/renderer/NewSessionDialog.test.tsx`

- [ ] **Step 1: Write failing tests**

Replace the contents of `tests/renderer/NewSessionDialog.test.tsx`:

```typescript
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NewSessionDialog } from '../../src/renderer/components/NewSessionDialog'

beforeEach(() => {
  jest.useFakeTimers()
  ;(window as any).overseer = {
    openDirectory: jest.fn().mockResolvedValue(null),
    isDirectory: jest.fn().mockResolvedValue(true),
  }
})

afterEach(() => {
  jest.useRealTimers()
})

test('calls onCreate with form values on submit', async () => {
  const onCreate = jest.fn()
  render(<NewSessionDialog onCancel={() => {}} onCreate={onCreate} />)

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'my-session' } })
  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/home/user/project' } })
  fireEvent.change(screen.getByLabelText('Agent'), { target: { value: 'claude' } })

  await act(async () => { jest.advanceTimersByTime(400) })

  fireEvent.click(screen.getByText('Create'))

  expect(onCreate).toHaveBeenCalledWith({
    name: 'my-session',
    agentType: 'claude',
    cwd: '/home/user/project',
  })
})

test('calls onCancel when Cancel is clicked', () => {
  const onCancel = jest.fn()
  render(<NewSessionDialog onCancel={onCancel} onCreate={() => {}} />)
  fireEvent.click(screen.getByText('Cancel'))
  expect(onCancel).toHaveBeenCalled()
})

test('Browse button opens directory picker and sets cwd', async () => {
  ;(window as any).overseer.openDirectory = jest.fn().mockResolvedValue('/chosen/path')
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  await act(async () => {
    fireEvent.click(screen.getByText('Browse'))
  })

  expect((window as any).overseer.openDirectory).toHaveBeenCalled()
  expect(screen.getByLabelText('Working Directory')).toHaveValue('/chosen/path')
})

test('cancelled Browse does not change cwd', async () => {
  ;(window as any).overseer.openDirectory = jest.fn().mockResolvedValue(null)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  await act(async () => {
    fireEvent.click(screen.getByText('Browse'))
  })

  expect(screen.getByLabelText('Working Directory')).toHaveValue('')
})

test('shows error after debounce for invalid path', async () => {
  ;(window as any).overseer.isDirectory = jest.fn().mockResolvedValue(false)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/bad/path' } })

  await act(async () => { jest.advanceTimersByTime(400) })
  await act(async () => {})

  expect(screen.getByText('Directory not found')).toBeInTheDocument()
})

test('no error shown for valid path', async () => {
  ;(window as any).overseer.isDirectory = jest.fn().mockResolvedValue(true)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/valid/path' } })

  await act(async () => { jest.advanceTimersByTime(400) })
  await act(async () => {})

  expect(screen.queryByText('Directory not found')).not.toBeInTheDocument()
})

test('no error and no IPC call when cwd is empty', () => {
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)
  expect(screen.queryByText('Directory not found')).not.toBeInTheDocument()
  expect((window as any).overseer.isDirectory).not.toHaveBeenCalled()
})

test('allows Create with empty cwd', () => {
  const onCreate = jest.fn()
  render(<NewSessionDialog onCancel={() => {}} onCreate={onCreate} />)

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'my-session' } })
  fireEvent.click(screen.getByText('Create'))

  expect(onCreate).toHaveBeenCalledWith({
    name: 'my-session',
    agentType: 'shell',
    cwd: '',
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --testPathPattern=NewSessionDialog
```

Expected: multiple failures — Browse button not found, error message not found, etc.

- [ ] **Step 3: Implement the updated `NewSessionDialog`**

Replace the contents of `src/renderer/components/NewSessionDialog.tsx`:

```tsx
import React, { useState, useEffect } from 'react'
import type { CreateSessionOptions, Session } from '../types/ipc'

interface Props {
  onCreate: (options: CreateSessionOptions) => void
  onCancel: () => void
}

export function NewSessionDialog({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('')
  const [agentType, setAgentType] = useState<Session['agentType']>('shell')
  const [cwd, setCwd] = useState('')
  const [cwdValid, setCwdValid] = useState<boolean | null>(null)

  useEffect(() => {
    setCwdValid(null)
    if (!cwd) return
    const timer = setTimeout(async () => {
      const valid = await window.overseer.isDirectory(cwd)
      setCwdValid(valid)
    }, 400)
    return () => clearTimeout(timer)
  }, [cwd])

  const handleBrowse = async () => {
    const chosen = await window.overseer.openDirectory(cwd)
    if (chosen) setCwd(chosen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, agentType, cwd })
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: '#2d2d2d', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '360px',
  }
  const labelStyle: React.CSSProperties = { color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }
  const inputStyle: React.CSSProperties = { background: '#1e1e1e', color: '#eee', border: '1px solid #555', borderRadius: '4px', padding: '6px 8px' }
  const cwdInputStyle: React.CSSProperties = {
    ...inputStyle,
    flex: 1,
    border: cwdValid === false ? '1px solid #e05252' : '1px solid #555',
  }

  return (
    <div style={overlayStyle}>
      <form style={dialogStyle} onSubmit={handleSubmit}>
        <h2 style={{ color: '#eee', margin: 0 }}>New Session</h2>
        <label style={labelStyle} htmlFor="session-name">
          Name
          <input id="session-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label style={labelStyle} htmlFor="agent-type">
          Agent
          <select id="agent-type" aria-label="Agent" style={inputStyle} value={agentType} onChange={e => setAgentType(e.target.value as Session['agentType'])}>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="cursor">Cursor</option>
            <option value="shell">Shell</option>
          </select>
        </label>
        <label style={labelStyle} htmlFor="cwd">
          Working Directory
          <div style={{ display: 'flex', gap: '6px' }}>
            <input id="cwd" aria-label="Working Directory" style={cwdInputStyle} value={cwd} onChange={e => setCwd(e.target.value)} />
            <button type="button" onClick={handleBrowse} style={{ ...inputStyle, cursor: 'pointer', whiteSpace: 'nowrap' }}>Browse</button>
          </div>
          {cwdValid === false && <span style={{ color: '#e05252', fontSize: '12px' }}>Directory not found</span>}
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ ...inputStyle, background: '#0e639c', cursor: 'pointer' }}>Create</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run NewSessionDialog tests to confirm they pass**

```
npm test -- --testPathPattern=NewSessionDialog
```

Expected: all 8 tests pass

- [ ] **Step 5: Run full test suite to confirm no regressions**

```
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/NewSessionDialog.tsx tests/renderer/NewSessionDialog.test.tsx
git commit -m "feat: add Browse button and live path validation to NewSessionDialog"
```

# Split Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transient companion shell pane that splits alongside any active session, controlled entirely by keyboard shortcuts.

**Architecture:** A `CompanionPtyManager` in the main process manages a single short-lived PTY (never persisted to the session registry). The renderer hosts a `useCompanion` hook that tracks split state (`splitOpen`, `splitDirection`, `splitSwapped`, `splitFocused`) and a `CompanionTerminal` component that mirrors `TerminalInstance` but targets companion IPC channels. `TerminalPane` switches between its existing single-pane layout and a flexbox split based on hook state.

**Tech Stack:** Electron + node-pty (main), React + xterm.js 5 + `@xterm/addon-fit` (renderer), Zustand (sessions, untouched), Jest + `@testing-library/react` (tests).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/renderer/types/ipc.ts` | Modify | Add companion IPC constants + 3 new keybinding actions |
| `src/main/companion-pty-manager.ts` | **Create** | Single-companion transient PTY manager |
| `src/main/ipc-handlers.ts` | Modify | Register companion IPC handlers |
| `src/main/preload.ts` | Modify | Expose companion API via contextBridge |
| `src/renderer/hooks/useKeyboardShortcuts.ts` | Modify | Add split handlers to ShortcutHandlers + dispatch |
| `src/renderer/components/KeyboardShortcutsModal.tsx` | Modify | Add ACTION_LABELS for 3 new actions |
| `src/renderer/hooks/useCompanion.ts` | **Create** | Split state and companion lifecycle |
| `src/renderer/components/CompanionTerminal.tsx` | **Create** | xterm instance wired to companion IPC |
| `src/renderer/components/TerminalPane.tsx` | Modify | Render flexbox split when splitOpen |
| `src/renderer/App.tsx` | Modify | Wire useCompanion + new shortcut handlers |
| `tests/main/companion-pty-manager.test.ts` | **Create** | PTY spawn/write/kill tests |
| `tests/renderer/useCompanion.test.tsx` | **Create** | Hook state logic tests |
| `tests/renderer/useKeyboardShortcuts.test.tsx` | Modify | Add tests for 3 new shortcut actions |

---

## Task 1: Extend IPC types

**Files:**
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add companion IPC constants and new keybinding actions**

In `src/renderer/types/ipc.ts`, apply the following changes:

Add to the `KeybindingAction` union (after `'openShortcuts'`):
```ts
  | 'splitFocus'
  | 'splitSwap'
  | 'splitToggleDirection'
```

Add to `DEFAULT_KEYBINDINGS` (after `openShortcuts`):
```ts
  splitFocus:           { code: 'Backslash',  ctrl: true, shift: true, alt: false },
  splitSwap:            { code: 'KeyM',       ctrl: true, shift: true, alt: false },
  splitToggleDirection: { code: 'Backquote',  ctrl: true, shift: true, alt: false },
```

Add to the `IPC` object (after `KEYBINDINGS_WRITE`):
```ts
  COMPANION_SPAWN:  'companion:spawn',
  COMPANION_KILL:   'companion:kill',
  COMPANION_INPUT:  'companion:input',
  COMPANION_RESIZE: 'companion:resize',
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.renderer.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/types/ipc.ts
git commit -m "feat: add companion IPC constants and split keybinding actions"
```

---

## Task 2: Create CompanionPtyManager

**Files:**
- Create: `src/main/companion-pty-manager.ts`
- Create: `tests/main/companion-pty-manager.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/main/companion-pty-manager.test.ts`:

```ts
import { CompanionPtyManager } from '../../src/main/companion-pty-manager'

test('spawns a companion PTY and receives stdout', (done) => {
  const mgr = new CompanionPtyManager()
  const received: string[] = []
  const id = mgr.spawn((data) => {
    received.push(data)
    if (received.join('').includes('hello-companion')) {
      mgr.kill(id)
      done()
    }
  }, () => {})
  setTimeout(() => mgr.write(id, 'echo hello-companion\r'), 100)
}, 5000)

test('has() returns true after spawn and false after kill', (done) => {
  const mgr = new CompanionPtyManager()
  const id = mgr.spawn(() => {}, () => {})
  expect(mgr.has(id)).toBe(true)
  setTimeout(() => {
    mgr.kill(id)
    expect(mgr.has(id)).toBe(false)
    done()
  }, 200)
}, 5000)

test('second spawn kills the first and returns a different id', (done) => {
  const mgr = new CompanionPtyManager()
  const id1 = mgr.spawn(() => {}, () => {})
  setTimeout(() => {
    const id2 = mgr.spawn(() => {}, () => {})
    expect(id2).not.toBe(id1)
    expect(mgr.has(id1)).toBe(false)
    expect(mgr.has(id2)).toBe(true)
    mgr.kill(id2)
    done()
  }, 100)
}, 5000)

test('write after kill is a no-op (no throw)', (done) => {
  const mgr = new CompanionPtyManager()
  const id = mgr.spawn(() => {}, () => {})
  setTimeout(() => {
    mgr.kill(id)
    expect(() => mgr.write(id, 'echo hi\r')).not.toThrow()
    done()
  }, 100)
}, 5000)
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/main/companion-pty-manager.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '../../src/main/companion-pty-manager'`

- [ ] **Step 3: Implement CompanionPtyManager**

Create `src/main/companion-pty-manager.ts`:

```ts
import * as pty from 'node-pty'
import { randomUUID } from 'crypto'

type DataCallback = (data: string) => void
type ExitCallback = () => void

export class CompanionPtyManager {
  private ptyProcess: pty.IPty | null = null
  private currentId: string | null = null

  spawn(onData: DataCallback, onExit: ExitCallback): string {
    if (this.ptyProcess) {
      try { this.ptyProcess.kill() } catch { /* already exited */ }
      this.ptyProcess = null
      this.currentId = null
    }

    const shell = process.env.SHELL || '/bin/bash'
    const id = randomUUID()

    const proc = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || '/',
      env: process.env as Record<string, string>,
    })

    this.ptyProcess = proc
    this.currentId = id

    proc.onData((data) => {
      if (this.currentId === id) onData(data)
    })

    proc.onExit(() => {
      if (this.currentId === id) {
        this.ptyProcess = null
        this.currentId = null
        onExit()
      }
    })

    return id
  }

  write(companionId: string, data: string): void {
    if (this.currentId === companionId) this.ptyProcess?.write(data)
  }

  resize(companionId: string, cols: number, rows: number): void {
    if (this.currentId === companionId) this.ptyProcess?.resize(cols, rows)
  }

  kill(companionId: string): void {
    if (this.currentId !== companionId) return
    try { this.ptyProcess?.kill() } catch { /* already exited */ }
    this.ptyProcess = null
    this.currentId = null
  }

  has(companionId: string): boolean {
    return this.currentId === companionId
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/main/companion-pty-manager.test.ts --no-coverage
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/companion-pty-manager.ts tests/main/companion-pty-manager.test.ts
git commit -m "feat: add CompanionPtyManager for transient split terminal"
```

---

## Task 3: Register companion IPC handlers

**Files:**
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Add companion handlers to ipc-handlers.ts**

At the top of `src/main/ipc-handlers.ts`, add the import after the existing imports:
```ts
import { CompanionPtyManager } from './companion-pty-manager'
```

Inside `registerIpcHandlers`, before the `return` (or at the end of the function body), add:
```ts
  const companionMgr = new CompanionPtyManager()

  ipcMain.handle(IPC.COMPANION_SPAWN, () =>
    companionMgr.spawn(
      (data) => getWindow()?.webContents.send('companion:data', data),
      ()     => getWindow()?.webContents.send('companion:exit'),
    )
  )

  ipcMain.handle(IPC.COMPANION_KILL,   (_event, companionId: string) => companionMgr.kill(companionId))
  ipcMain.handle(IPC.COMPANION_INPUT,  (_event, companionId: string, data: string) => companionMgr.write(companionId, data))
  ipcMain.handle(IPC.COMPANION_RESIZE, (_event, companionId: string, cols: number, rows: number) => companionMgr.resize(companionId, cols, rows))
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.main.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc-handlers.ts
git commit -m "feat: register companion PTY IPC handlers"
```

---

## Task 4: Expose companion API in preload

**Files:**
- Modify: `src/main/preload.ts`

- [ ] **Step 1: Add companion methods to contextBridge**

In `src/main/preload.ts`, add the following to the object passed to `contextBridge.exposeInMainWorld` (after `writeKeybindings`):

```ts
  spawnCompanion: (): Promise<string> =>
    ipcRenderer.invoke(IPC.COMPANION_SPAWN),

  killCompanion: (companionId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_KILL, companionId),

  sendCompanionInput: (companionId: string, data: string): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_INPUT, companionId, data),

  resizeCompanion: (companionId: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke(IPC.COMPANION_RESIZE, companionId, cols, rows),

  onCompanionData: (callback: (data: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on('companion:data', handler)
    return () => ipcRenderer.removeListener('companion:data', handler)
  },

  onCompanionExit: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('companion:exit', handler)
    return () => ipcRenderer.removeListener('companion:exit', handler)
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.main.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main/preload.ts
git commit -m "feat: expose companion PTY API in preload contextBridge"
```

---

## Task 5: Extend useKeyboardShortcuts + update shortcuts modal

**Files:**
- Modify: `src/renderer/hooks/useKeyboardShortcuts.ts`
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`
- Modify: `tests/renderer/useKeyboardShortcuts.test.tsx`

- [ ] **Step 1: Write failing tests**

In `tests/renderer/useKeyboardShortcuts.test.tsx`:

Update `makeHandlers()` to include the three new handlers:
```ts
function makeHandlers(): ShortcutHandlers {
  return {
    onNewSession:           jest.fn(),
    onKillSession:          jest.fn(),
    onNextSession:          jest.fn(),
    onPrevSession:          jest.fn(),
    onSessionByIndex:       jest.fn(),
    onOpenDrawer:           jest.fn(),
    onOpenSettings:         jest.fn(),
    onOpenShortcuts:        jest.fn(),
    onSplitFocus:           jest.fn(),
    onSplitSwap:            jest.fn(),
    onSplitToggleDirection: jest.fn(),
  }
}
```

Add these three tests at the end of the file:
```ts
test('fires onSplitFocus for Ctrl+Shift+Backslash', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backslash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitFocus).toHaveBeenCalledTimes(1)
})

test('fires onSplitSwap for Ctrl+Shift+M', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitSwap).toHaveBeenCalledTimes(1)
})

test('fires onSplitToggleDirection for Ctrl+Shift+Backquote', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backquote', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitToggleDirection).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useKeyboardShortcuts.test.tsx --no-coverage
```
Expected: FAIL — `onSplitFocus` is not a property of `ShortcutHandlers`.

- [ ] **Step 3: Update ShortcutHandlers interface and dispatch in useKeyboardShortcuts.ts**

In `src/renderer/hooks/useKeyboardShortcuts.ts`:

Add three fields to `ShortcutHandlers` (after `onOpenShortcuts`):
```ts
  onSplitFocus:           () => void
  onSplitSwap:            () => void
  onSplitToggleDirection: () => void
```

Add three dispatch branches in the `handleKeyDown` function (after the `openShortcuts` branch):
```ts
      if (action === 'splitFocus')           { h.onSplitFocus();           return }
      if (action === 'splitSwap')            { h.onSplitSwap();            return }
      if (action === 'splitToggleDirection') { h.onSplitToggleDirection(); return }
```

- [ ] **Step 4: Update ACTION_LABELS in KeyboardShortcutsModal.tsx**

In `src/renderer/components/KeyboardShortcutsModal.tsx`, add to `ACTION_LABELS` (after `openShortcuts`):
```ts
  splitFocus:           'Open / Focus Companion Terminal',
  splitSwap:            'Swap Companion Panes',
  splitToggleDirection: 'Toggle Split Direction',
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useKeyboardShortcuts.test.tsx --no-coverage
```
Expected: PASS (all existing tests + 3 new).

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.renderer.json --noEmit
```
Expected: no errors. (App.tsx will fail here because it hasn't been updated yet — that's OK, fix it by adding placeholder handlers temporarily or proceed to Task 9 before running this check.)

- [ ] **Step 7: Commit**

```bash
git add src/renderer/hooks/useKeyboardShortcuts.ts src/renderer/components/KeyboardShortcutsModal.tsx tests/renderer/useKeyboardShortcuts.test.tsx
git commit -m "feat: add split shortcut handlers to useKeyboardShortcuts and shortcuts modal"
```

---

## Task 6: Create useCompanion hook

**Files:**
- Create: `src/renderer/hooks/useCompanion.ts`
- Create: `tests/renderer/useCompanion.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/renderer/useCompanion.test.tsx`:

```ts
import { renderHook, act } from '@testing-library/react'
import { useCompanion } from '../../src/renderer/hooks/useCompanion'

beforeEach(() => {
  ;(window as any).overseer = {
    spawnCompanion:     jest.fn().mockResolvedValue('test-companion-id'),
    killCompanion:      jest.fn().mockResolvedValue(undefined),
    onCompanionData:    jest.fn().mockReturnValue(() => {}),
    onCompanionExit:    jest.fn().mockReturnValue(() => {}),
  }
})

test('starts with split closed', () => {
  const { result } = renderHook(() => useCompanion())
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.companionId).toBeNull()
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.splitDirection).toBe('horizontal')
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitFocus when closed: spawns companion and focuses it', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(1)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.companionId).toBe('test-companion-id')
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitFocus when open: toggles focus main↔companion', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitSwap toggles splitSwapped when open', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitSwapped).toBe(false)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(true)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitSwap is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion())
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitToggleDirection toggles horizontal↔vertical when open', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitDirection).toBe('horizontal')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('vertical')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('onSplitToggleDirection is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion())
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('companion:exit closes the split and clears companionId', async () => {
  let exitCb: (() => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: () => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitOpen).toBe(true)
  act(() => { exitCb?.() })
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.companionId).toBeNull()
  expect(result.current.splitFocused).toBe('main')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useCompanion.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '../../src/renderer/hooks/useCompanion'`

- [ ] **Step 3: Implement useCompanion**

Create `src/renderer/hooks/useCompanion.ts`:

```ts
import { useState, useEffect, useCallback } from 'react'

export interface CompanionState {
  companionId: string | null
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export interface CompanionAPI extends CompanionState {
  onSplitFocus:           () => void
  onSplitSwap:            () => void
  onSplitToggleDirection: () => void
}

export function useCompanion(): CompanionAPI {
  const [companionId,    setCompanionId]    = useState<string | null>(null)
  const [splitOpen,      setSplitOpen]      = useState(false)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [splitSwapped,   setSplitSwapped]   = useState(false)
  const [splitFocused,   setSplitFocused]   = useState<'main' | 'companion'>('main')

  useEffect(() => {
    const unsubscribe = window.overseer.onCompanionExit(() => {
      setCompanionId(null)
      setSplitOpen(false)
      setSplitFocused('main')
    })
    return unsubscribe
  }, [])

  const onSplitFocus = useCallback(() => {
    setSplitOpen(open => {
      if (!open) {
        window.overseer.spawnCompanion().then(id => {
          setCompanionId(id)
          setSplitOpen(true)
          setSplitFocused('companion')
        }).catch(err => console.error('companion spawn failed:', err))
        return open
      }
      setSplitFocused(f => f === 'main' ? 'companion' : 'main')
      return open
    })
  }, [])

  const onSplitSwap = useCallback(() => {
    setSplitOpen(open => {
      if (open) setSplitSwapped(s => !s)
      return open
    })
  }, [])

  const onSplitToggleDirection = useCallback(() => {
    setSplitOpen(open => {
      if (open) setSplitDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')
      return open
    })
  }, [])

  return { companionId, splitOpen, splitDirection, splitSwapped, splitFocused, onSplitFocus, onSplitSwap, onSplitToggleDirection }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useCompanion.test.tsx --no-coverage
```
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/hooks/useCompanion.ts tests/renderer/useCompanion.test.tsx
git commit -m "feat: add useCompanion hook for split terminal state management"
```

---

## Task 7: Create CompanionTerminal component

**Files:**
- Create: `src/renderer/components/CompanionTerminal.tsx`

- [ ] **Step 1: Implement CompanionTerminal**

Create `src/renderer/components/CompanionTerminal.tsx`:

```tsx
import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

interface Props {
  companionId: string
  focused: boolean
  keybindings: Keybindings
}

export function CompanionTerminal({ companionId, focused, keybindings }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const keybindingsRef = useRef(keybindings)

  useEffect(() => { keybindingsRef.current = keybindings }, [keybindings])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({ theme: { background: '#1e1e1e' }, fontFamily: 'monospace', fontSize: 14 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      return !matchKeybinding(keybindingsRef.current, e)
    })

    const unsubscribeData = window.overseer.onCompanionData((data) => {
      term.write(data)
    })

    term.onData((data) => {
      window.overseer.sendCompanionInput(companionId, data)
    })

    const observer = new ResizeObserver(() => {
      fit.fit()
      window.overseer.resizeCompanion(companionId, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribeData()
      observer.disconnect()
      term.dispose()
    }
  }, [companionId])

  useEffect(() => {
    if (focused && termRef.current) termRef.current.focus()
  }, [focused])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.renderer.json --noEmit 2>&1 | grep -v "App.tsx"
```
Expected: no errors in CompanionTerminal.tsx (App.tsx errors are from Task 9, ignore them here).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/CompanionTerminal.tsx
git commit -m "feat: add CompanionTerminal component wired to companion IPC"
```

---

## Task 8: Update TerminalPane to render split layout

**Files:**
- Modify: `src/renderer/components/TerminalPane.tsx`

- [ ] **Step 1: Rewrite TerminalPane with split support**

Replace the entire contents of `src/renderer/components/TerminalPane.tsx`:

```tsx
import React from 'react'
import { TerminalInstance } from './TerminalInstance'
import { CompanionTerminal } from './CompanionTerminal'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  keybindings: Keybindings
  companionId: string | null
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export function TerminalPane({ sessions, activeSessionId, keybindings, companionId, splitOpen, splitDirection, splitSwapped, splitFocused }: Props) {
  const sessionStack = sessions.map(session => (
    <div
      key={session.id}
      style={{ position: 'absolute', inset: 0, display: session.id === activeSessionId ? 'block' : 'none' }}
    >
      <TerminalInstance session={session} keybindings={keybindings} />
    </div>
  ))

  if (!splitOpen || !companionId) {
    return (
      <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
        {sessionStack}
      </div>
    )
  }

  const isRow = splitDirection === 'horizontal'
  const mainPane = (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {sessionStack}
    </div>
  )
  const companionPane = (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <CompanionTerminal
        companionId={companionId}
        focused={splitFocused === 'companion'}
        keybindings={keybindings}
      />
    </div>
  )
  const firstPane  = splitSwapped ? companionPane : mainPane
  const secondPane = splitSwapped ? mainPane : companionPane

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isRow ? 'row' : 'column', background: '#1e1e1e' }}>
      {firstPane}
      <div style={{ width: isRow ? '1px' : '100%', height: isRow ? '100%' : '1px', background: '#555', flexShrink: 0 }} />
      {secondPane}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.renderer.json --noEmit 2>&1 | grep -v "App.tsx"
```
Expected: no errors in TerminalPane.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/TerminalPane.tsx
git commit -m "feat: update TerminalPane to render flexbox split when companion is open"
```

---

## Task 9: Wire App.tsx

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the entire contents of `src/renderer/App.tsx`:

```tsx
import React, { useEffect, useState } from 'react'
import { useSessionStore } from './store/sessions'
import { TabBar } from './components/TabBar'
import { TerminalPane } from './components/TerminalPane'
import { GitPanel } from './components/GitPanel'
import { NewSessionDialog } from './components/NewSessionDialog'
import { SessionDrawer } from './components/SessionDrawer'
import { SettingsModal } from './components/SettingsModal'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCompanion } from './hooks/useCompanion'
import type { CreateSessionOptions } from './types/ipc'

export default function App() {
  const { sessions, activeSessionId, load, createSession, killSession, setActive } = useSessionStore()
  const [showNewDialog,      setShowNewDialog]      = useState(false)
  const [showDrawer,         setShowDrawer]          = useState(false)
  const [showSettings,       setShowSettings]        = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  useEffect(() => { load() }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const handleKillActive = () => {
    if (activeSessionId) killSession(activeSessionId).catch(console.error)
  }

  const handleNextSession = () => {
    if (sessions.length === 0) return
    const idx = sessions.findIndex(s => s.id === activeSessionId)
    setActive(sessions[(idx + 1) % sessions.length].id)
  }

  const handlePrevSession = () => {
    if (sessions.length === 0) return
    const idx = sessions.findIndex(s => s.id === activeSessionId)
    setActive(sessions[(idx - 1 + sessions.length) % sessions.length].id)
  }

  const handleSessionByIndex = (index: number) => {
    const session = sessions[index - 1]
    if (session) setActive(session.id)
  }

  const {
    companionId, splitOpen, splitDirection, splitSwapped, splitFocused,
    onSplitFocus, onSplitSwap, onSplitToggleDirection,
  } = useCompanion()

  const { keybindings, updateKeybindings } = useKeyboardShortcuts({
    onNewSession:           () => setShowNewDialog(true),
    onKillSession:          handleKillActive,
    onNextSession:          handleNextSession,
    onPrevSession:          handlePrevSession,
    onSessionByIndex:       handleSessionByIndex,
    onOpenDrawer:           () => setShowDrawer(true),
    onOpenSettings:         () => setShowSettings(true),
    onOpenShortcuts:        () => setShowShortcutsModal(true),
    onSplitFocus,
    onSplitSwap,
    onSplitToggleDirection,
  })

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
        <TerminalPane
          sessions={sessions}
          activeSessionId={activeSessionId}
          keybindings={keybindings}
          companionId={companionId}
          splitOpen={splitOpen}
          splitDirection={splitDirection}
          splitSwapped={splitSwapped}
          splitFocused={splitFocused}
        />
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
        <SettingsModal
          onClose={() => setShowSettings(false)}
          keybindings={keybindings}
          onSaveKeybindings={updateKeybindings}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal
          keybindings={keybindings}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /home/toryhebert/src/overseer && npx tsc -p tsconfig.renderer.json --noEmit && npx tsc -p tsconfig.main.json --noEmit
```
Expected: no errors in either target.

- [ ] **Step 3: Run the full test suite**

```bash
cd /home/toryhebert/src/overseer && npx jest --no-coverage
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: wire useCompanion and split shortcuts into App"
```

---

## Task 10: Manual smoke test

- [ ] **Step 1: Start the app in dev mode**

In one terminal:
```bash
cd /home/toryhebert/src/overseer && npm run dev:renderer
```

In another terminal:
```bash
cd /home/toryhebert/src/overseer && npm run build:main && electron .
```

- [ ] **Step 2: Verify split opens**

Press `Ctrl+Shift+\`. Expected: a companion shell pane appears to the right of the active session terminal.

- [ ] **Step 3: Verify focus toggle**

Press `Ctrl+Shift+\` again. Expected: focus returns to the main terminal. Press again — focus goes back to companion.

- [ ] **Step 4: Verify swap**

Press `Ctrl+Shift+M`. Expected: companion pane moves to the left, main session moves to the right.

- [ ] **Step 5: Verify direction toggle**

Press `Ctrl+Shift+\`` (backtick). Expected: layout switches from horizontal to vertical (top/bottom).

- [ ] **Step 6: Verify shortcuts modal shows new actions**

Press `Ctrl+Shift+/`. Expected: the shortcuts modal lists "Open / Focus Companion Terminal", "Swap Companion Panes", "Toggle Split Direction" with their bindings.

- [ ] **Step 7: Verify companion input works**

With focus in the companion pane, type `echo hello` and press Enter. Expected: output appears in the companion terminal only.

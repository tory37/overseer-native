# Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fully configurable keyboard shortcuts to the Overseer Electron app so every action can be triggered without a mouse.

**Architecture:** A `useKeyboardShortcuts` hook in `App.tsx` loads keybindings from `~/.overseer/keybindings.json` (via two new IPC channels), attaches a `window` keydown listener, and returns the active keybindings. Each `TerminalInstance` receives those keybindings and uses xterm's `attachCustomKeyEventHandler` to let matching combos bubble past the terminal to the app-level listener. All defaults use `Ctrl+Shift+` prefix to avoid conflicts with terminal raw input.

**Tech Stack:** React 18, xterm.js 5, Zustand, Electron 30, Jest 30 + @testing-library/react 16, ts-jest

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| Create | `src/renderer/hooks/useKeyboardShortcuts.ts` | Hook: loads config, attaches listener, dispatches to handlers |
| Create | `src/renderer/components/KeyboardShortcutsModal.tsx` | Read-only table showing all current shortcuts |
| Create | `tests/renderer/useKeyboardShortcuts.test.tsx` | Hook unit tests |
| Create | `tests/renderer/KeyboardShortcutsModal.test.tsx` | Modal render + interaction tests |
| Create | `tests/renderer/SessionDrawer.test.tsx` | Drawer keyboard nav tests |
| Modify | `src/renderer/types/ipc.ts` | Add `Keybinding`, `Keybindings`, `DEFAULT_KEYBINDINGS`, `matchKeybinding`, `formatKeybinding`, IPC constants |
| Modify | `src/renderer/types/electron.d.ts` | Add `readKeybindings` + `writeKeybindings` to Window interface |
| Modify | `src/main/ipc-handlers.ts` | Export `readKeybindingsFromDisk` + `writeKeybindingsToDisk`, register IPC handlers |
| Modify | `src/main/preload.ts` | Expose `readKeybindings` + `writeKeybindings` via contextBridge |
| Modify | `src/renderer/App.tsx` | Wire hook, add `showShortcutsModal` state, render `KeyboardShortcutsModal` |
| Modify | `src/renderer/components/TerminalInstance.tsx` | Accept `keybindings` prop, use `attachCustomKeyEventHandler` |
| Modify | `src/renderer/components/TerminalPane.tsx` | Accept and forward `keybindings` prop |
| Modify | `src/renderer/components/SessionDrawer.tsx` | Add arrow-key navigation (↑↓ focus, Enter select, Delete kill, Escape close) |
| Modify | `src/renderer/components/SettingsModal.tsx` | Add Shortcuts section: view + capture-to-edit each binding, Save button |
| Modify | `tests/renderer/SettingsModal.test.tsx` | Update mocks + add keybindings-section tests |

---

### Task 1: Keybinding types, constants, and utilities in `ipc.ts`

**Files:**
- Modify: `src/renderer/types/ipc.ts`

> **Why `code` not `key`:** `e.key` is layout-shifted — pressing Ctrl+Shift+] produces `e.key = '}'` not `']'`. `e.code` is always the physical key (`BracketRight`), so matching is reliable regardless of modifier state.

- [ ] **Step 1: Add types and constants to `src/renderer/types/ipc.ts`**

Append after the existing `SyncResult` interface (before the `IPC` const):

```typescript
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
  openDrawer:      { code: 'KeyE',         ctrl: true,  shift: true,  alt: false },
  openSettings:    { code: 'Comma',        ctrl: true,  shift: true,  alt: false },
  openShortcuts:   { code: 'Slash',        ctrl: true,  shift: true,  alt: false },
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
      e.code === binding.code &&
      e.ctrlKey  === binding.ctrl &&
      e.shiftKey === binding.shift &&
      e.altKey   === binding.alt
    ) {
      return action
    }
  }
  return null
}
```

Also add two entries to the `IPC` const at the bottom of the file:

```typescript
  KEYBINDINGS_READ:  'keybindings:read',
  KEYBINDINGS_WRITE: 'keybindings:write',
```

- [ ] **Step 2: Update `src/renderer/types/electron.d.ts`**

Add two lines inside the `overseer` object, after `syncRun`:

```typescript
      readKeybindings: () => Promise<import('./ipc').Keybindings | null>
      writeKeybindings: (kb: import('./ipc').Keybindings) => Promise<void>
```

- [ ] **Step 3: Verify types compile**

```bash
cd /home/toryhebert/src/overseer
npx tsc -p tsconfig.renderer-test.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/types/ipc.ts src/renderer/types/electron.d.ts
git commit -m "feat: add Keybinding types, DEFAULT_KEYBINDINGS, IPC constants"
```

---

### Task 2: IPC handlers in main process and preload

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/preload.ts`
- Modify: `tests/main/ipc-helpers.test.ts`

- [ ] **Step 1: Write failing tests** — append to `tests/main/ipc-helpers.test.ts`:

```typescript
import { readKeybindingsFromDisk, writeKeybindingsToDisk } from '../../src/main/ipc-handlers'
import type { Keybindings } from '../../src/renderer/types/ipc'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

describe('readKeybindingsFromDisk', () => {
  test('returns null when file does not exist', async () => {
    expect(await readKeybindingsFromDisk(tmpDir)).toBeNull()
  })

  test('returns parsed keybindings when file exists', async () => {
    const overseerDir = path.join(tmpDir, '.overseer')
    fs.mkdirSync(overseerDir, { recursive: true })
    fs.writeFileSync(path.join(overseerDir, 'keybindings.json'), JSON.stringify(DEFAULT_KEYBINDINGS))
    const result = await readKeybindingsFromDisk(tmpDir)
    expect(result).toEqual(DEFAULT_KEYBINDINGS)
  })
})

describe('writeKeybindingsToDisk', () => {
  test('creates the directory and writes JSON', async () => {
    await writeKeybindingsToDisk(DEFAULT_KEYBINDINGS, tmpDir)
    const written = fs.readFileSync(path.join(tmpDir, '.overseer', 'keybindings.json'), 'utf8')
    expect(JSON.parse(written)).toEqual(DEFAULT_KEYBINDINGS)
  })

  test('overwrites an existing file', async () => {
    const overseerDir = path.join(tmpDir, '.overseer')
    fs.mkdirSync(overseerDir, { recursive: true })
    fs.writeFileSync(path.join(overseerDir, 'keybindings.json'), '{}')
    const custom: Keybindings = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }
    await writeKeybindingsToDisk(custom, tmpDir)
    const written = JSON.parse(fs.readFileSync(path.join(overseerDir, 'keybindings.json'), 'utf8'))
    expect(written.newSession.code).toBe('KeyT')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/main/ipc-helpers.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL with "readKeybindingsFromDisk is not a function" (or similar export error).

- [ ] **Step 3: Implement in `src/main/ipc-handlers.ts`**

Add `import path from 'path'` to the imports at the top (if not already present — check first; `os` is already imported).

Add before the `export function registerIpcHandlers` line:

```typescript
export async function readKeybindingsFromDisk(baseDir = os.homedir()): Promise<import('../renderer/types/ipc').Keybindings | null> {
  const p = path.join(baseDir, '.overseer', 'keybindings.json')
  try {
    const raw = await fs.promises.readFile(p, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function writeKeybindingsToDisk(
  kb: import('../renderer/types/ipc').Keybindings,
  baseDir = os.homedir()
): Promise<void> {
  const p = path.join(baseDir, '.overseer', 'keybindings.json')
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
  await fs.promises.writeFile(p, JSON.stringify(kb, null, 2), 'utf8')
}
```

Also add to `registerIpcHandlers`, after the `SYNC_RUN` line:

```typescript
  ipcMain.handle(IPC.KEYBINDINGS_READ,  () => readKeybindingsFromDisk())
  ipcMain.handle(IPC.KEYBINDINGS_WRITE, (_event, kb) => writeKeybindingsToDisk(kb))
```

- [ ] **Step 4: Add `path` import if missing**

Check the first line of `src/main/ipc-handlers.ts` — if `path` is not imported, add:

```typescript
import path from 'path'
```

(It currently imports `fs` and `os` but not `path`.)

- [ ] **Step 5: Update `src/main/preload.ts`**

Add to the existing imports at the top:

```typescript
import type { Keybindings } from '../renderer/types/ipc'
```

Add inside the `contextBridge.exposeInMainWorld('overseer', { ... })` object, after `syncRun`:

```typescript
  readKeybindings: (): Promise<Keybindings | null> =>
    ipcRenderer.invoke(IPC.KEYBINDINGS_READ),

  writeKeybindings: (kb: Keybindings): Promise<void> =>
    ipcRenderer.invoke(IPC.KEYBINDINGS_WRITE, kb),
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/main/ipc-helpers.test.ts --no-coverage 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/main/ipc-handlers.ts src/main/preload.ts tests/main/ipc-helpers.test.ts
git commit -m "feat: add keybindings read/write IPC handlers and preload bindings"
```

---

### Task 3: `useKeyboardShortcuts` hook

**Files:**
- Create: `src/renderer/hooks/useKeyboardShortcuts.ts`
- Create: `tests/renderer/useKeyboardShortcuts.test.tsx`

- [ ] **Step 1: Write failing tests** — create `tests/renderer/useKeyboardShortcuts.test.tsx`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts } from '../../src/renderer/hooks/useKeyboardShortcuts'
import type { ShortcutHandlers } from '../../src/renderer/hooks/useKeyboardShortcuts'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

function makeHandlers(): ShortcutHandlers {
  return {
    onNewSession:     jest.fn(),
    onKillSession:    jest.fn(),
    onNextSession:    jest.fn(),
    onPrevSession:    jest.fn(),
    onSessionByIndex: jest.fn(),
    onOpenDrawer:     jest.fn(),
    onOpenSettings:   jest.fn(),
    onOpenShortcuts:  jest.fn(),
  }
}

beforeEach(() => {
  ;(window as any).overseer = {
    readKeybindings: jest.fn().mockResolvedValue(null),
  }
})

test('returns DEFAULT_KEYBINDINGS initially', () => {
  const { result } = renderHook(() => useKeyboardShortcuts(makeHandlers()))
  expect(result.current.keybindings).toEqual(DEFAULT_KEYBINDINGS)
})

test('fires onNewSession for Ctrl+Shift+N (KeyN)', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNewSession).toHaveBeenCalledTimes(1)
})

test('fires onKillSession for Ctrl+Shift+W', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onKillSession).toHaveBeenCalledTimes(1)
})

test('fires onNextSession for Ctrl+Shift+BracketRight', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'BracketRight', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNextSession).toHaveBeenCalledTimes(1)
})

test('fires onPrevSession for Ctrl+Shift+BracketLeft', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'BracketLeft', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onPrevSession).toHaveBeenCalledTimes(1)
})

test('fires onOpenDrawer for Ctrl+Shift+E', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenDrawer).toHaveBeenCalledTimes(1)
})

test('fires onOpenSettings for Ctrl+Shift+Comma', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Comma', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenSettings).toHaveBeenCalledTimes(1)
})

test('fires onOpenShortcuts for Ctrl+Shift+Slash', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenShortcuts).toHaveBeenCalledTimes(1)
})

test('fires onSessionByIndex(3) for Ctrl+Shift+Digit3', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSessionByIndex).toHaveBeenCalledWith(3)
})

test('ignores Ctrl+N (no Shift) — does not fire onNewSession', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', ctrlKey: true, shiftKey: false, bubbles: true }))
  })
  expect(handlers.onNewSession).not.toHaveBeenCalled()
})

test('loads custom keybindings from IPC and uses them', async () => {
  const custom = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }
  ;(window as any).overseer.readKeybindings = jest.fn().mockResolvedValue(custom)
  const handlers = makeHandlers()
  const { result } = renderHook(() => useKeyboardShortcuts(handlers))

  await act(async () => { await Promise.resolve() })

  expect(result.current.keybindings.newSession.code).toBe('KeyT')

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNewSession).toHaveBeenCalledTimes(1)
})

test('updateKeybindings writes to disk and updates state', async () => {
  const writeKeybindings = jest.fn().mockResolvedValue(undefined)
  ;(window as any).overseer = {
    readKeybindings: jest.fn().mockResolvedValue(null),
    writeKeybindings,
  }
  const handlers = makeHandlers()
  const { result } = renderHook(() => useKeyboardShortcuts(handlers))
  const custom = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }

  await act(async () => { await result.current.updateKeybindings(custom) })

  expect(writeKeybindings).toHaveBeenCalledWith(custom)
  expect(result.current.keybindings.newSession.code).toBe('KeyT')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/useKeyboardShortcuts.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create `src/renderer/hooks/useKeyboardShortcuts.ts`**

Create the directory first:

```bash
mkdir -p /home/toryhebert/src/overseer/src/renderer/hooks
```

Then write `src/renderer/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useState, useEffect, useRef } from 'react'
import { DEFAULT_KEYBINDINGS, matchKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

export interface ShortcutHandlers {
  onNewSession:     () => void
  onKillSession:    () => void
  onNextSession:    () => void
  onPrevSession:    () => void
  onSessionByIndex: (index: number) => void
  onOpenDrawer:     () => void
  onOpenSettings:   () => void
  onOpenShortcuts:  () => void
}

export interface KeyboardShortcutsAPI {
  keybindings: Keybindings
  updateKeybindings: (kb: Keybindings) => Promise<void>
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): KeyboardShortcutsAPI {
  const [keybindings, setKeybindings] = useState<Keybindings>(DEFAULT_KEYBINDINGS)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    window.overseer.readKeybindings().then(kb => {
      if (kb) setKeybindings(kb)
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = matchKeybinding(keybindings, e)
      if (!action) return
      e.preventDefault()
      const h = handlersRef.current
      if (action === 'newSession')    { h.onNewSession();    return }
      if (action === 'killSession')   { h.onKillSession();   return }
      if (action === 'nextSession')   { h.onNextSession();   return }
      if (action === 'prevSession')   { h.onPrevSession();   return }
      if (action === 'openDrawer')    { h.onOpenDrawer();    return }
      if (action === 'openSettings')  { h.onOpenSettings();  return }
      if (action === 'openShortcuts') { h.onOpenShortcuts(); return }
      const idxMatch = action.match(/^sessionByIndex(\d)$/)
      if (idxMatch) h.onSessionByIndex(parseInt(idxMatch[1], 10))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keybindings])

  const updateKeybindings = async (kb: Keybindings) => {
    await window.overseer.writeKeybindings(kb)
    setKeybindings(kb)
  }

  return { keybindings, updateKeybindings }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/useKeyboardShortcuts.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/hooks/useKeyboardShortcuts.ts tests/renderer/useKeyboardShortcuts.test.tsx
git commit -m "feat: useKeyboardShortcuts hook with configurable keybindings"
```

---

### Task 4: `KeyboardShortcutsModal` component

**Files:**
- Create: `src/renderer/components/KeyboardShortcutsModal.tsx`
- Create: `tests/renderer/KeyboardShortcutsModal.test.tsx`

- [ ] **Step 1: Write failing tests** — create `tests/renderer/KeyboardShortcutsModal.test.tsx`:

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyboardShortcutsModal } from '../../src/renderer/components/KeyboardShortcutsModal'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

test('renders all action labels', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} />)
  expect(screen.getByText('New Session')).toBeInTheDocument()
  expect(screen.getByText('Kill Active Session')).toBeInTheDocument()
  expect(screen.getByText('Open Settings')).toBeInTheDocument()
  expect(screen.getByText('Show Keyboard Shortcuts')).toBeInTheDocument()
})

test('renders formatted keybindings for defaults', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} />)
  expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
  expect(screen.getByText('Ctrl+Shift+,')).toBeInTheDocument()
})

test('calls onClose when close button clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(screen.getByTitle('Close'))
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when Escape pressed', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when overlay backdrop clicked', () => {
  const onClose = jest.fn()
  const { container } = render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(container.firstChild as Element)
  expect(onClose).toHaveBeenCalled()
})

test('does not call onClose when inner dialog clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(screen.getByRole('heading', { name: 'Keyboard Shortcuts' }))
  expect(onClose).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/KeyboardShortcutsModal.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create `src/renderer/components/KeyboardShortcutsModal.tsx`**

```typescript
import React, { useEffect } from 'react'
import { formatKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

interface Props {
  keybindings: Keybindings
  onClose: () => void
}

const ACTION_LABELS: Record<string, string> = {
  newSession:       'New Session',
  killSession:      'Kill Active Session',
  nextSession:      'Next Session',
  prevSession:      'Previous Session',
  sessionByIndex1:  'Switch to Session 1',
  sessionByIndex2:  'Switch to Session 2',
  sessionByIndex3:  'Switch to Session 3',
  sessionByIndex4:  'Switch to Session 4',
  sessionByIndex5:  'Switch to Session 5',
  sessionByIndex6:  'Switch to Session 6',
  sessionByIndex7:  'Switch to Session 7',
  sessionByIndex8:  'Switch to Session 8',
  sessionByIndex9:  'Switch to Session 9',
  openDrawer:       'Open Session List',
  openSettings:     'Open Settings',
  openShortcuts:    'Show Keyboard Shortcuts',
}

export function KeyboardShortcutsModal({ keybindings, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 500, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Keyboard Shortcuts</h2>
          <button
            title="Close"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {(Object.entries(keybindings) as [string, Keybindings[keyof Keybindings]][]).map(([action, kb]) => (
              <tr key={action} style={{ borderBottom: '1px solid #3a3a3a' }}>
                <td style={{ padding: '8px 0', color: '#ccc' }}>{ACTION_LABELS[action] ?? action}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <kbd style={{ background: '#1e1e1e', border: '1px solid #555', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#eee', fontFamily: 'monospace' }}>
                    {formatKeybinding(kb)}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/KeyboardShortcutsModal.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx tests/renderer/KeyboardShortcutsModal.test.tsx
git commit -m "feat: KeyboardShortcutsModal component"
```

---

### Task 5: Wire hook and modal into `App.tsx`

**Files:**
- Modify: `src/renderer/App.tsx`

No new test file needed — hook behavior is covered by Task 3 tests.

- [ ] **Step 1: Update `src/renderer/App.tsx`**

Replace the entire file content with:

```typescript
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

  const { keybindings, updateKeybindings } = useKeyboardShortcuts({
    onNewSession:     () => setShowNewDialog(true),
    onKillSession:    handleKillActive,
    onNextSession:    handleNextSession,
    onPrevSession:    handlePrevSession,
    onSessionByIndex: handleSessionByIndex,
    onOpenDrawer:     () => setShowDrawer(true),
    onOpenSettings:   () => setShowSettings(true),
    onOpenShortcuts:  () => setShowShortcutsModal(true),
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
        <TerminalPane sessions={sessions} activeSessionId={activeSessionId} keybindings={keybindings} />
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

- [ ] **Step 2: Verify TypeScript**

```bash
cd /home/toryhebert/src/overseer
npx tsc -p tsconfig.renderer-test.json --noEmit 2>&1 | head -30
```

Expected: no errors (SettingsModal will error until Task 8 adds its new props — address that in Task 8 or temporarily make props optional here).

> **Note:** SettingsModal does not yet accept `keybindings` or `onSaveKeybindings` props. The compiler will error on those until Task 8. You have two options: (a) complete Task 8 next before committing App.tsx, or (b) temporarily type them as `?: ...` in SettingsModal. Option (a) is cleaner — skip the commit here and do Tasks 5+8 together before running `tsc`.

- [ ] **Step 3: Commit (after Task 8 makes SettingsModal accept the new props)**

```bash
git add src/renderer/App.tsx
git commit -m "feat: wire useKeyboardShortcuts and KeyboardShortcutsModal into App"
```

---

### Task 6: xterm passthrough in `TerminalInstance` and `TerminalPane`

**Files:**
- Modify: `src/renderer/components/TerminalInstance.tsx`
- Modify: `src/renderer/components/TerminalPane.tsx`

> xterm.js's `attachCustomKeyEventHandler` is called before xterm processes a key. Returning `false` tells xterm to skip processing; the DOM event continues to bubble to `window`, where `useKeyboardShortcuts` catches it. A `useRef` holds the latest keybindings so the handler always sees the current config without reinitializing the terminal.

- [ ] **Step 1: Update `src/renderer/components/TerminalInstance.tsx`**

Replace the entire file:

```typescript
import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  session: Session
  keybindings: Keybindings
}

export function TerminalInstance({ session, keybindings }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const fitRef         = useRef<FitAddon | null>(null)
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
    fitRef.current = fit

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      return !matchKeybinding(keybindingsRef.current, e)
    })

    window.overseer.getScrollback(session.id).then(data => {
      if (data) {
        term.write(Buffer.from(data, 'binary'))
      } else {
        term.write('\r\nWelcome to Overseer\r\n\r\n')
      }
    })

    const unsubscribe = window.overseer.onPtyData(session.id, (data) => {
      term.write(data)
    })

    const unsubscribeError = window.overseer.onPtyError(session.id, (err) => {
      term.write(`\r\n\x1b[31m[Overseer] ${err}\x1b[0m\r\n`)
    })

    term.onData((data) => {
      window.overseer.sendInput(session.id, data)
    })

    const observer = new ResizeObserver(() => {
      fit.fit()
      window.overseer.resize(session.id, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribe()
      unsubscribeError()
      observer.disconnect()
      term.dispose()
    }
  }, [session.id])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

- [ ] **Step 2: Update `src/renderer/components/TerminalPane.tsx`**

Replace the entire file:

```typescript
import React from 'react'
import { TerminalInstance } from './TerminalInstance'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  keybindings: Keybindings
}

export function TerminalPane({ sessions, activeSessionId, keybindings }: Props) {
  return (
    <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
      {sessions.map(session => (
        <div
          key={session.id}
          style={{
            position: 'absolute',
            inset: 0,
            display: session.id === activeSessionId ? 'block' : 'none',
          }}
        >
          <TerminalInstance session={session} keybindings={keybindings} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /home/toryhebert/src/overseer
npx tsc -p tsconfig.renderer-test.json --noEmit 2>&1 | head -20
```

Expected: no errors once Task 5 and Task 8 are also complete.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/components/TerminalInstance.tsx src/renderer/components/TerminalPane.tsx
git commit -m "feat: xterm passthrough — let app shortcuts bubble past terminal"
```

---

### Task 7: Arrow key navigation in `SessionDrawer`

**Files:**
- Modify: `src/renderer/components/SessionDrawer.tsx`
- Create: `tests/renderer/SessionDrawer.test.tsx`

- [ ] **Step 1: Write failing tests** — create `tests/renderer/SessionDrawer.test.tsx`:

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SessionDrawer } from '../../src/renderer/components/SessionDrawer'
import type { Session } from '../../src/renderer/types/ipc'

const sessions: Session[] = [
  { id: 'a', name: 'session-a', agentType: 'claude', cwd: '/tmp/a', envVars: {}, scrollbackPath: '' },
  { id: 'b', name: 'session-b', agentType: 'shell',  cwd: '/tmp/b', envVars: {}, scrollbackPath: '' },
]

test('renders all session names', () => {
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={() => {}} onClose={() => {}} />)
  expect(screen.getByText('session-a')).toBeInTheDocument()
  expect(screen.getByText('session-b')).toBeInTheDocument()
})

test('calls onSelect and onClose when a session row is clicked', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.click(screen.getByText('session-b'))
  expect(onSelect).toHaveBeenCalledWith('b')
  expect(onClose).toHaveBeenCalled()
})

test('calls onKill with session id when kill button clicked', () => {
  const onKill = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={onKill} onClose={() => {}} />)
  const killButtons = screen.getAllByTitle('Kill session')
  fireEvent.click(killButtons[0])
  expect(onKill).toHaveBeenCalledWith('a')
})

test('calls onClose when Escape pressed', () => {
  const onClose = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('Enter selects the initially focused session (index 0)', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('a')
  expect(onClose).toHaveBeenCalled()
})

test('ArrowDown moves focus to next session, Enter selects it', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('b')
})

test('ArrowUp from index 0 stays at 0', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('a')
})

test('Delete kills the focused session', () => {
  const onKill = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={onKill} onClose={() => {}} />)
  fireEvent.keyDown(window, { key: 'Delete' })
  expect(onKill).toHaveBeenCalledWith('a')
})

test('shows "No sessions yet." when empty', () => {
  render(<SessionDrawer sessions={[]} activeSessionId={null} onSelect={() => {}} onKill={() => {}} onClose={() => {}} />)
  expect(screen.getByText('No sessions yet.')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/SessionDrawer.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: FAIL on keyboard tests ("Escape" and keyboard nav ones).

- [ ] **Step 3: Update `src/renderer/components/SessionDrawer.tsx`**

Replace the entire file:

```typescript
import React, { useState, useEffect } from 'react'
import type { Session } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onKill: (id: string) => void
  onClose: () => void
}

export function SessionDrawer({ sessions, activeSessionId, onSelect, onKill, onClose }: Props) {
  const [focusedIdx, setFocusedIdx] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIdx(i => Math.min(i + 1, sessions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIdx(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const s = sessions[focusedIdx]
        if (s) { onSelect(s.id); onClose() }
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const s = sessions[focusedIdx]
        if (s) onKill(s.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions, focusedIdx, onClose, onSelect, onKill])

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
  }
  const drawerStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px',
    background: '#252526', display: 'flex', flexDirection: 'column', padding: '16px', gap: '8px',
  }
  const itemStyle = (isActive: boolean, isFocused: boolean): React.CSSProperties => ({
    background: isActive ? '#094771' : isFocused ? '#3a3a3a' : '#2d2d2d',
    borderRadius: '4px', padding: '8px 12px', color: '#ccc',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    outline: isFocused ? '1px solid #0e639c' : 'none',
  })

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#eee', margin: 0 }}>All Sessions</h3>
        {sessions.map((s, i) => (
          <div key={s.id} style={itemStyle(s.id === activeSessionId, i === focusedIdx)}>
            <div
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => { onSelect(s.id); onClose() }}
            >
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.agentType} · {s.cwd}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onKill(s.id) }}
              style={{ background: 'transparent', border: 'none', color: '#c55', cursor: 'pointer', padding: '4px', fontSize: '14px' }}
              title="Kill session"
            >
              ✕
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div style={{ color: '#666', fontSize: '13px' }}>No sessions yet.</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/SessionDrawer.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/SessionDrawer.tsx tests/renderer/SessionDrawer.test.tsx
git commit -m "feat: arrow-key navigation in SessionDrawer"
```

---

### Task 8: Keybindings section in `SettingsModal`

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`
- Modify: `tests/renderer/SettingsModal.test.tsx`

The Shortcuts section renders each binding with a "Set" button. Clicking "Set" starts capture mode: the next key combo (non-modifier) updates that binding's pending state. A "Save Shortcuts" button persists via `onSaveKeybindings`. Capture uses `{ capture: true }` so it intercepts before the global shortcut handler.

- [ ] **Step 1: Write new tests** — add to the bottom of `tests/renderer/SettingsModal.test.tsx`:

First, update every call to `render(<SettingsModal ... />)` in the existing tests to also pass the new required props. Add these two arguments to every `render` call in the file:

```
keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()}
```

Then add these new tests at the bottom:

```typescript
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

// add to imports at top of file (DEFAULT_KEYBINDINGS)

test('renders Shortcuts section heading', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('Shortcuts')).toBeInTheDocument()
})

test('shows action labels in shortcuts table', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('New Session')).toBeInTheDocument()
  expect(screen.getByText('Open Settings')).toBeInTheDocument()
})

test('shows formatted keybinding strings', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
})

test('shows "Press keys…" prompt after clicking Set for an action', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  expect(screen.getByText('Press keys…')).toBeInTheDocument()
})

test('capturing a key combo updates the pending binding display', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  fireEvent.keyDown(window, { code: 'KeyT', ctrlKey: true, shiftKey: true, key: 'T' })
  expect(screen.getByText('Ctrl+Shift+T')).toBeInTheDocument()
})

test('Save Shortcuts button calls onSaveKeybindings after a change', async () => {
  setupMocks(noDrift, successResult)
  const onSaveKeybindings = jest.fn().mockResolvedValue(undefined)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={onSaveKeybindings} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  fireEvent.keyDown(window, { code: 'KeyT', ctrlKey: true, shiftKey: true, key: 'T' })
  fireEvent.click(screen.getByText('Save Shortcuts'))
  await waitFor(() => expect(onSaveKeybindings).toHaveBeenCalled())
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer
npx jest tests/renderer/SettingsModal.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: FAIL — existing tests fail because `SettingsModal` doesn't accept `keybindings` prop yet; new tests fail because features don't exist.

- [ ] **Step 3: Update `src/renderer/components/SettingsModal.tsx`**

Replace the entire file:

```typescript
import React, { useEffect, useState } from 'react'
import { formatKeybinding } from '../types/ipc'
import type { DriftStatus, SyncResult, Keybindings, KeybindingAction } from '../types/ipc'

const ACTION_LABELS: Record<string, string> = {
  newSession:       'New Session',
  killSession:      'Kill Active Session',
  nextSession:      'Next Session',
  prevSession:      'Previous Session',
  sessionByIndex1:  'Switch to Session 1',
  sessionByIndex2:  'Switch to Session 2',
  sessionByIndex3:  'Switch to Session 3',
  sessionByIndex4:  'Switch to Session 4',
  sessionByIndex5:  'Switch to Session 5',
  sessionByIndex6:  'Switch to Session 6',
  sessionByIndex7:  'Switch to Session 7',
  sessionByIndex8:  'Switch to Session 8',
  sessionByIndex9:  'Switch to Session 9',
  openDrawer:       'Open Session List',
  openSettings:     'Open Settings',
  openShortcuts:    'Show Keyboard Shortcuts',
}

interface Props {
  onClose: () => void
  keybindings: Keybindings
  onSaveKeybindings: (kb: Keybindings) => Promise<void>
}

export function SettingsModal({ onClose, keybindings, onSaveKeybindings }: Props) {
  const [status,    setStatus]    = useState<DriftStatus | null>(null)
  const [syncing,   setSyncing]   = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  const [pendingKb,       setPendingKb]       = useState<Keybindings>(() => keybindings)
  const [capturingAction, setCapturingAction] = useState<KeybindingAction | null>(null)
  const [savingKb,        setSavingKb]        = useState(false)

  const isKbDirty = JSON.stringify(pendingKb) !== JSON.stringify(keybindings)

  useEffect(() => {
    window.overseer.syncStatus().then(setStatus)
  }, [])

  useEffect(() => {
    if (!capturingAction) return
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.key === 'Escape') { setCapturingAction(null); return }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      setPendingKb(prev => ({
        ...prev,
        [capturingAction]: { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey },
      }))
      setCapturingAction(null)
    }
    window.addEventListener('keydown', handleCapture, { capture: true })
    return () => window.removeEventListener('keydown', handleCapture, { capture: true })
  }, [capturingAction])

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

  const handleSaveKb = async () => {
    setSavingKb(true)
    await onSaveKeybindings(pendingKb)
    setSavingKb(false)
  }

  const formatTimestamp = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : 'Never'

  const sectionHeading: React.CSSProperties = {
    margin: '0 0 12px', color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
  }
  const divider: React.CSSProperties = { borderTop: '1px solid #444', paddingTop: 12 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' }}>
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

        {/* Sync section */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={sectionHeading}>Sync</h3>
          <div style={divider}>
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

        {/* Shortcuts section */}
        <div>
          <h3 style={sectionHeading}>Shortcuts</h3>
          <div style={divider}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <tbody>
                {(Object.entries(pendingKb) as [KeybindingAction, Keybindings[KeybindingAction]][]).map(([action, kb]) => (
                  <tr key={action} style={{ borderBottom: '1px solid #3a3a3a' }}>
                    <td style={{ padding: '6px 0', color: '#ccc', fontSize: 13 }}>{ACTION_LABELS[action] ?? action}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>
                      {capturingAction === action ? (
                        <span style={{ color: '#888', fontSize: 12 }}>Press keys…</span>
                      ) : (
                        <kbd style={{ background: '#1e1e1e', border: '1px solid #555', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#eee', fontFamily: 'monospace' }}>
                          {formatKeybinding(kb)}
                        </kbd>
                      )}
                    </td>
                    <td style={{ padding: '6px 0 6px 8px' }}>
                      <button
                        onClick={() => setCapturingAction(action)}
                        style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Set
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isKbDirty && (
              <button
                onClick={handleSaveKb}
                disabled={savingKb}
                style={{ background: '#0e639c', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: savingKb ? 'wait' : 'pointer', opacity: savingKb ? 0.7 : 1 }}
              >
                {savingKb ? 'Saving…' : 'Save Shortcuts'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update existing tests in `tests/renderer/SettingsModal.test.tsx`**

Add `DEFAULT_KEYBINDINGS` to the import from ipc at the top:

```typescript
import type { DriftStatus, SyncResult } from '../../src/renderer/types/ipc'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'
```

In every existing `render(<SettingsModal ... />)` call, add the two new required props:

```
keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()}
```

There are 6 existing render calls (one per test). Update all of them.

- [ ] **Step 5: Run all tests to confirm they pass**

```bash
cd /home/toryhebert/src/overseer
npx jest --no-coverage 2>&1 | tail -20
```

Expected: all test suites PASS.

- [ ] **Step 6: Verify TypeScript**

```bash
cd /home/toryhebert/src/overseer
npx tsc -p tsconfig.renderer-test.json --noEmit
npx tsc -p tsconfig.test.json --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/components/SettingsModal.tsx tests/renderer/SettingsModal.test.tsx
git commit -m "feat: keybinding editor in SettingsModal"
```

---

### Task 9: Final integration verification

- [ ] **Step 1: Run full test suite**

```bash
cd /home/toryhebert/src/overseer
npx jest --no-coverage 2>&1 | tail -30
```

Expected: all test suites PASS with 0 failures.

- [ ] **Step 2: Run TypeScript on all configs**

```bash
npx tsc -p tsconfig.renderer-test.json --noEmit && \
npx tsc -p tsconfig.test.json --noEmit && \
echo "All TypeScript checks passed"
```

Expected: "All TypeScript checks passed".

- [ ] **Step 3: Commit App.tsx and TerminalPane changes (if not yet committed)**

```bash
git add src/renderer/App.tsx src/renderer/components/TerminalPane.tsx src/renderer/components/TerminalInstance.tsx
git commit -m "feat: wire keybindings through App → TerminalPane → TerminalInstance"
```

- [ ] **Step 4: Final commit if anything remains staged**

```bash
git status
# commit any remaining changes
```

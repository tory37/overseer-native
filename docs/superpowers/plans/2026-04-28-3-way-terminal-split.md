# 3-Way Terminal Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the 2-pane split layout into an optional 3-pane layout: main (left/full height) | companionA (top-right) | companionB (bottom-right), with drag handles, keyboard shortcuts, and full lifecycle management.

**Architecture:** Replace the single `companions` Map in `useCompanion` with a combined `{ A, B }` state object, add ratio/threeWay/secondarySwapped state, and expose new actions. Update `TerminalPane` to render a `DragHandle` component and the inner secondary column. Wire everything through `App`.

**Tech Stack:** React 18, TypeScript, xterm.js, CSS flexbox with `order`, Jest + @testing-library/react

---

## File Map

| File | Change |
|---|---|
| `src/renderer/types/ipc.ts` | Add 4 new `KeybindingAction` values + defaults |
| `src/renderer/hooks/useKeyboardShortcuts.ts` | Add 4 new `ShortcutHandlers` fields + dispatch |
| `src/renderer/hooks/useCompanion.ts` | Full rewrite: combined companion map, threeWayOpen, ratios, 3-value splitFocused, secondarySwapped, 6 new actions |
| `src/renderer/components/TerminalPane.tsx` | Add `DragHandle` component + 3-pane layout |
| `src/renderer/App.tsx` | Destructure and wire new state/handlers |
| `src/renderer/components/KeyboardShortcutsModal.tsx` | Add 4 new action labels |
| `tests/renderer/useCompanion.test.tsx` | Full rewrite for new API |
| `tests/renderer/useKeyboardShortcuts.test.tsx` | Add 4 new tests + update `makeHandlers()` |

---

## Task 1: Add 4 new `KeybindingAction` values to `src/renderer/types/ipc.ts`

**Files:**
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add 4 values to the `KeybindingAction` union and `DEFAULT_KEYBINDINGS`**

In `src/renderer/types/ipc.ts`, change the `KeybindingAction` type and `DEFAULT_KEYBINDINGS`:

```ts
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
```

Add the 4 new entries to `DEFAULT_KEYBINDINGS` (after `splitFocus`):

```ts
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
}
```

- [ ] **Step 2: Run type-check to confirm no errors**

```bash
cd /home/toryhebert/src/overseer && npx tsc --noEmit -p tsconfig.renderer.json 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones unrelated to this task).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/types/ipc.ts
git commit -m "feat: add splitFocusPrev, splitOpenThreeWay, splitClose, splitSwapSecondary keybinding actions"
```

---

## Task 2: Extend `useKeyboardShortcuts` with 4 new handlers

**Files:**
- Modify: `src/renderer/hooks/useKeyboardShortcuts.ts`
- Modify: `tests/renderer/useKeyboardShortcuts.test.tsx`

- [ ] **Step 1: Write 4 new failing tests**

Append to `tests/renderer/useKeyboardShortcuts.test.tsx` (and update `makeHandlers` to include the 4 new fields):

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
    onSplitFocusPrev:       jest.fn(),
    onSplitOpenThreeWay:    jest.fn(),
    onSplitClose:           jest.fn(),
    onSplitSwap:            jest.fn(),
    onSplitSwapSecondary:   jest.fn(),
    onSplitToggleDirection: jest.fn(),
  }
}
```

New tests to append:

```ts
test('fires onSplitFocusPrev for Ctrl+Shift+Alt+Backslash', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backslash', ctrlKey: true, shiftKey: true, altKey: true, bubbles: true }))
  })
  expect(handlers.onSplitFocusPrev).toHaveBeenCalledTimes(1)
})

test('fires onSplitOpenThreeWay for Ctrl+Shift+Equal', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Equal', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitOpenThreeWay).toHaveBeenCalledTimes(1)
})

test('fires onSplitClose for Ctrl+Shift+X', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitClose).toHaveBeenCalledTimes(1)
})

test('fires onSplitSwapSecondary for Ctrl+Shift+J', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSplitSwapSecondary).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useKeyboardShortcuts.test.tsx 2>&1 | tail -20
```

Expected: TypeScript compile error or test failures referencing missing handler fields.

- [ ] **Step 3: Update `useKeyboardShortcuts.ts`**

Replace the contents of `src/renderer/hooks/useKeyboardShortcuts.ts` with:

```ts
import { useState, useEffect, useRef } from 'react'
import { DEFAULT_KEYBINDINGS, matchKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

export interface ShortcutHandlers {
  onNewSession:           () => void
  onKillSession:          () => void
  onNextSession:          () => void
  onPrevSession:          () => void
  onSessionByIndex:       (index: number) => void
  onOpenDrawer:           () => void
  onOpenSettings:         () => void
  onOpenShortcuts:        () => void
  onSplitFocus:           () => void
  onSplitFocusPrev:       () => void
  onSplitOpenThreeWay:    () => void
  onSplitClose:           () => void
  onSplitSwap:            () => void
  onSplitSwapSecondary:   () => void
  onSplitToggleDirection: () => void
}

export interface KeyboardShortcutsAPI {
  keybindings:       Keybindings
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
      if (action === 'newSession')           { h.onNewSession();           return }
      if (action === 'killSession')          { h.onKillSession();          return }
      if (action === 'nextSession')          { h.onNextSession();          return }
      if (action === 'prevSession')          { h.onPrevSession();          return }
      if (action === 'openDrawer')           { h.onOpenDrawer();           return }
      if (action === 'openSettings')         { h.onOpenSettings();         return }
      if (action === 'openShortcuts')        { h.onOpenShortcuts();        return }
      if (action === 'splitFocus')           { h.onSplitFocus();           return }
      if (action === 'splitFocusPrev')       { h.onSplitFocusPrev();       return }
      if (action === 'splitOpenThreeWay')    { h.onSplitOpenThreeWay();    return }
      if (action === 'splitClose')           { h.onSplitClose();           return }
      if (action === 'splitSwap')            { h.onSplitSwap();            return }
      if (action === 'splitSwapSecondary')   { h.onSplitSwapSecondary();   return }
      if (action === 'splitToggleDirection') { h.onSplitToggleDirection(); return }
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
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useKeyboardShortcuts.test.tsx 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/hooks/useKeyboardShortcuts.ts tests/renderer/useKeyboardShortcuts.test.tsx
git commit -m "feat: add 4 new split keyboard shortcut handlers"
```

---

## Task 3: Rewrite `useCompanion.ts` for 3-way state

**Files:**
- Modify: `src/renderer/hooks/useCompanion.ts`
- Modify: `tests/renderer/useCompanion.test.tsx`

The key design decision: replace `companions: Map<string,string>` with a single `companions: { A: Map<string,string>, B: Map<string,string> }` state object so A and B can be updated atomically in a single `setCompanions` call. Use `useRef` for values that must be read synchronously inside callbacks (`splitOpen`, `threeWayOpen`, `splitFocused`).

- [ ] **Step 1: Write the new test file**

Replace `tests/renderer/useCompanion.test.tsx` entirely:

```tsx
import { renderHook, act } from '@testing-library/react'
import { useCompanion } from '../../src/renderer/hooks/useCompanion'
import type { Session } from '../../src/renderer/types/ipc'

const mockSession: Session = {
  id: 'session-1',
  name: 'Test Session',
  agentType: 'claude',
  cwd: '/home/test',
  envVars: {},
  scrollbackPath: '',
}

beforeEach(() => {
  ;(window as any).overseer = {
    spawnCompanion:  jest.fn()
      .mockResolvedValueOnce('companion-a-id')
      .mockResolvedValueOnce('companion-b-id'),
    killCompanion:   jest.fn().mockResolvedValue(undefined),
    onCompanionData: jest.fn().mockReturnValue(() => {}),
    onCompanionExit: jest.fn().mockReturnValue(() => {}),
  }
})

// ─── initial state ──────────────────────────────────────────────────────────

test('starts with split closed and default state', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.activeCompanionId).toBeNull()
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.splitDirection).toBe('horizontal')
  expect(result.current.splitSwapped).toBe(false)
  expect(result.current.secondarySwapped).toBe(false)
  expect(result.current.outerSplitRatio).toBe(0.5)
  expect(result.current.innerSplitRatio).toBe(0.5)
})

// ─── onSplitFocus ────────────────────────────────────────────────────────────

test('onSplitFocus when closed: spawns companionA with session cwd and focuses it', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledWith('/home/test')
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.activeCompanionId).toBe('companion-a-id')
  expect(result.current.allCompanions).toEqual([{ sessionId: 'session-1', companionId: 'companion-a-id' }])
  expect(result.current.splitFocused).toBe('companionA')
})

test('onSplitFocus when open (2-way): cycles main → companionA → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
})

test('onSplitFocus when 3-way open: cycles main → companionA → companionB → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionB')
})

test('onSplitFocus without active session is a no-op', async () => {
  const { result } = renderHook(() => useCompanion(undefined))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).not.toHaveBeenCalled()
  expect(result.current.splitOpen).toBe(false)
})

// ─── onSplitFocusPrev ────────────────────────────────────────────────────────

test('onSplitFocusPrev when open (2-way): cycles main → companionA → main (same as forward)', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitFocus() }) // back to main
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('main')
})

test('onSplitFocusPrev when 3-way open: cycles main → companionB → companionA → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.onSplitFocus() }) // companionB → main
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('main')
})

// ─── onSplitOpenThreeWay ─────────────────────────────────────────────────────

test('onSplitOpenThreeWay when split is open: spawns companionB and opens 3-way', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(2)
  expect(result.current.threeWayOpen).toBe(true)
  expect(result.current.allCompanionsB).toEqual([{ sessionId: 'session-1', companionId: 'companion-b-id' }])
  expect(result.current.splitFocused).toBe('companionB')
})

test('onSplitOpenThreeWay when split is closed: no-op', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect((window as any).overseer.spawnCompanion).not.toHaveBeenCalled()
  expect(result.current.threeWayOpen).toBe(false)
})

// ─── onSplitClose ────────────────────────────────────────────────────────────

test('onSplitClose when focused on companionB: kills B, sets threeWayOpen=false, focuses companionA', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionA')
  expect(result.current.allCompanionsB).toHaveLength(0)
})

test('onSplitClose when focused on companionA: kills A and B, closes split, focuses main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.onSplitFocus() }) // → main
  act(() => { result.current.onSplitFocus() }) // → companionA
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-a-id')
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
})

test('onSplitClose when focused on main: no-op', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitFocus() }) // → main
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).not.toHaveBeenCalled()
  expect(result.current.splitOpen).toBe(true)
})

// ─── swap actions ────────────────────────────────────────────────────────────

test('onSplitSwap toggles splitSwapped when open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitSwapped).toBe(false)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(true)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitSwap is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitSwapSecondary toggles secondarySwapped when 3-way open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.secondarySwapped).toBe(false)
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(true)
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(false)
})

test('onSplitSwapSecondary is a no-op when not 3-way', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(false)
})

// ─── direction ───────────────────────────────────────────────────────────────

test('onSplitToggleDirection toggles horizontal↔vertical when open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitDirection).toBe('horizontal')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('vertical')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('onSplitToggleDirection is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

// ─── ratios ──────────────────────────────────────────────────────────────────

test('onOuterRatio clamps to [0.1, 0.9] and updates outerSplitRatio', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onOuterRatio(0.3) })
  expect(result.current.outerSplitRatio).toBe(0.3)
  act(() => { result.current.onOuterRatio(0.05) })
  expect(result.current.outerSplitRatio).toBe(0.1)
  act(() => { result.current.onOuterRatio(0.95) })
  expect(result.current.outerSplitRatio).toBe(0.9)
})

test('onInnerRatio clamps to [0.1, 0.9] and updates innerSplitRatio', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onInnerRatio(0.7) })
  expect(result.current.innerSplitRatio).toBe(0.7)
  act(() => { result.current.onInnerRatio(0.0) })
  expect(result.current.innerSplitRatio).toBe(0.1)
})

// ─── exit cascade ────────────────────────────────────────────────────────────

test('companionB exit: sets threeWayOpen=false, focuses companionA if was on B', async () => {
  let exitCb: ((id: string) => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: (id: string) => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { exitCb?.('companion-b-id') })
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionA')
  expect(result.current.allCompanionsB).toHaveLength(0)
})

test('companionA exit: kills B, closes split, focuses main', async () => {
  let exitCb: ((id: string) => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: (id: string) => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { exitCb?.('companion-a-id') })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
})

// ─── killCompanionForSession ──────────────────────────────────────────────────

test('killCompanionForSession kills both A and B and resets layout for active session', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.killCompanionForSession('session-1') })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-a-id')
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useCompanion.test.tsx 2>&1 | tail -20
```

Expected: failures because the new API surface doesn't exist yet.

- [ ] **Step 3: Rewrite `src/renderer/hooks/useCompanion.ts`**

Replace the entire file:

```ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session } from '../types/ipc'

interface CompanionMaps {
  A: Map<string, string> // sessionId → companionId
  B: Map<string, string>
}

export interface CompanionState {
  activeCompanionId: string | null
  allCompanions:  Array<{ sessionId: string; companionId: string }>
  allCompanionsB: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  threeWayOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  secondarySwapped: boolean
  splitFocused: 'main' | 'companionA' | 'companionB'
  outerSplitRatio: number
  innerSplitRatio: number
}

export interface CompanionAPI extends CompanionState {
  onSplitFocus:            () => void
  onSplitFocusPrev:        () => void
  onSplitSwap:             () => void
  onSplitSwapSecondary:    () => void
  onSplitToggleDirection:  () => void
  onSplitOpenThreeWay:     () => void
  onSplitClose:            () => void
  onOuterRatio:            (r: number) => void
  onInnerRatio:            (r: number) => void
  killCompanionForSession: (sessionId: string) => void
}

export function useCompanion(activeSession: Session | undefined): CompanionAPI {
  const [companions, setCompanions] = useState<CompanionMaps>({ A: new Map(), B: new Map() })
  const [splitOpen, setSplitOpen]           = useState(false)
  const [threeWayOpen, setThreeWayOpen]     = useState(false)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [splitSwapped, setSplitSwapped]     = useState(false)
  const [secondarySwapped, setSecondarySwapped] = useState(false)
  const [splitFocused, setSplitFocused]     = useState<'main' | 'companionA' | 'companionB'>('main')
  const [outerSplitRatio, setOuterSplitRatio] = useState(0.5)
  const [innerSplitRatio, setInnerSplitRatio] = useState(0.5)

  const activeSessionRef  = useRef(activeSession)
  const splitOpenRef      = useRef(splitOpen)
  const threeWayOpenRef   = useRef(threeWayOpen)
  const splitFocusedRef   = useRef(splitFocused)

  useEffect(() => { activeSessionRef.current  = activeSession  }, [activeSession])
  useEffect(() => { splitOpenRef.current      = splitOpen      }, [splitOpen])
  useEffect(() => { threeWayOpenRef.current   = threeWayOpen   }, [threeWayOpen])
  useEffect(() => { splitFocusedRef.current   = splitFocused   }, [splitFocused])

  useEffect(() => {
    const unsub = window.overseer.onCompanionExit((companionId) => {
      setCompanions(prev => {
        // Check B first
        for (const [sid, cid] of prev.B) {
          if (cid === companionId) {
            const B = new Map(prev.B)
            B.delete(sid)
            if (sid === activeSessionRef.current?.id) {
              setThreeWayOpen(false)
              setSplitFocused(f => f === 'companionB' ? 'companionA' : f)
            }
            return { ...prev, B }
          }
        }
        // Check A
        for (const [sid, cid] of prev.A) {
          if (cid === companionId) {
            const A = new Map(prev.A)
            A.delete(sid)
            const bId = prev.B.get(sid)
            const B = bId ? (() => {
              window.overseer.killCompanion(bId).catch(() => {})
              const nb = new Map(prev.B)
              nb.delete(sid)
              return nb
            })() : prev.B
            if (sid === activeSessionRef.current?.id) {
              setSplitOpen(false)
              setThreeWayOpen(false)
              setSplitFocused('main')
            }
            return { A, B }
          }
        }
        return prev
      })
    })
    return unsub
  }, [])

  const onSplitFocus = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return
    if (!splitOpenRef.current) {
      setCompanions(prev => {
        if (prev.A.get(session.id)) {
          setSplitOpen(true)
          setSplitFocused('companionA')
          return prev
        }
        window.overseer.spawnCompanion(session.cwd).then(id => {
          setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
          setSplitOpen(true)
          setSplitFocused('companionA')
        }).catch((err: unknown) => console.error('companion spawn failed:', err))
        return prev
      })
      return
    }
    setSplitFocused(f => {
      if (f === 'main') return 'companionA'
      if (f === 'companionA') return threeWayOpenRef.current ? 'companionB' : 'main'
      return 'main'
    })
  }, [])

  const onSplitFocusPrev = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return
    if (!splitOpenRef.current) {
      setCompanions(prev => {
        if (prev.A.get(session.id)) {
          setSplitOpen(true)
          setSplitFocused('companionA')
          return prev
        }
        window.overseer.spawnCompanion(session.cwd).then(id => {
          setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
          setSplitOpen(true)
          setSplitFocused('companionA')
        }).catch((err: unknown) => console.error('companion spawn failed:', err))
        return prev
      })
      return
    }
    setSplitFocused(f => {
      if (f === 'main') return threeWayOpenRef.current ? 'companionB' : 'companionA'
      if (f === 'companionA') return 'main'
      return 'companionA'
    })
  }, [])

  const onSplitOpenThreeWay = useCallback(() => {
    if (!splitOpenRef.current) return
    const session = activeSessionRef.current
    if (!session) return
    setCompanions(prev => {
      if (prev.B.get(session.id)) {
        setThreeWayOpen(true)
        setSplitFocused('companionB')
        return prev
      }
      window.overseer.spawnCompanion(session.cwd).then(id => {
        setCompanions(p => ({ ...p, B: new Map(p.B).set(session.id, id) }))
        setThreeWayOpen(true)
        setSplitFocused('companionB')
      }).catch((err: unknown) => console.error('companion B spawn failed:', err))
      return prev
    })
  }, [])

  const onSplitClose = useCallback(() => {
    const session = activeSessionRef.current
    const focused = splitFocusedRef.current
    if (focused === 'main' || !session) return
    if (focused === 'companionB') {
      setCompanions(prev => {
        const bId = prev.B.get(session.id)
        if (!bId) return prev
        window.overseer.killCompanion(bId).catch(() => {})
        const B = new Map(prev.B)
        B.delete(session.id)
        return { ...prev, B }
      })
      setThreeWayOpen(false)
      setSplitFocused('companionA')
      return
    }
    setCompanions(prev => {
      const aId = prev.A.get(session.id)
      const bId = prev.B.get(session.id)
      if (aId) window.overseer.killCompanion(aId).catch(() => {})
      if (bId) window.overseer.killCompanion(bId).catch(() => {})
      const A = new Map(prev.A)
      const B = new Map(prev.B)
      A.delete(session.id)
      B.delete(session.id)
      return { A, B }
    })
    setSplitOpen(false)
    setThreeWayOpen(false)
    setSplitFocused('main')
  }, [])

  const onSplitSwap = useCallback(() => {
    if (splitOpenRef.current) setSplitSwapped(s => !s)
  }, [])

  const onSplitSwapSecondary = useCallback(() => {
    if (threeWayOpenRef.current) setSecondarySwapped(s => !s)
  }, [])

  const onSplitToggleDirection = useCallback(() => {
    if (splitOpenRef.current) setSplitDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')
  }, [])

  const onOuterRatio = useCallback((r: number) => {
    setOuterSplitRatio(Math.min(0.9, Math.max(0.1, r)))
  }, [])

  const onInnerRatio = useCallback((r: number) => {
    setInnerSplitRatio(Math.min(0.9, Math.max(0.1, r)))
  }, [])

  const killCompanionForSession = useCallback((sessionId: string) => {
    setCompanions(prev => {
      const aId = prev.A.get(sessionId)
      const bId = prev.B.get(sessionId)
      if (aId) window.overseer.killCompanion(aId).catch(() => {})
      if (bId) window.overseer.killCompanion(bId).catch(() => {})
      const A = new Map(prev.A)
      const B = new Map(prev.B)
      A.delete(sessionId)
      B.delete(sessionId)
      return { A, B }
    })
    if (sessionId === activeSessionRef.current?.id) {
      setSplitOpen(false)
      setThreeWayOpen(false)
      setSplitFocused('main')
    }
  }, [])

  const activeCompanionId = activeSession ? (companions.A.get(activeSession.id) ?? null) : null
  const allCompanions  = Array.from(companions.A.entries()).map(([sessionId, companionId]) => ({ sessionId, companionId }))
  const allCompanionsB = Array.from(companions.B.entries()).map(([sessionId, companionId]) => ({ sessionId, companionId }))

  return {
    activeCompanionId, allCompanions, allCompanionsB,
    splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
    splitFocused, outerSplitRatio, innerSplitRatio,
    onSplitFocus, onSplitFocusPrev, onSplitSwap, onSplitSwapSecondary,
    onSplitToggleDirection, onSplitOpenThreeWay, onSplitClose,
    onOuterRatio, onInnerRatio, killCompanionForSession,
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd /home/toryhebert/src/overseer && npx jest tests/renderer/useCompanion.test.tsx 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/hooks/useCompanion.ts tests/renderer/useCompanion.test.tsx
git commit -m "feat: rewrite useCompanion for 3-way split state"
```

---

## Task 4: Add `DragHandle` + rewrite `TerminalPane` layout

**Files:**
- Modify: `src/renderer/components/TerminalPane.tsx`

`DragHandle` is defined in the same file (it's tightly coupled to the layout and has no other consumers). It computes the split ratio from cursor position relative to its container. The `flipped` prop inverts the ratio for swapped layouts (main on right, or companionA on bottom).

- [ ] **Step 1: Replace `src/renderer/components/TerminalPane.tsx` entirely**

```tsx
import React, { useRef } from 'react'
import { TerminalInstance } from './TerminalInstance'
import { CompanionTerminal } from './CompanionTerminal'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  keybindings: Keybindings
  allCompanions:  Array<{ sessionId: string; companionId: string }>
  allCompanionsB: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  threeWayOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  secondarySwapped: boolean
  splitFocused: 'main' | 'companionA' | 'companionB'
  outerSplitRatio: number
  innerSplitRatio: number
  onOuterRatio: (r: number) => void
  onInnerRatio: (r: number) => void
}

function DragHandle({
  direction,
  onRatio,
  containerRef,
  flipped = false,
}: {
  direction: 'horizontal' | 'vertical'
  onRatio: (r: number) => void
  containerRef: React.RefObject<HTMLDivElement>
  flipped?: boolean
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const onMouseMove = (me: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      let raw = direction === 'horizontal'
        ? (me.clientX - rect.left) / rect.width
        : (me.clientY - rect.top) / rect.height
      if (flipped) raw = 1 - raw
      onRatio(Math.min(0.9, Math.max(0.1, raw)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const isHoriz = direction === 'horizontal'
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: isHoriz ? '5px' : '100%',
        height: isHoriz ? '100%' : '5px',
        background: '#555',
        flexShrink: 0,
        cursor: isHoriz ? 'col-resize' : 'row-resize',
        zIndex: 1,
      }}
    />
  )
}

export function TerminalPane({
  sessions, activeSessionId, keybindings,
  allCompanions, allCompanionsB,
  splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
  splitFocused, outerSplitRatio, innerSplitRatio,
  onOuterRatio, onInnerRatio,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const isRow = splitDirection === 'horizontal'
  const activeCompanionAId = allCompanions.find(c => c.sessionId === activeSessionId)?.companionId ?? null
  const showCompanion = splitOpen && !!activeCompanionAId

  const sessionStack = sessions.map(session => (
    <div
      key={session.id}
      style={{ position: 'absolute', inset: 0, display: session.id === activeSessionId ? 'block' : 'none' }}
    >
      <TerminalInstance session={session} keybindings={keybindings} />
    </div>
  ))

  const companionAStack = allCompanions.map(({ sessionId, companionId }) => (
    <div
      key={companionId}
      style={{ position: 'absolute', inset: 0, display: sessionId === activeSessionId ? 'block' : 'none' }}
    >
      <CompanionTerminal
        companionId={companionId}
        focused={splitFocused === 'companionA' && sessionId === activeSessionId}
        keybindings={keybindings}
      />
    </div>
  ))

  const companionBStack = allCompanionsB.map(({ sessionId, companionId }) => (
    <div
      key={companionId}
      style={{ position: 'absolute', inset: 0, display: threeWayOpen && sessionId === activeSessionId ? 'block' : 'none' }}
    >
      <CompanionTerminal
        companionId={companionId}
        focused={splitFocused === 'companionB' && sessionId === activeSessionId}
        keybindings={keybindings}
      />
    </div>
  ))

  const mainFlex      = showCompanion ? `0 0 ${outerSplitRatio * 100}%`       : '1'
  const secondaryFlex = showCompanion ? `0 0 ${(1 - outerSplitRatio) * 100}%` : '0'
  const companionAFlex = threeWayOpen ? `0 0 ${innerSplitRatio * 100}%`       : '1'
  const companionBFlex = threeWayOpen ? `0 0 ${(1 - innerSplitRatio) * 100}%` : '0'

  // Always use the same flex structure so sessionStack's wrapper never changes
  // position in the React tree (avoids remounting xterm on layout changes).
  return (
    <div ref={outerRef} style={{ flex: 1, display: 'flex', flexDirection: isRow ? 'row' : 'column', background: '#1e1e1e' }}>
      {/* Main panel */}
      <div style={{ flex: mainFlex, position: 'relative', overflow: 'hidden', order: splitSwapped ? 2 : 0 }}>
        {sessionStack}
      </div>

      {/* Outer drag handle — only when companion is visible */}
      {showCompanion && (
        <DragHandle
          direction={splitDirection}
          onRatio={onOuterRatio}
          containerRef={outerRef}
          flipped={splitSwapped}
        />
      )}

      {/* Secondary column */}
      <div
        ref={innerRef}
        style={{
          flex: secondaryFlex,
          display: showCompanion ? 'flex' : 'none',
          flexDirection: isRow ? 'column' : 'row',
          overflow: 'hidden',
          order: splitSwapped ? 0 : 2,
        }}
      >
        {/* CompanionA pane */}
        <div style={{ flex: companionAFlex, position: 'relative', overflow: 'hidden', order: secondarySwapped ? 2 : 0 }}>
          {companionAStack}
        </div>

        {/* Inner drag handle — only in 3-way mode */}
        {threeWayOpen && (
          <DragHandle
            direction={isRow ? 'vertical' : 'horizontal'}
            onRatio={onInnerRatio}
            containerRef={innerRef}
            flipped={secondarySwapped}
          />
        )}

        {/* CompanionB pane */}
        <div style={{
          flex: companionBFlex,
          position: 'relative',
          overflow: 'hidden',
          order: secondarySwapped ? 0 : 2,
          display: threeWayOpen ? undefined : 'none',
        }}>
          {companionBStack}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /home/toryhebert/src/overseer && npx tsc --noEmit -p tsconfig.renderer.json 2>&1 | head -30
```

Expected: type errors about `App.tsx` (it still passes old props). That's expected — fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/TerminalPane.tsx
git commit -m "feat: add DragHandle and 3-pane layout to TerminalPane"
```

---

## Task 5: Wire new handlers in `App.tsx`

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Replace the relevant section of `src/renderer/App.tsx`**

Replace the entire file with:

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
    allCompanions, allCompanionsB,
    splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
    splitFocused, outerSplitRatio, innerSplitRatio,
    onSplitFocus, onSplitFocusPrev, onSplitSwap, onSplitSwapSecondary,
    onSplitToggleDirection, onSplitOpenThreeWay, onSplitClose,
    onOuterRatio, onInnerRatio,
    killCompanionForSession,
  } = useCompanion(activeSession)

  const handleKillActive = () => {
    if (activeSessionId) {
      killCompanionForSession(activeSessionId)
      killSession(activeSessionId).catch(console.error)
    }
  }

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
    onSplitFocusPrev,
    onSplitOpenThreeWay,
    onSplitClose,
    onSplitSwap,
    onSplitSwapSecondary,
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
          allCompanions={allCompanions}
          allCompanionsB={allCompanionsB}
          splitOpen={splitOpen}
          threeWayOpen={threeWayOpen}
          splitDirection={splitDirection}
          splitSwapped={splitSwapped}
          secondarySwapped={secondarySwapped}
          splitFocused={splitFocused}
          outerSplitRatio={outerSplitRatio}
          innerSplitRatio={innerSplitRatio}
          onOuterRatio={onOuterRatio}
          onInnerRatio={onInnerRatio}
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

- [ ] **Step 2: Run type-check — should now be clean**

```bash
cd /home/toryhebert/src/overseer && npx tsc --noEmit -p tsconfig.renderer.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
cd /home/toryhebert/src/overseer && npx jest 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: wire 3-way split handlers and props in App"
```

---

## Task 6: Add 4 new action labels in `KeyboardShortcutsModal.tsx`

**Files:**
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Add 4 new entries to `ACTION_LABELS`**

In `src/renderer/components/KeyboardShortcutsModal.tsx`, update the `ACTION_LABELS` record:

```ts
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
  openDrawer:           'Open Session List',
  openSettings:         'Open Settings',
  openShortcuts:        'Show Keyboard Shortcuts',
  splitFocus:           'Open / Focus Next Pane',
  splitFocusPrev:       'Focus Previous Pane',
  splitOpenThreeWay:    'Open 3-Way Split',
  splitClose:           'Close Focused Pane',
  splitSwap:            'Swap Main / Secondary Columns',
  splitSwapSecondary:   'Swap Companion Panes (3-way)',
  splitToggleDirection: 'Toggle Split Direction',
}
```

- [ ] **Step 2: Run all tests one final time**

```bash
cd /home/toryhebert/src/overseer && npx jest 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "feat: add labels for 4 new split keyboard shortcuts"
```

---

## Self-Review Against Spec

| Spec requirement | Covered by |
|---|---|
| `companionsA` / `companionsB` maps | Task 3 |
| `threeWayOpen` state | Task 3 |
| `outerSplitRatio` / `innerSplitRatio` (default 0.5, clamped [0.1, 0.9]) | Task 3 |
| `splitFocused: 'main' \| 'companionA' \| 'companionB'` | Task 3 |
| `secondarySwapped` | Task 3 |
| B-exits cascade: threeWayOpen=false, focus→companionA | Task 3 |
| A-exits cascade: kill B, splitOpen=false, focus→main | Task 3 |
| Session killed: kill both companions | Task 3 |
| Ratios not persisted (reset on restart) | Task 3 (in-memory only) |
| `DragHandle` component (direction, onRatio, containerRef, flipped) | Task 4 |
| 2-way mode: main + outer DragHandle + companionA | Task 4 |
| 3-way mode: outer DragHandle + inner DragHandle | Task 4 |
| `outerSplitRatio` drives main panel width | Task 4 |
| `innerSplitRatio` drives companionA height within secondary | Task 4 |
| `splitSwapped` via CSS `order` | Task 4 |
| `secondarySwapped` via CSS `order` within secondary column | Task 4 |
| companionA/B always-rendered stacks (preserve xterm state) | Task 4 |
| `splitFocus` — forward cycle, opens if closed | Task 3 |
| `splitFocusPrev` — backward cycle | Task 3 |
| `splitOpenThreeWay` — spawns B if needed, opens 3-way | Task 3 |
| `splitClose` — closes focused pane | Task 3 |
| `splitSwap` — swap main ↔ secondary | Task 3 |
| `splitSwapSecondary` — swap A ↔ B within secondary | Task 3 |
| `splitToggleDirection` — horizontal ↔ vertical | Task 3 |
| 4 new `KeybindingAction` values + defaults | Task 1 |
| 4 new `ShortcutHandlers` entries + dispatch | Task 2 |
| 4 new `ACTION_LABELS` | Task 6 |
| All wired in `App.tsx` | Task 5 |

# Plan: Random Theme Keyboard Shortcut

## Current State (from exploration)

Good news — this feature is **partially implemented** already:

| Layer | Status |
|---|---|
| `src/renderer/types/ipc.ts` | ✅ `randomTheme` in `KeybindingAction`, `DEFAULT_KEYBINDINGS` (Ctrl+Shift+T), and `ACTION_LABELS` |
| `src/renderer/store/theme.ts` | ✅ `setRandomTheme()` fully implemented in Zustand store |
| `src/renderer/hooks/useKeyboardShortcuts.ts` | ❌ Missing `onRandomTheme` in `ShortcutHandlers`, not dispatched in handler |
| `src/renderer/App.tsx` | ❌ `onRandomTheme` not passed to `useKeyboardShortcuts` |
| `src/renderer/components/KeyboardShortcutsModal.tsx` | ❌ `randomTheme` not in any GROUPS array (so it won't display in the modal) |
| Tests | ❌ No test for `onRandomTheme` firing |

The gap is entirely in wiring: the action exists at both ends (IPC type + store), but the hook and App don't connect them.

---

## Tests First

**File:** `tests/renderer/useKeyboardShortcuts.test.tsx`

Add to `makeHandlers()`:
```ts
onRandomTheme: jest.fn(),
```

Add test:
```ts
test('fires onRandomTheme for Ctrl+Shift+T', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onRandomTheme).toHaveBeenCalledTimes(1)
})
```

---

## Implementation Steps

### 1. `useKeyboardShortcuts.ts`
- Add `onRandomTheme: () => void` to `ShortcutHandlers` interface
- Add dispatch: `if (action === 'randomTheme') { h.onRandomTheme(); return }`

### 2. `App.tsx`
- Destructure `setRandomTheme` from `useThemeStore()`
- Add `onRandomTheme: setRandomTheme` to the `useKeyboardShortcuts` call

### 3. `KeyboardShortcutsModal.tsx`
- Add `'randomTheme'` to the `GENERAL` group (or create a new `THEMES` group)
- Recommend: add to `GENERAL` group for now (low friction, no new group needed)

---

## Rationale

- No new IPC, no new store state — just wiring.
- The default binding (Ctrl+Shift+T) is already in `DEFAULT_KEYBINDINGS`, so existing users who already have a saved keybindings file won't get it automatically — but new installs will.
- Adding it to the `GENERAL` group in the shortcuts modal is the least disruptive placement.

---

## Optional Improvements (not blocking)

- A `THEMES` group in the shortcuts modal could be added in a future pass if more theme-related shortcuts are planned.

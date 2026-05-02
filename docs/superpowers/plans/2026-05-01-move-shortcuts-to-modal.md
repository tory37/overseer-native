# Move Shortcut Customization to KeyboardShortcutsModal Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate keyboard shortcut remapping functionality from the Settings menu to the Keyboard Shortcuts modal.

**Architecture:** Move capturing logic and "Set/Save" buttons to `KeyboardShortcutsModal.tsx`, remove the "Shortcuts" section from `SettingsModal.tsx`, and shared `ACTION_LABELS` in `ipc.ts`.

**Tech Stack:** React (TypeScript), Electron IPC.

---

### Task 1: Consolidate ACTION_LABELS to ipc.ts

**Files:**
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Move ACTION_LABELS to ipc.ts**

```typescript
export const ACTION_LABELS: Record<KeybindingAction, string> = {
  newSession:           'New Session',
  killSession:          'Delete Active Session',
  nextSession:          'Next Session',
  prevSession:          'Previous Session',
  sessionByIndex1:      'Switch to Session 1',
  sessionByIndex2:      'Switch to Session 2',
  sessionByIndex3:      'Switch to Session 3',
  sessionByIndex4:      'Switch to Session 4',
  sessionByIndex5:      'Switch to Session 5',
  sessionByIndex6:      'Switch to Session 6',
  sessionByIndex7:      'Switch to Session 7',
  sessionByIndex8:      'Switch to Session 8',
  sessionByIndex9:      'Switch to Session 9',
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
  toggleSpritePanel:    'Toggle Sprite Panel',
  openSpriteStudio:     'Open Sprite Studio',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/types/ipc.ts
git commit -m "refactor: move ACTION_LABELS to shared ipc types"
```

---

### Task 2: Simplify SettingsModal

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`

- [ ] **Step 1: Remove ACTION_LABELS and shortcuts section**

Remove the `ACTION_LABELS` constant, shortcut-related states (`pendingKb`, `capturingAction`, `savingKb`), and the "Shortcuts" section from the JSX. Update imports to use `ACTION_LABELS` from `../types/ipc` if needed (it won't be needed here anymore).

- [ ] **Step 2: Verify build**

Run: `npm run build` (or similar) to ensure no regressions in types.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/SettingsModal.tsx
git commit -m "feat: remove shortcuts customization from SettingsModal"
```

---

### Task 3: Upgrade KeyboardShortcutsModal with Editing Logic

**Files:**
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Add new props and state**

Add `onSaveKeybindings` to `Props`. Add `pendingKb`, `capturingAction`, and `savingKb` state.

- [ ] **Step 2: Implement key capture logic**

Add `useEffect` to handle key capture when `capturingAction` is set.

```typescript
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
```

- [ ] **Step 3: Add "Set" buttons and "Save" button to UI**

Update the grid to show a "Set" button next to each shortcut. Add a footer with a "Save Shortcuts" button if `isKbDirty`.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "feat: add shortcut editing to KeyboardShortcutsModal"
```

---

### Task 4: Wire up App.tsx

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Pass onSaveKeybindings to KeyboardShortcutsModal**

Pass the existing `updateKeybindings` (or equivalent) to the modal.

- [ ] **Step 2: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: wire up shortcut saving in App"
```

---

### Task 5: Verification

- [ ] **Step 1: Run existing tests**

Run: `npm test tests/renderer/KeyboardShortcutsModal.test.tsx`

- [ ] **Step 2: Add new test case for capturing**

Ensure that clicking "Set" and pressing a key updates the pending state.

- [ ] **Step 3: Final check in UI**

(Manual check or automated UI test if available).

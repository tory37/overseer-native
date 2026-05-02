# Consolidate ACTION_LABELS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `ACTION_LABELS` to `src/renderer/types/ipc.ts` to share them between components.

**Architecture:** Define `ACTION_LABELS` constant in the shared IPC types file, using `KeybindingAction` for type safety.

**Tech Stack:** TypeScript, React

---

### Task 1: Update src/renderer/types/ipc.ts

**Files:**
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add ACTION_LABELS constant**

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

- [ ] **Step 2: Verify type checking**

Run: `npx tsc --noEmit`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add src/renderer/types/ipc.ts
git commit -m "refactor: move ACTION_LABELS to shared ipc types"
```

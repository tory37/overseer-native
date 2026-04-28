# Design Spec: Fix 3-Way Split Entry

**Date:** 2026-04-28
**Status:** Approved

---

## Overview

Fix a bug where the "Open 3-Way Split" action (`onSplitOpenThreeWay`) fails to do anything if the split is currently closed. The user expects this action to jump directly to a 3-way split layout, spawning all necessary companion processes.

---

## Proposed Changes

### 1. `useCompanion.ts` Refactor

The `onSplitOpenThreeWay` function will be updated to:
- Remove the guard clause that prevents action when `splitOpen` is false.
- Check if Companion A exists for the active session; if not, spawn it.
- Check if Companion B exists for the active session; if not, spawn it.
- Once both are initiated, update state:
    - `splitOpen = true`
    - `threeWayOpen = true`
    - `splitFocused = 'companionB'`

### 2. Implementation Strategy

To avoid complex async chaining within `setCompanions`, we'll use an async sequence:
1. Get current `companions` state.
2. Check if Companion A is needed. If so, `spawnCompanion`.
3. Check if Companion B is needed. If so, `spawnCompanion`.
4. Update `companions` Map state and visibility states atomically where possible, or in a clear sequence that avoids race conditions.

---

## Testing Plan

### Automated Tests
- **File:** `tests/renderer/useCompanion.test.tsx`
- **Case:** `onSplitOpenThreeWay when split is closed: spawns BOTH companion A and B, opens 3-way, and focuses B`.
- **Verification:** Ensure `spawnCompanion` is called twice and state transitions are correct.

### Manual Verification
- Press the "Open 3-Way Split" keyboard shortcut (Ctrl+Shift+=) while in a single-pane view.
- Verify two companion panes appear instantly and focus is on the bottom-right pane.

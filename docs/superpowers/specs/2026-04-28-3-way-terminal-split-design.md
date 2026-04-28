# 3-Way Terminal Split — Design Spec

**Date:** 2026-04-28
**Status:** Approved

---

## Overview

Extend the existing 2-pane split layout (main | companion) into an optional 3-pane layout:
main (left, full height) | companionA (top-right) | companionB (bottom-right).

The main agent panel never moves into a smaller slot. CompanionA and companionB are always
spawned in the active session's cwd. All companion PTYs persist in-memory per session, exactly
as the current single companion does.

---

## Section 1: State Model

### New state in `useCompanion`

| Field | Type | Description |
|---|---|---|
| `companionsA` | `Map<sessionId, companionId>` | Primary companion per session (replaces `companions`) |
| `companionsB` | `Map<sessionId, companionId>` | Secondary companion per session |
| `splitOpen` | `boolean` | Whether the outer split (main + secondary column) is open |
| `threeWayOpen` | `boolean` | Whether the inner secondary split is also open |
| `splitDirection` | `'horizontal' \| 'vertical'` | Direction of the outer split |
| `splitSwapped` | `boolean` | Whether main and secondary columns are swapped |
| `secondarySwapped` | `boolean` | Whether companionA and companionB positions are swapped within the secondary column |
| `outerSplitRatio` | `number` | Fraction of width given to the main panel (default 0.5, clamped [0.1, 0.9]) |
| `innerSplitRatio` | `number` | Fraction of secondary column height given to companionA (default 0.5, clamped [0.1, 0.9]) |
| `splitFocused` | `'main' \| 'companionA' \| 'companionB'` | Currently focused pane |

### Collapse cascade on exit

- **companionB exits:** `threeWayOpen = false`, focus → `companionA` (if currently on B)
- **companionA exits:** kill companionB, `splitOpen = false`, `threeWayOpen = false`, focus → `main`
- **Session killed:** kill both companions for that session

### Ratio persistence

Ratios are not persisted to disk. They reset to 0.5 / 0.5 on app restart.

---

## Section 2: Layout & TerminalPane Rendering

### Component: `DragHandle`

A thin interactive strip between panes. On `mousedown`, attaches `mousemove`/`mouseup` to
`document`, computes the new ratio from cursor position relative to the container, clamps to
`[0.1, 0.9]`, and calls an `onRatio` callback.

Props: `direction: 'horizontal' | 'vertical'`, `onRatio: (r: number) => void`

### TerminalPane layout

```
┌──────────────────────┬──────────────────┐
│                      ║  companionA      │
│   main session       ╠══════════════════╡  ← inner DragHandle (3-way only)
│   (always left)      ║  companionB      │
└──────────────────────╨──────────────────┘
          ↑ outer DragHandle (always visible when split open)
```

- In 2-way mode: `main | DragHandle | companionA column`
- In 3-way mode: `main | DragHandle | (companionA / innerDragHandle / companionB)`
- `outerSplitRatio` controls main panel width: `flex: 0 0 ${outerSplitRatio * 100}%`
- `innerSplitRatio` controls companionA height within secondary column
- `splitSwapped` swaps the main and secondary column positions via CSS `order`
- `secondarySwapped` swaps companionA and companionB positions via CSS `order` within the secondary column
- Both companionA and companionB render as always-present stacks (position: absolute, display: none/block per active session), preserving xterm DOM state across tab switches

### Props changes to `TerminalPane`

Add: `threeWayOpen`, `outerSplitRatio`, `innerSplitRatio`, `secondarySwapped`, `onOuterRatio`, `onInnerRatio`, `allCompanionsB`

---

## Section 3: Keyboard Shortcuts & Actions

Seven split-related actions total (3 existing, 4 new):

| Action | Default | Description |
|---|---|---|
| `splitFocus` | (existing) | Cycle focus **forward**: main → A → B → main (skips B if not 3-way) |
| `splitFocusPrev` | **new** | Cycle focus **backward**: main → B → A → main (skips B if not 3-way) |
| `splitOpenThreeWay` | **new** | If split is open, open the 3-way layout directly (spawn companionB if needed) |
| `splitClose` | **new** | Close the currently focused companion pane; if focused on main, no-op |
| `splitSwap` | (existing) | Swap main ↔ secondary column positions |
| `splitSwapSecondary` | **new** | Swap companionA ↔ companionB positions within secondary column (3-way only) |
| `splitToggleDirection` | (existing) | Toggle outer split direction horizontal ↔ vertical |

### Files to update

- `src/renderer/types/ipc.ts` — add 4 new values to `KeybindingAction` union and `DEFAULT_KEYBINDINGS`
- `src/renderer/hooks/useKeyboardShortcuts.ts` — add 4 new handler callbacks to `ShortcutHandlers`
- `src/renderer/App.tsx` — wire new handlers from `useCompanion` into `useKeyboardShortcuts`
- `src/renderer/components/KeyboardShortcutsModal.tsx` — add display labels for 4 new actions

---

## Section 4: Persistence & Session Lifecycle

### In-memory per-session companion tracking

- `companionsA: Map<sessionId, companionId>` — survives tab switches, cleaned up on session kill or companion exit
- `companionsB: Map<sessionId, companionId>` — same lifecycle as A

### Layout state is global (not per-session)

`splitOpen`, `threeWayOpen`, `splitDirection`, `splitSwapped`, `secondarySwapped`, `outerSplitRatio`, `innerSplitRatio`, and `splitFocused` are global to the app. Switching tabs does not reset the layout. The actual companion visibility is driven by whether the session has a companion in the map.

### Collapse cascade (detailed)

1. `onCompanionExit(companionId)`:
   - If companionId matches a B slot: `threeWayOpen = false`; if `splitFocused === 'companionB'` → `splitFocused = 'companionA'`
   - If companionId matches an A slot: kill its B companion (if any), `splitOpen = false`, `threeWayOpen = false`, `splitFocused = 'main'`

2. `killCompanionForSession(sessionId)`: kill both A and B companions for session; reset `splitOpen`, `threeWayOpen`, `splitFocused` if this is the active session

3. `splitClose` action:
   - If `splitFocused === 'companionB'`: kill B, `threeWayOpen = false`, focus → `companionA`
   - If `splitFocused === 'companionA'`: kill A (cascade also kills B), `splitOpen = false`, focus → `main`
   - If `splitFocused === 'main'`: no-op

---

## Files Changed (Summary)

| File | Change |
|---|---|
| `src/renderer/hooks/useCompanion.ts` | Major: two maps, threeWayOpen, ratios, 3-value splitFocused, secondarySwapped, 4 new actions |
| `src/renderer/components/TerminalPane.tsx` | Major: outer+inner DragHandle, 3-pane layout, ratio-based sizing, companionB stack |
| `src/renderer/types/ipc.ts` | Add 4 new KeybindingAction values + defaults |
| `src/renderer/hooks/useKeyboardShortcuts.ts` | Add 4 new ShortcutHandlers entries |
| `src/renderer/App.tsx` | Wire 4 new handler callbacks |
| `src/renderer/components/KeyboardShortcutsModal.tsx` | Add 4 new action labels |
| `src/renderer/components/CompanionTerminal.tsx` | No changes (reused for both A and B slots) |
| `src/main/companion-pty-manager.ts` | No changes (already supports multiple companions by ID) |

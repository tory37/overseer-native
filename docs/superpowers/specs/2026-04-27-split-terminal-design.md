# Split Terminal Design

**Date:** 2026-04-27
**Status:** Approved

## Overview

Add split-terminal support to Overseer. The primary use case: agent terminal (Claude) in one pane, plain shell for git/vim/etc. in the other. The companion pane is transient — it is not a named session, does not appear in the tab bar or session drawer, and is killed when the split is closed.

---

## Section 1: Architecture

**Transient companion PTY** — a separate `CompanionPtyManager` in the main process manages a single short-lived PTY per split. It is entirely independent of `PtyManager` and the session registry (`~/.overseer/sessions/registry.json`). The companion has no name, no agent type, and is not persisted.

**Renderer state** lives in `App.tsx` via a `useCompanion` hook:
- `companionId: string | null` — IPC handle for the live PTY; null when no split is open
- `splitOpen: boolean` — whether the companion pane is visible
- `splitDirection: 'horizontal' | 'vertical'` — layout axis
- `splitFocused: 'main' | 'companion'` — which pane has keyboard focus
- `splitSwapped: boolean` — whether the two panes have been swapped from their default sides

`TerminalPane` receives these as props and renders either its existing single-pane layout or a flexbox split.

---

## Section 2: Split Config & Keyboard Shortcuts

**State model**

| Field | Values | Default |
|---|---|---|
| `splitOpen` | `boolean` | `false` |
| `splitDirection` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `splitSwapped` | `boolean` | `false` |
| `splitFocused` | `'main' \| 'companion'` | `'main'` |

**Three new keyboard actions**

| Action | Default binding | Behavior |
|---|---|---|
| `splitFocus` | `Ctrl+Shift+\` | If companion closed → spawn + open + focus companion. If open → toggle focus between main and companion. |
| `splitSwap` | `Ctrl+Shift+M` | Swap which side each pane occupies. No-op if split is closed. |
| `splitToggleDirection` | `Ctrl+Shift+\`` | Toggle between horizontal and vertical layout. No-op if split is closed. |

All three follow the existing `Ctrl+Shift+` prefix convention, appear in the keyboard shortcuts modal, and are rebindable in settings.

**Layout**

- `horizontal` (default): main left, companion right (or swapped: companion left, main right)
- `vertical`: main top, companion bottom (or swapped: companion top, main bottom)
- Each pane takes 50% of the available space.

---

## Section 3: Data Flow

**Main process — `CompanionPtyManager`** (`src/main/companion-pty-manager.ts`)

IPC handlers:
- `companion:spawn` → spawns `/bin/bash` (or user's `$SHELL`), returns `companionId` (UUID)
- `companion:kill` → kills PTY, cleans up
- `companion:input` → writes data to PTY
- `companion:resize` → resizes PTY columns/rows
- `companion:data` → push event from main → renderer (mirrors `pty:data` pattern)
- `companion:exit` → push event emitted when PTY exits unexpectedly

**Renderer — `useCompanion` hook** (`src/renderer/hooks/useCompanion.ts`)

Manages `companionId`, `splitOpen`, `splitDirection`, `splitSwapped`, `splitFocused`. Handles `companion:exit` by closing the split and nulling the ID.

**`TerminalPane`** receives `companionId`, `splitOpen`, `splitDirection`, `splitSwapped`, `splitFocused` as props. When `splitOpen` is true, renders a flexbox container with:
- The existing session-overlay stack on the main side
- A new `CompanionTerminal` component on the companion side

**`CompanionTerminal`** (`src/renderer/components/CompanionTerminal.tsx`) — mirrors `TerminalInstance` but wired to `companion:*` IPC instead of `pty:*`. Receives `companionId` and a `focused` boolean; calls `xterm.focus()` when `focused` changes to true.

---

## Section 4: Error Handling

| Scenario | Behavior |
|---|---|
| `companion:spawn` rejects | `useCompanion` catches, leaves `companionId` null, split does not open. Console error only. |
| Companion PTY exits unexpectedly | Main emits `companion:exit`; renderer closes split, nulls ID. Main session is unaffected. |
| `companion:input` / `companion:resize` after companion is dead | Main process silently drops the call. |

---

## Files Touched

| File | Change |
|---|---|
| `src/main/companion-pty-manager.ts` | **New** — transient PTY manager |
| `src/main/index.ts` | Register `CompanionPtyManager` and its IPC handlers |
| `src/renderer/types/ipc.ts` | Add `splitFocus`, `splitSwap`, `splitToggleDirection` to `KeybindingAction` and `DEFAULT_KEYBINDINGS`; add `companion:*` IPC constants |
| `src/renderer/hooks/useCompanion.ts` | **New** — companion lifecycle and split state |
| `src/renderer/hooks/useKeyboardShortcuts.ts` | Add `onSplitFocus`, `onSplitSwap`, `onSplitToggleDirection` to `ShortcutHandlers` |
| `src/renderer/components/CompanionTerminal.tsx` | **New** — xterm instance wired to companion IPC |
| `src/renderer/components/TerminalPane.tsx` | Render flexbox split when `splitOpen`; pass companion props |
| `src/renderer/App.tsx` | Wire `useCompanion`, pass split state to `TerminalPane`, add handlers to `useKeyboardShortcuts` |
| `src/main/preload.ts` | Expose `companion:*` IPC via `contextBridge` |
| `CLAUDE.md` | Add keyboard shortcut rule |

---

## CLAUDE.md Rule

```
## Keyboard Shortcuts

When adding any new user-facing feature, explicitly decide whether it warrants a keyboard shortcut. If yes, implement the shortcut alongside the feature — not as a follow-up. Add it to `KeybindingAction`, `DEFAULT_KEYBINDINGS`, and the shortcuts modal in the same PR.
```

# Spec: P3/P4 UI Polish & Infrastructure Fixes

This document outlines the design for three P3/P4 items: Focused Terminal Indicator, Per-Session Layout Persistence, and the TypeScript Buffer fix.

## 1. Focused Terminal Indicator (P3)

**Goal:** Provide clear visual feedback on which terminal pane is currently active.

### UI Design
- **Highlight Style:** The focused pane will have a 2px outline using the theme's `accent` color.
- **Visual Stability:** To prevent layout shifts, we will use `outline` instead of `border`.
- **CSS Properties:**
  - `outline: 2px solid var(--accent)`
  - `outline-offset: -2px` (draws the outline inside the box)
  - `z-index: 10` (elevates the focused pane so the highlight isn't overlapped by neighboring panes)

### Components Affected
- `src/renderer/components/TerminalPane.tsx`: Will receive `splitFocused` prop and apply the highlight style to the appropriate container.

---

## 2. Per-Session Window Layout Persistence (P3)

**Goal:** Automatically remember and restore the split layout (2-way/3-way, sizing, swapped status) for each session tab independently.

### Data Model Changes
Update the `Session` interface in `src/renderer/types/ipc.ts`:

```typescript
export interface SessionLayout {
  splitOpen: boolean
  threeWayOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  secondarySwapped: boolean
  outerSplitRatio: number
  innerSplitRatio: number
}

export interface Session {
  // ... existing fields
  layout?: SessionLayout
}
```

### IPC & Persistence
- **New IPC:** `session:update` to allow the renderer to update session properties (persisted by `SessionRegistry` in `registry.json`).
- **Store Update:** Add `updateSession(sessionId, partialSession)` to `useSessionStore`.
- **Flow:**
  1. User changes layout (toggles split, drags handle).
  2. `useCompanion.ts` (or `TerminalPane.tsx`) detects the change.
  3. `useSessionStore.updateSession()` is called.
  4. Change is sent via IPC to the main process and saved to `registry.json`.

### Hydration
When a session is activated in the `TabBar`, the layout state in the companion hook will be initialized from the `session.layout` property.

---

## 3. TypeScript Buffer Fix (P4)

**Goal:** Remove the `TS2591: Cannot find name 'Buffer'` error in the renderer without adding Node.js types.

### Strategy
Switch from string-based binary transfer to raw `Uint8Array` transfer, which is natively supported by Electron's IPC bridge and `xterm.js`.

### Changes
- **Main Process (`src/main/ipc-handlers.ts`):** Return the raw `Buffer` from the `SCROLLBACK_GET` handler instead of `.toString('binary')`. Electron will automatically convert this to a `Uint8Array` for the renderer.
- **Renderer (`src/renderer/components/TerminalInstance.tsx`):** Pass the received `Uint8Array` directly to `term.write()`.

---

## Verification Plan

### Automated Tests
- **Persistence:** Create a test that updates a session's layout and verifies it remains after a "reload" (simulated by re-listing sessions).
- **Buffer:** Verify `TerminalInstance` can handle `Uint8Array` data from the scrollback IPC.

### Manual Verification
1. **Focus:** Open splits and click between them. Verify the accent border moves correctly and doesn't cause content to jump.
2. **Layout Persistence:**
   - Create two sessions.
   - Set Session 1 to a 3-way vertical split with specific sizing.
   - Set Session 2 to a 2-way horizontal split.
   - Switch between them; verify layouts are restored.
   - Restart the app; verify layouts are restored for both.
3. **Buffer Fix:** Ensure scrollback still renders correctly when opening an existing session.

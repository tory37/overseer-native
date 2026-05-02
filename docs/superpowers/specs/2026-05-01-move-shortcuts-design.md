# Design Spec: Move Shortcut Customization to KeyboardShortcutsModal

**Date:** 2026-05-01
**Topic:** Better Themes & Settings UX

## Overview
Currently, keyboard shortcuts are displayed in a dedicated `KeyboardShortcutsModal` but can only be edited within the `SettingsModal`. This splits the user experience for shortcuts across two different UI components. This spec describes moving the editing functionality (capturing and saving keybindings) into the `KeyboardShortcutsModal` and removing it from the `SettingsModal`.

## Architecture

### 1. KeyboardShortcutsModal (`src/renderer/components/KeyboardShortcutsModal.tsx`)
The modal will be upgraded from a read-only display to an interactive editor.

**New Props:**
- `onSaveKeybindings: (kb: Keybindings) => Promise<void>`

**New State:**
- `pendingKb: Keybindings`: Local copy of keybindings for staging edits.
- `capturingAction: KeybindingAction | null`: Tracks which shortcut is currently being remapped.
- `savingKb: boolean`: Tracks the async saving state.

**Logic:**
- Implement `handleGlobalKeyDown` to intercept keys when `capturingAction` is active.
- Modifier keys (Ctrl, Shift, Alt) will be tracked, and the capture completes on the first non-modifier keypress.
- `Escape` during capture will cancel the capture.

**UI Changes:**
- Add a "Set" button next to each shortcut entry.
- Show "Press keys..." when capturing.
- Add a "Save Shortcuts" button that appears at the bottom when changes are pending.

### 2. SettingsModal (`src/renderer/components/SettingsModal.tsx`)
The "Shortcuts" section will be removed entirely to simplify the settings menu.

**Removals:**
- `ACTION_LABELS` (redundant with KeyboardShortcutsModal).
- `pendingKb`, `capturingAction`, `savingKb` states.
- `handleSaveKb` function.
- Capture logic in `useEffect`.
- "Shortcuts" section in JSX.

### 3. App (`src/renderer/App.tsx`)
- Update the rendering of `KeyboardShortcutsModal` to include the `onSaveKeybindings` prop.

## Data Flow
1. User triggers `openShortcuts` (default `Ctrl+Shift+/`).
2. `App.tsx` renders `KeyboardShortcutsModal`.
3. User clicks "Set" next to an action.
4. Modal enters capture mode; global `keydown` listeners are suspended or bypassed.
5. User presses a key combination.
6. Local `pendingKb` is updated.
7. User clicks "Save Shortcuts".
8. `onSaveKeybindings` is called, which triggers `IPC.KEYBINDINGS_WRITE`.
9. Modal indicates saving progress, then updates.

## Success Criteria
- Keyboard shortcuts can no longer be edited in the Settings menu.
- Keyboard shortcuts can be remapped and saved within the Shortcuts modal.
- `Escape` correctly handles both canceling capture and closing the modal.
- Remapped shortcuts work immediately after saving.
- Layout remains clean and usable on various screen sizes.

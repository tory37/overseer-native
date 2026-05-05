# Doer Test Plan: Random Theme Keyboard Shortcut

## Goal
Verify that pressing `Ctrl+Shift+T` applies a randomly selected theme — identical to manually picking one from Settings.

---

## Manual Steps

### 1. Launch the app
- Run `npm run dev`
- App opens. Note the current active theme (visible by colors in the UI).

### 2. Trigger the shortcut
- Press `Ctrl+Shift+T`
- **Checkpoint:** The app theme should change immediately. Colors of the header, sidebar, terminal background, and text should update to a different theme.

### 3. Verify it doesn't stay on the same theme
- Press `Ctrl+Shift+T` several times in a row.
- **Checkpoint:** Each press should apply a *different* theme than the current one (the store retries up to 10 times to find a different theme).

### 4. Verify the theme persists
- Press `Ctrl+Shift+T` to land on a new theme.
- Close and reopen the app (`Ctrl+C`, then `npm run dev` again).
- **Checkpoint:** The randomly chosen theme from step 4 is still active — it was persisted to disk.

### 5. Verify the shortcut appears in the Shortcuts modal
- Press `Ctrl+Shift+/` to open the Keyboard Shortcuts modal.
- Look in the **GENERAL** group.
- **Checkpoint:** "Apply Random Theme" appears with the keybinding `Ctrl+Shift+T`.

### 6. Verify the shortcut is rebindable
- In the Shortcuts modal, click **Set** next to "Apply Random Theme".
- Press a new key combo (e.g. `Ctrl+Shift+Y`).
- Click **Save Shortcuts**.
- **Checkpoint:** Pressing `Ctrl+Shift+Y` now applies a random theme; `Ctrl+Shift+T` no longer does.

### 7. Cross-verify with Settings theme picker
- Open Settings (`Ctrl+Shift+,`) and manually select a specific theme.
- **Checkpoint:** Theme changes identically to when using the shortcut — same visual result, same persistence behavior.

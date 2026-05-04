# Design Spec: Random Theme Keyboard Shortcut

Add a keyboard shortcut to Overseer that applies a random theme from the combined list of built-in and custom themes.

## 1. Objectives
- Provide a quick way for users to cycle through aesthetics.
- Ensure the selection is persisted exactly like manual selection.
- Prevent selecting the same theme twice in a row (if alternatives exist).

## 2. Architecture & Data Flow

### 2.1 Theme Store (`src/renderer/store/theme.ts`)
Add a `setRandomTheme` method to the `ThemeState`.

**Logic:**
1. Concatenate `BUILTIN_THEMES` and `customThemes`.
2. If total themes <= 1, do nothing.
3. Pick a random index.
4. If the selected theme ID is the same as `activeThemeId`, repeat step 3 (up to a small limit or just simple loop).
5. Call `setActiveTheme(newId)`.

### 2.2 Keybindings Registry (`src/renderer/types/ipc.ts`)
- Add `randomTheme` to `KeybindingAction`.
- Define default: `Ctrl+Shift+KeyT`.
- Add label: "Apply Random Theme".

### 2.3 Keyboard Shortcut Hook (`src/renderer/hooks/useKeyboardShortcuts.ts`)
- Add `onRandomTheme: () => void` to `ShortcutHandlers`.
- Update the `handleKeyDown` logic to invoke `onRandomTheme` when the `randomTheme` action is matched.

### 2.4 Application Wiring (`src/renderer/App.tsx`)
- Extract `setRandomTheme` from `useThemeStore`.
- Pass it to the `useKeyboardShortcuts` handler object.

## 3. Testing Strategy
- **Unit Test:** Add a test case to `tests/renderer/ThemeStore.test.tsx` (or similar) to verify `setRandomTheme` changes the active theme and chooses from the correct list.
- **Integration Test:** Verify the shortcut triggers the handler in `tests/renderer/useKeyboardShortcuts.test.tsx`.

## 4. Risks & Considerations
- **Collision:** `Ctrl+Shift+T` is commonly used for "Reopen closed tab" in browsers. Since Overseer is an Electron app, we should ensure this doesn't conflict with any intended app-wide menu shortcuts if they exist (though most terminal apps override browser defaults).

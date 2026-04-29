# Spec: Configurable Theming System

**Date:** 2026-04-28
**Status:** Draft
**Goal:** Implement a registry-based theming system using CSS variables and JSON-based persistence to allow users to customize the UI appearance.

## 1. Architectural Overview

The system will transition from hardcoded inline styles to a centralized CSS variable approach. Themes will be stored in a JSON configuration file, allowing for easy expansion and user customization.

### Components
- **Theme Registry:** A collection of theme definitions (ID, name, and color palette).
- **Persistence Layer:** IPC handlers in the main process to read/write theme settings to `~/.overseer/theme-settings.json`.
- **Theme Provider/Injection:** A mechanism in the renderer to inject the active theme's colors as CSS variables into the `:root` element.
- **Settings UI:** A dropdown in `SettingsModal.tsx` to switch between presets.

## 2. Technical Design

### A. Theme Schema
```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    'bg-main': string;
    'bg-header': string;
    'bg-sidebar': string;
    'bg-active-tab': string;
    'bg-inactive-tab': string;
    'text-main': string;
    'text-muted': string;
    'accent': string;
    'border': string;
    'terminal-bg': string;
    'terminal-fg': string;
  };
}

interface ThemeSettings {
  activeThemeId: string;
  customThemes: Theme[];
}
```

### B. Initial Presets
1. **Overseer Dark:** Current default UI.
2. **Overseer Light:** High-contrast light grey/white theme.
3. **Monokai:** Vivid colors on a dark grey background.
4. **Solarized Dark:** Deep teal and blue-green palette.
5. **Nord:** Arctic frosty blue palette.

### C. IPC Channels
- `THEME_READ`: Reads `theme-settings.json` from disk.
- `THEME_WRITE`: Saves the active theme ID and any custom themes.

### D. Implementation Strategy
1. **Define Variables:** Map all hardcoded colors in `App.tsx`, `SettingsModal.tsx`, `SessionDrawer.tsx`, etc., to their respective CSS variables (e.g., `background: var(--bg-main)`).
2. **Injection:** Use a `useEffect` in the root component to apply colors:
   ```typescript
   Object.entries(activeTheme.colors).forEach(([key, value]) => {
     document.documentElement.style.setProperty(`--${key}`, value);
   });
   ```
3. **Store Integration:** Add `activeThemeId` and `themes` to the `zustand` store (`src/renderer/store/sessions.ts` or a new `themeStore.ts`).

## 3. Extension Plan (JSON)
By storing `customThemes` in the JSON config, users can add new themes by manually editing the file or (in a future update) using a UI color picker. The app will merge built-in presets with the user's `customThemes`.

## 4. Risks & Considerations
- **Contrast:** Ensure all initial presets have sufficient contrast for readability.
- **Terminal Integration:** Xterm.js colors might need separate handling or synchronization with the `terminal-bg`/`terminal-fg` variables.

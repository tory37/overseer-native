# Configurable Theming System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a registry-based theming system using CSS variables and JSON-based persistence to allow users to customize the UI appearance.

**Architecture:** Transition from hardcoded inline styles to a centralized CSS variable approach. Themes are stored in a JSON configuration file, merged with built-in presets, and injected into the `:root` element.

**Tech Stack:** React, Zustand, Electron IPC, CSS Variables, Xterm.js

---

### Task 1: Define IPC Channels and Types

**Files:**
- Modify: `src/renderer/types/ipc.ts`
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Add THEME_READ and THEME_WRITE to IPC constants**
```typescript
// src/renderer/types/ipc.ts
export const IPC = {
  // ... existing
  THEME_READ: 'theme:read',
  THEME_WRITE: 'theme:write',
} as const;
```

- [ ] **Step 2: Add Theme types to IPC types**
```typescript
// src/renderer/types/ipc.ts
export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export interface ThemeSettings {
  activeThemeId: string;
  customThemes: Theme[];
}
```

- [ ] **Step 3: Implement IPC handlers for reading/writing themes**
```typescript
// src/main/ipc-handlers.ts
ipcMain.handle(IPC.THEME_READ, async () => {
  const path = join(os.homedir(), '.overseer', 'theme-settings.json');
  try {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch {
    return { activeThemeId: 'overseer-dark', customThemes: [] };
  }
});

ipcMain.handle(IPC.THEME_WRITE, async (_, settings: ThemeSettings) => {
  const dir = join(os.homedir(), '.overseer');
  const path = join(dir, 'theme-settings.json');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path, JSON.stringify(settings, null, 2));
});
```

- [ ] **Step 4: Commit**
```bash
git add src/renderer/types/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat(theme): add IPC channels and types for theming"
```

### Task 2: Create Theme Store and Built-in Presets

**Files:**
- Create: `src/renderer/store/theme.ts`

- [ ] **Step 1: Define built-in presets and create Zustand store**
```typescript
// src/renderer/store/theme.ts
import { create } from 'zustand';
import { Theme, ThemeSettings, IPC } from '../types/ipc';

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'overseer-dark',
    name: 'Overseer Dark',
    colors: {
      'bg-main': '#1e1e1e',
      'bg-header': '#2d2d2d',
      'bg-sidebar': '#252526',
      'bg-active-tab': '#094771',
      'bg-inactive-tab': '#3a3a3a',
      'text-main': '#cccccc',
      'text-muted': '#888888',
      'accent': '#0e639c',
      'border': '#444444',
      'terminal-bg': '#1e1e1e',
      'terminal-fg': '#cccccc'
    }
  },
  {
    id: 'overseer-light',
    name: 'Overseer Light',
    colors: {
      'bg-main': '#ffffff',
      'bg-header': '#f3f3f3',
      'bg-sidebar': '#f3f3f3',
      'bg-active-tab': '#007acc',
      'bg-inactive-tab': '#e1e1e1',
      'text-main': '#333333',
      'text-muted': '#666666',
      'accent': '#007acc',
      'border': '#cccccc',
      'terminal-bg': '#ffffff',
      'terminal-fg': '#333333'
    }
  },
  // Add Monokai, Solarized Dark, Nord here...
];

interface ThemeState {
  activeThemeId: string;
  customThemes: Theme[];
  setActiveTheme: (id: string) => void;
  loadSettings: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: 'overseer-dark',
  customThemes: [],
  setActiveTheme: (id) => {
    set({ activeThemeId: id });
    const { activeThemeId, customThemes } = get();
    (window as any).electron.invoke(IPC.THEME_WRITE, { activeThemeId: id, customThemes });
  },
  loadSettings: async () => {
    const settings = await (window as any).electron.invoke(IPC.THEME_READ);
    set({ activeThemeId: settings.activeThemeId, customThemes: settings.customThemes });
  }
}));
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/store/theme.ts
git commit -m "feat(theme): create theme store and built-in presets"
```

### Task 3: Root Injection of CSS Variables

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Inject theme variables in App component**
```typescript
// src/renderer/App.tsx
import { useThemeStore, BUILTIN_THEMES } from './store/theme';

// Inside App component:
const { activeThemeId, customThemes, loadSettings } = useThemeStore();
const activeTheme = [...BUILTIN_THEMES, ...customThemes].find(t => t.id === activeThemeId) || BUILTIN_THEMES[0];

useEffect(() => {
  loadSettings();
}, []);

useEffect(() => {
  Object.entries(activeTheme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}, [activeTheme]);
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/App.tsx
git commit -m "feat(theme): inject CSS variables into root element"
```

### Task 4: Replace Hardcoded Styles with CSS Variables

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/SessionDrawer.tsx`
- Modify: `src/renderer/components/TabBar.tsx`
- Modify: `src/renderer/components/SettingsModal.tsx`
- Modify: `src/renderer/components/TerminalPane.tsx`
- Modify: `src/renderer/components/TerminalInstance.tsx`

- [ ] **Step 1: Update App.tsx layout styles**
```typescript
// src/renderer/App.tsx
// background: '#1e1e1e' -> background: 'var(--bg-main)'
// background: '#2d2d2d' -> background: 'var(--bg-header)'
```

- [ ] **Step 2: Update SessionDrawer.tsx**
```typescript
// src/renderer/components/SessionDrawer.tsx
// background: '#252526' -> background: 'var(--bg-sidebar)'
// background: isActive ? '#094771' : ... -> background: isActive ? 'var(--bg-active-tab)' : ...
```

- [ ] **Step 3: Update TabBar.tsx**
```typescript
// src/renderer/components/TabBar.tsx
// background: '#2d2d2d' -> background: 'var(--bg-header)'
```

- [ ] **Step 4: Update SettingsModal.tsx**
```typescript
// src/renderer/components/SettingsModal.tsx
// background: '#2d2d2d' -> background: 'var(--bg-header)'
```

- [ ] **Step 5: Update Terminal components**
```typescript
// src/renderer/components/TerminalInstance.tsx
// theme: { background: '#1e1e1e' } -> theme: { background: activeTheme.colors['terminal-bg'], foreground: activeTheme.colors['terminal-fg'] }
```

- [ ] **Step 6: Commit**
```bash
git add src/renderer/App.tsx src/renderer/components/*.tsx
git commit -m "style(theme): replace hardcoded colors with CSS variables"
```

### Task 5: Add Theme Selector to Settings UI

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`

- [ ] **Step 1: Add Theme section with dropdown**
```typescript
// src/renderer/components/SettingsModal.tsx
// ... imports
const { activeThemeId, setActiveTheme } = useThemeStore();
const allThemes = [...BUILTIN_THEMES, ...customThemes];

// In JSX:
<div style={{ marginBottom: 24 }}>
  <h3 style={sectionHeader}>Appearance</h3>
  <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Theme</label>
  <select 
    value={activeThemeId} 
    onChange={(e) => setActiveTheme(e.target.value)}
    style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '6px', borderRadius: 4, width: '100%' }}
  >
    {allThemes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
  </select>
</div>
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/components/SettingsModal.tsx
git commit -m "feat(theme): add theme selector to settings modal"
```

### Task 6: Add Remaining Presets (Monokai, Solarized Dark, Nord)

**Files:**
- Modify: `src/renderer/store/theme.ts`

- [ ] **Step 1: Add colors for Monokai, Solarized Dark, and Nord**

- [ ] **Step 2: Commit**
```bash
git add src/renderer/store/theme.ts
git commit -m "feat(theme): add Monokai, Solarized Dark, and Nord presets"
```

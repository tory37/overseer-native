# Theme Expansion and UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the theme library, add 19 new themed biological/mythological themes, and enhance the UI with arrow buttons and keyboard cycling.

**Architecture:** Modular theme files imported into a central store. UI logic in `SettingsModal.tsx` handles cycling and keyboard events.

**Tech Stack:** React, TypeScript, Zustand, Vanilla CSS.

---

### Task 1: Theme Store Cleanup

**Files:**
- Modify: `src/renderer/store/theme.ts`

- [ ] **Step 1: Remove standard themes from `BUILTIN_THEMES`**

```typescript
// Replace standard themes with just Overseer themes
export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'overseer-dark',
    name: 'Overseer Dark',
    colors: {
      'bg-main': '#1e1e1e',
      'bg-header': '#2d2d2d',
      'bg-sidebar': '#252526',
      'bg-active-tab': '#094771',
      'bg-inactive-tab': '#2d2d2d',
      'bg-terminal': '#1e1e1e',
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
      'bg-terminal': '#ffffff',
      'text-main': '#333333',
      'text-muted': '#666666',
      'accent': '#007acc',
      'border': '#cccccc',
      'terminal-bg': '#ffffff',
      'terminal-fg': '#333333'
    }
  },
  ...ANIMAL_THEMES
]
```

- [ ] **Step 2: Verify build passes**
Run: `npm run build` or check if `tsc` is happy.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/store/theme.ts
git commit -m "theme: remove standard non-biological themes"
```

### Task 2: Alien Themes Implementation

**Files:**
- Create: `src/renderer/themes/xenomorph.ts`, `src/renderer/themes/predator.ts`, `src/renderer/themes/sectoid.ts`, `src/renderer/themes/reaper.ts`, `src/renderer/themes/elite.ts`, `src/renderer/themes/ridley.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Alien theme files**
(Example Xenomorph content, apply similar structure to others)
```typescript
import { Theme } from '../types/ipc'
export const xenomorph: Theme = {
  id: 'xenomorph',
  name: 'Xenomorph',
  colors: {
    'bg-main': '#050505',
    'bg-header': '#0a0a0a',
    'bg-sidebar': '#080808',
    'bg-active-tab': '#1a1a1a',
    'bg-inactive-tab': '#0a0a0a',
    'bg-terminal': '#050505',
    'text-main': '#a0a0a0',
    'text-muted': '#4a4a4a',
    'accent': '#bfff00',
    'border': '#151515',
    'terminal-bg': '#050505',
    'terminal-fg': '#bfff00'
  }
}
```

- [ ] **Step 2: Add to `ANIMAL_THEMES` in `src/renderer/themes/index.ts`**
Import and add to the array.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/themes/
git commit -m "theme: add alien category"
```

### Task 3: Warhammer & Classic Monster Themes

**Files:**
- Create: `src/renderer/themes/tyranid.ts`, `src/renderer/themes/necron.ts`, `src/renderer/themes/bloodletter.ts`, `src/renderer/themes/horror.ts`, `src/renderer/themes/vampire.ts`, `src/renderer/themes/werewolf.ts`, `src/renderer/themes/ghost.ts`, `src/renderer/themes/frankenstein.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Warhammer and Classic Monster files**
(Follow the pattern in Task 2)

- [ ] **Step 2: Update `src/renderer/themes/index.ts`**
Import and export.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/themes/
git commit -m "theme: add warhammer and classic monster categories"
```

### Task 4: Fantasy & Mythology Themes

**Files:**
- Create: `src/renderer/themes/dragon.ts`, `src/renderer/themes/phoenix.ts`, `src/renderer/themes/valkyrie.ts`, `src/renderer/themes/cerberus.ts`, `src/renderer/themes/pegasus.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Fantasy/Mythology files**
(Follow the pattern in Task 2)

- [ ] **Step 2: Update `src/renderer/themes/index.ts`**
Import and export.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/themes/
git commit -m "theme: add fantasy and mythology categories"
```

### Task 5: UI Enhancement in SettingsModal

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`

- [ ] **Step 1: Implement Arrow Cycling Logic**
Add `handlePrevTheme` and `handleNextTheme` functions inside the component.

```typescript
const handlePrevTheme = () => {
  const currentIndex = allThemes.findIndex(t => t.id === activeThemeId)
  const prevIndex = (currentIndex - 1 + allThemes.length) % allThemes.length
  setActiveTheme(allThemes[prevIndex].id)
}

const handleNextTheme = () => {
  const currentIndex = allThemes.findIndex(t => t.id === activeThemeId)
  const nextIndex = (currentIndex + 1) % allThemes.length
  setActiveTheme(allThemes[nextIndex].id)
}
```

- [ ] **Step 2: Update JSX with buttons**
Flank the `<select>` with `<button>` elements.

- [ ] **Step 3: Add Keyboard Listeners**
Inside the `useEffect` for global keydown:
```typescript
if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevTheme(); return }
if (e.key === 'ArrowRight') { e.preventDefault(); handleNextTheme(); return }
```

- [ ] **Step 4: Verify UI functionality**
Manual check: Arrow buttons cycle, keys cycle.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/components/SettingsModal.tsx
git commit -m "ui: add theme cycling buttons and keyboard navigation"
```

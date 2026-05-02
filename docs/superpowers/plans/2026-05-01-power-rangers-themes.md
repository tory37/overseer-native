# Power Rangers Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 11 new Power Ranger themed color palettes to Overseer.

**Architecture:** Create individual theme files in `src/renderer/themes/`, aggregate them in `index.ts`, and register them in the `ThemeStore`.

**Tech Stack:** TypeScript, React, Zustand.

---

### Task 1: Create Basic Ranger Themes (Red, Blue, Green, Yellow, Black)

**Files:**
- Create: `src/renderer/themes/red-ranger.ts`
- Create: `src/renderer/themes/blue-ranger.ts`
- Create: `src/renderer/themes/green-ranger.ts`
- Create: `src/renderer/themes/yellow-ranger.ts`
- Create: `src/renderer/themes/black-ranger.ts`

- [ ] **Step 1: Create Red Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const redRanger: Theme = {
  id: 'red-ranger',
  name: 'Red Ranger',
  colors: {
    'bg-main': '#1a0505',
    'bg-header': '#250a0a',
    'bg-sidebar': '#200808',
    'bg-active-tab': '#ff0000',
    'bg-inactive-tab': '#250a0a',
    'bg-terminal': '#1a0505',
    'text-main': '#eeeeee',
    'text-muted': '#a08080',
    'accent': '#ff0000',
    'border': '#3a1515',
    'terminal-bg': '#1a0505',
    'terminal-fg': '#ff4444'
  }
}
```

- [ ] **Step 2: Create Blue Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const blueRanger: Theme = {
  id: 'blue-ranger',
  name: 'Blue Ranger',
  colors: {
    'bg-main': '#05051a',
    'bg-header': '#0a0a25',
    'bg-sidebar': '#080820',
    'bg-active-tab': '#00aaff',
    'bg-inactive-tab': '#0a0a25',
    'bg-terminal': '#05051a',
    'text-main': '#eeeeee',
    'text-muted': '#8080a0',
    'accent': '#00aaff',
    'border': '#15153a',
    'terminal-bg': '#05051a',
    'terminal-fg': '#00aaff'
  }
}
```

- [ ] **Step 3: Create Green Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const greenRanger: Theme = {
  id: 'green-ranger',
  name: 'Green Ranger',
  colors: {
    'bg-main': '#051a05',
    'bg-header': '#0a250a',
    'bg-sidebar': '#082008',
    'bg-active-tab': '#00ff00',
    'bg-inactive-tab': '#0a250a',
    'bg-terminal': '#051a05',
    'text-main': '#eeeeee',
    'text-muted': '#80a080',
    'accent': '#00ff00',
    'border': '#153a15',
    'terminal-bg': '#051a05',
    'terminal-fg': '#00ff00'
  }
}
```

- [ ] **Step 4: Create Yellow Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const yellowRanger: Theme = {
  id: 'yellow-ranger',
  name: 'Yellow Ranger',
  colors: {
    'bg-main': '#1a1a05',
    'bg-header': '#25250a',
    'bg-sidebar': '#202008',
    'bg-active-tab': '#ffcc00',
    'bg-inactive-tab': '#25250a',
    'bg-terminal': '#1a1a05',
    'text-main': '#eeeeee',
    'text-muted': '#a0a080',
    'accent': '#ffcc00',
    'border': '#3a3a15',
    'terminal-bg': '#1a1a05',
    'terminal-fg': '#ffcc00'
  }
}
```

- [ ] **Step 5: Create Black Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const blackRanger: Theme = {
  id: 'black-ranger',
  name: 'Black Ranger',
  colors: {
    'bg-main': '#0a0a0a',
    'bg-header': '#151515',
    'bg-sidebar': '#101010',
    'bg-active-tab': '#ffffff',
    'bg-inactive-tab': '#151515',
    'bg-terminal': '#0a0a0a',
    'text-main': '#cccccc',
    'text-muted': '#888888',
    'accent': '#ffffff',
    'border': '#333333',
    'terminal-bg': '#0a0a0a',
    'terminal-fg': '#ffffff'
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/renderer/themes/red-ranger.ts src/renderer/themes/blue-ranger.ts src/renderer/themes/green-ranger.ts src/renderer/themes/yellow-ranger.ts src/renderer/themes/black-ranger.ts
git commit -m "feat(themes): add basic ranger themes"
```

---

### Task 2: Create Advanced Ranger Themes (Pink, White, Purple, Silver, Gold)

**Files:**
- Create: `src/renderer/themes/pink-ranger.ts`
- Create: `src/renderer/themes/white-ranger.ts`
- Create: `src/renderer/themes/purple-ranger.ts`
- Create: `src/renderer/themes/silver-ranger.ts`
- Create: `src/renderer/themes/gold-ranger.ts`

- [ ] **Step 1: Create Pink Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const pinkRanger: Theme = {
  id: 'pink-ranger',
  name: 'Pink Ranger',
  colors: {
    'bg-main': '#1a0515',
    'bg-header': '#250a20',
    'bg-sidebar': '#20081a',
    'bg-active-tab': '#ff69b4',
    'bg-inactive-tab': '#250a20',
    'bg-terminal': '#1a0515',
    'text-main': '#eeeeee',
    'text-muted': '#a08098',
    'accent': '#ff69b4',
    'border': '#3a1530',
    'terminal-bg': '#1a0515',
    'terminal-fg': '#ff69b4'
  }
}
```

- [ ] **Step 2: Create White Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const whiteRanger: Theme = {
  id: 'white-ranger',
  name: 'White Ranger',
  colors: {
    'bg-main': '#f5f5f5',
    'bg-header': '#e0e0e0',
    'bg-sidebar': '#ebebeb',
    'bg-active-tab': '#ffd700',
    'bg-inactive-tab': '#dcdcdc',
    'bg-terminal': '#f5f5f5',
    'text-main': '#333333',
    'text-muted': '#666666',
    'accent': '#ffd700',
    'border': '#cccccc',
    'terminal-bg': '#f5f5f5',
    'terminal-fg': '#b8860b'
  }
}
```

- [ ] **Step 3: Create Purple Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const purpleRanger: Theme = {
  id: 'purple-ranger',
  name: 'Purple Ranger',
  colors: {
    'bg-main': '#10051a',
    'bg-header': '#1a0a25',
    'bg-sidebar': '#150820',
    'bg-active-tab': '#bf00ff',
    'bg-inactive-tab': '#1a0a25',
    'bg-terminal': '#10051a',
    'text-main': '#eeeeee',
    'text-muted': '#9080a0',
    'accent': '#bf00ff',
    'border': '#30153a',
    'terminal-bg': '#10051a',
    'terminal-fg': '#bf00ff'
  }
}
```

- [ ] **Step 4: Create Silver Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const silverRanger: Theme = {
  id: 'silver-ranger',
  name: 'Silver Ranger',
  colors: {
    'bg-main': '#1a1c1e',
    'bg-header': '#25272a',
    'bg-sidebar': '#202225',
    'bg-active-tab': '#c0c0c0',
    'bg-inactive-tab': '#25272a',
    'bg-terminal': '#1a1c1e',
    'text-main': '#eeeeee',
    'text-muted': '#90959a',
    'accent': '#c0c0c0',
    'border': '#353a40',
    'terminal-bg': '#1a1c1e',
    'terminal-fg': '#c0c0c0'
  }
}
```

- [ ] **Step 5: Create Gold Ranger theme**

```typescript
import { Theme } from '../types/ipc'

export const goldRanger: Theme = {
  id: 'gold-ranger',
  name: 'Gold Ranger',
  colors: {
    'bg-main': '#1a1505',
    'bg-header': '#25200a',
    'bg-sidebar': '#201a08',
    'bg-active-tab': '#ffd700',
    'bg-inactive-tab': '#25200a',
    'bg-terminal': '#1a1505',
    'text-main': '#eeeeee',
    'text-muted': '#a09080',
    'accent': '#ffd700',
    'border': '#3a3015',
    'terminal-bg': '#1a1505',
    'terminal-fg': '#ffd700'
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/renderer/themes/pink-ranger.ts src/renderer/themes/white-ranger.ts src/renderer/themes/purple-ranger.ts src/renderer/themes/silver-ranger.ts src/renderer/themes/gold-ranger.ts
git commit -m "feat(themes): add advanced ranger themes"
```

---

### Task 3: Aggregate and Export Ranger Themes

**Files:**
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Import and export all Ranger themes**

```typescript
// Add imports for all ranger themes
import { redRanger } from './red-ranger'
import { blueRanger } from './blue-ranger'
import { greenRanger } from './green-ranger'
import { yellowRanger } from './yellow-ranger'
import { blackRanger } from './black-ranger'
import { pinkRanger } from './pink-ranger'
import { whiteRanger } from './white-ranger'
import { purpleRanger } from './purple-ranger'
import { silverRanger } from './silver-ranger'
import { goldRanger } from './gold-ranger'

// Define RANGER_THEMES array
export const RANGER_THEMES: Theme[] = [
  redRanger, blueRanger, greenRanger, yellowRanger, blackRanger,
  pinkRanger, whiteRanger, purpleRanger, silverRanger, goldRanger
]

// Update ANIMAL_THEMES to include RANGER_THEMES if desired, 
// or keep them separate if store handles multiple arrays.
// For simplicity in this project, we'll merge them into ANIMAL_THEMES exports or add them to the store.
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/themes/index.ts
git commit -m "feat(themes): aggregate ranger themes"
```

---

### Task 4: Register Themes in Store and Verify

**Files:**
- Modify: `src/renderer/store/theme.ts`
- Modify: `tests/renderer/ThemeStore.test.tsx`

- [ ] **Step 1: Add RANGER_THEMES to BUILTIN_THEMES**

```typescript
import { ANIMAL_THEMES, RANGER_THEMES } from '../themes'

export const BUILTIN_THEMES: Theme[] = [
  // ... overseer themes
  ...ANIMAL_THEMES,
  ...RANGER_THEMES
]
```

- [ ] **Step 2: Update tests to verify Ranger themes**

```typescript
it('should include Ranger themes', () => {
  const { BUILTIN_THEMES } = require('../src/renderer/store/theme')
  const rangerIds = ['red-ranger', 'blue-ranger', 'green-ranger', 'yellow-ranger', 'black-ranger']
  rangerIds.forEach(id => {
    expect(BUILTIN_THEMES.find((t: any) => t.id === id)).toBeDefined()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npm test tests/renderer/ThemeStore.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/renderer/store/theme.ts tests/renderer/ThemeStore.test.tsx
git commit -m "feat(themes): register ranger themes and update tests"
```

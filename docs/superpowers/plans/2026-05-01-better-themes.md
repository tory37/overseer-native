# Better Themes (Animal & Cryptid Collection) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 25 new modular, animal and cryptid-themed themes for Overseer.

**Architecture:** Each theme lives in its own `.ts` file within `src/renderer/themes/`. An `index.ts` aggregates these themes, which are then imported into the main `ThemeStore`. This ensures modularity and keeps the store lean.

**Tech Stack:** TypeScript, React, Zustand (existing store).

---

### Task 1: Create Theme Directory and Core Aggregator

**Files:**
- Create: `src/renderer/themes/index.ts`
- Modify: `src/renderer/store/theme.ts`

- [ ] **Step 1: Create the themes directory**
Run: `mkdir -p src/renderer/themes`

- [ ] **Step 2: Create the initial aggregator file**
```typescript
import { Theme } from '../types/ipc'

export const ANIMAL_THEMES: Theme[] = []
```
Write to: `src/renderer/themes/index.ts`

- [ ] **Step 3: Update ThemeStore to import animal themes**
Modify `src/renderer/store/theme.ts` to include `ANIMAL_THEMES` in `BUILTIN_THEMES`.

```typescript
import { create } from 'zustand'
import { Theme, IPC } from '../types/ipc'
import { ANIMAL_THEMES } from '../themes'

export const BUILTIN_THEMES: Theme[] = [
  // ... existing themes ...
  ...ANIMAL_THEMES
]
```

- [ ] **Step 4: Commit**
Run: `git add src/renderer/themes/index.ts src/renderer/store/theme.ts && git commit -m "refactor: set up theme directory and aggregator"`

### Task 2: Implement Dark Animal Themes (1-7)

**Files:**
- Create: `src/renderer/themes/raven.ts`
- Create: `src/renderer/themes/bat.ts`
- Create: `src/renderer/themes/panther.ts`
- Create: `src/renderer/themes/owl.ts`
- Create: `src/renderer/themes/viper.ts`
- Create: `src/renderer/themes/squid.ts`
- Create: `src/renderer/themes/beetle.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Raven theme**
```typescript
import { Theme } from '../types/ipc'
export const raven: Theme = {
  id: 'raven',
  name: 'Raven',
  colors: {
    'bg-main': '#0c0c0d', 'bg-header': '#1a1a1c', 'bg-sidebar': '#121214', 'bg-active-tab': '#2d2d35', 'bg-inactive-tab': '#1a1a1c', 'bg-terminal': '#0c0c0d', 'text-main': '#d1d1d6', 'text-muted': '#6e6e73', 'accent': '#5856d6', 'border': '#2c2c2e', 'terminal-bg': '#0c0c0d', 'terminal-fg': '#d1d1d6'
  }
}
```

- [ ] **Step 2: Create Bat theme**
```typescript
import { Theme } from '../types/ipc'
export const bat: Theme = {
  id: 'bat',
  name: 'Bat',
  colors: {
    'bg-main': '#121212', 'bg-header': '#1f1f1f', 'bg-sidebar': '#181818', 'bg-active-tab': '#3a3a3a', 'bg-inactive-tab': '#1f1f1f', 'bg-terminal': '#121212', 'text-main': '#e0e0e0', 'text-muted': '#7a7a7a', 'accent': '#8b4513', 'border': '#333333', 'terminal-bg': '#121212', 'terminal-fg': '#e0e0e0'
  }
}
```

- [ ] **Step 3: Create Panther theme**
```typescript
import { Theme } from '../types/ipc'
export const panther: Theme = {
  id: 'panther',
  name: 'Panther',
  colors: {
    'bg-main': '#0a0e14', 'bg-header': '#141b24', 'bg-sidebar': '#0f151c', 'bg-active-tab': '#1b2631', 'bg-inactive-tab': '#141b24', 'bg-terminal': '#0a0e14', 'text-main': '#b2c1d1', 'text-muted': '#5c6b7a', 'accent': '#c0ff00', 'border': '#24303d', 'terminal-bg': '#0a0e14', 'terminal-fg': '#b2c1d1'
  }
}
```

- [ ] **Step 4: Create Owl theme**
```typescript
import { Theme } from '../types/ipc'
export const owl: Theme = {
  id: 'owl',
  name: 'Owl',
  colors: {
    'bg-main': '#1b1b13', 'bg-header': '#2a2a1e', 'bg-sidebar': '#222218', 'bg-active-tab': '#3d3d2c', 'bg-inactive-tab': '#2a2a1e', 'bg-terminal': '#1b1b13', 'text-main': '#d4d4c9', 'text-muted': '#707060', 'accent': '#6b8e23', 'border': '#3a3a2a', 'terminal-bg': '#1b1b13', 'terminal-fg': '#d4d4c9'
  }
}
```

- [ ] **Step 5: Create Viper theme**
```typescript
import { Theme } from '../types/ipc'
export const viper: Theme = {
  id: 'viper',
  name: 'Viper',
  colors: {
    'bg-main': '#081208', 'bg-header': '#102410', 'bg-sidebar': '#0c1a0c', 'bg-active-tab': '#1a3a1a', 'bg-inactive-tab': '#102410', 'bg-terminal': '#081208', 'text-main': '#a0d0a0', 'text-muted': '#508050', 'accent': '#00ff41', 'border': '#153015', 'terminal-bg': '#081208', 'terminal-fg': '#a0d0a0'
  }
}
```

- [ ] **Step 6: Create Squid theme**
```typescript
import { Theme } from '../types/ipc'
export const squid: Theme = {
  id: 'squid',
  name: 'Squid',
  colors: {
    'bg-main': '#050a1a', 'bg-header': '#0a1430', 'bg-sidebar': '#070f25', 'bg-active-tab': '#102550', 'bg-inactive-tab': '#0a1430', 'bg-terminal': '#050a1a', 'text-main': '#80c0ff', 'text-muted': '#406080', 'accent': '#00f0ff', 'border': '#0e204a', 'terminal-bg': '#050a1a', 'terminal-fg': '#80c0ff'
  }
}
```

- [ ] **Step 7: Create Beetle theme**
```typescript
import { Theme } from '../types/ipc'
export const beetle: Theme = {
  id: 'beetle',
  name: 'Beetle',
  colors: {
    'bg-main': '#0f0a14', 'bg-header': '#1e1428', 'bg-sidebar': '#160f1e', 'bg-active-tab': '#2e1e3e', 'bg-inactive-tab': '#1e1428', 'bg-terminal': '#0f0a14', 'text-main': '#c0a0e0', 'text-muted': '#605070', 'accent': '#39ff14', 'border': '#2a1c38', 'terminal-bg': '#0f0a14', 'terminal-fg': '#c0a0e0'
  }
}
```

- [ ] **Step 8: Update aggregator**
```typescript
import { Theme } from '../types/ipc'
import { raven } from './raven'
import { bat } from './bat'
import { panther } from './panther'
import { owl } from './owl'
import { viper } from './viper'
import { squid } from './squid'
import { beetle } from './beetle'

export const ANIMAL_THEMES: Theme[] = [
  raven, bat, panther, owl, viper, squid, beetle
]
```

- [ ] **Step 9: Commit**
Run: `git add src/renderer/themes/ && git commit -m "feat: add first batch of dark animal themes"`

### Task 3: Implement Remaining Dark Animal Themes (8-13)

**Files:**
- Create: `src/renderer/themes/wolf.ts`
- Create: `src/renderer/themes/scorpion.ts`
- Create: `src/renderer/themes/crow.ts`
- Create: `src/renderer/themes/moth.ts`
- Create: `src/renderer/themes/orca.ts`
- Create: `src/renderer/themes/spider.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Wolf theme**
- [ ] **Step 2: Create Scorpion theme**
- [ ] **Step 3: Create Crow theme**
- [ ] **Step 4: Create Moth theme**
- [ ] **Step 5: Create Orca theme**
- [ ] **Step 6: Create Spider theme**
- [ ] **Step 7: Update aggregator**
- [ ] **Step 8: Commit**

*(Repeat pattern for wolf, scorpion, crow, moth, orca, spider with hex codes from spec)*

### Task 4: Implement Light Animal Themes (14-20)

**Files:**
- Create: `src/renderer/themes/swan.ts`
- Create: `src/renderer/themes/fox.ts`
- Create: `src/renderer/themes/tiger.ts`
- Create: `src/renderer/themes/dolphin.ts`
- Create: `src/renderer/themes/bee.ts`
- Create: `src/renderer/themes/flamingo.ts`
- Create: `src/renderer/themes/rabbit.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Swan theme**
- [ ] **Step 2: Create Fox theme**
- [ ] **Step 3: Create Tiger theme**
- [ ] **Step 4: Create Dolphin theme**
- [ ] **Step 5: Create Bee theme**
- [ ] **Step 6: Create Flamingo theme**
- [ ] **Step 7: Create Rabbit theme**
- [ ] **Step 8: Update aggregator**
- [ ] **Step 9: Commit**

### Task 5: Implement Cryptid Themes (21-25)

**Files:**
- Create: `src/renderer/themes/chupacabra.ts`
- Create: `src/renderer/themes/bigfoot.ts`
- Create: `src/renderer/themes/mothman.ts`
- Create: `src/renderer/themes/kraken.ts`
- Create: `src/renderer/themes/wendigo.ts`
- Modify: `src/renderer/themes/index.ts`

- [ ] **Step 1: Create Chupacabra theme**
- [ ] **Step 2: Create Bigfoot theme**
- [ ] **Step 3: Create Mothman theme**
- [ ] **Step 4: Create Kraken theme**
- [ ] **Step 5: Create Wendigo theme**
- [ ] **Step 6: Update aggregator**
- [ ] **Step 7: Commit**

### Task 6: Final Verification

- [ ] **Step 1: Run build/lint to ensure no typos**
Run: `npm run lint` (or relevant project lint command)

- [ ] **Step 2: Manual verification**
Open Overseer, go to Settings -> Theme, and verify that all 25 new themes are in the list and apply correctly.

# Hacker Themes Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 high-contrast "hacker-style" themes to the Overseer terminal.

**Architecture:** Update the `BUILTIN_THEMES` array in the theme store to include the new theme definitions.

**Tech Stack:** TypeScript, React, Zustand

---

### Task 1: Add Hacker Themes to Store

**Files:**
- Modify: `src/renderer/store/theme.ts`

- [ ] **Step 1: Add new theme definitions to `BUILTIN_THEMES`**

```typescript
// Add these to the BUILTIN_THEMES array in src/renderer/store/theme.ts
  {
    id: 'code-red',
    name: 'Code Red',
    colors: {
      'bg-main': '#0a0a0a',
      'bg-header': '#151515',
      'bg-sidebar': '#121212',
      'bg-active-tab': '#4a0000',
      'bg-inactive-tab': '#1a1a1a',
      'bg-terminal': '#0a0a0a',
      'text-main': '#ffffff',
      'text-muted': '#880000',
      'accent': '#ff0000',
      'border': '#330000',
      'terminal-bg': '#0a0a0a',
      'terminal-fg': '#ff0000'
    }
  },
  {
    id: 'amber-alert',
    name: 'Amber Alert',
    colors: {
      'bg-main': '#0d0d0d',
      'bg-header': '#1a1a1a',
      'bg-sidebar': '#141414',
      'bg-active-tab': '#b37700',
      'bg-inactive-tab': '#1a1a1a',
      'bg-terminal': '#0d0d0d',
      'text-main': '#ffb000',
      'text-muted': '#805800',
      'accent': '#ffb000',
      'border': '#332200',
      'terminal-bg': '#0d0d0d',
      'terminal-fg': '#ffb000'
    }
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      'bg-main': '#000500',
      'bg-header': '#000a00',
      'bg-sidebar': '#000700',
      'bg-active-tab': '#00330d',
      'bg-inactive-tab': '#000a00',
      'bg-terminal': '#000500',
      'text-main': '#00ff41',
      'text-muted': '#008020',
      'accent': '#00ff41',
      'border': '#002209',
      'terminal-bg': '#000500',
      'terminal-fg': '#00ff41'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      'bg-main': '#0d0221',
      'bg-header': '#1a0442',
      'bg-sidebar': '#130330',
      'bg-active-tab': '#ff00ff',
      'bg-inactive-tab': '#1a0442',
      'bg-terminal': '#0d0221',
      'text-main': '#ffffff',
      'text-muted': '#ff00ff',
      'accent': '#ff00ff',
      'border': '#1a0442',
      'terminal-bg': '#0d0221',
      'terminal-fg': '#ff00ff'
    }
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    colors: {
      'bg-main': '#010a10',
      'bg-header': '#021a2b',
      'bg-sidebar': '#021421',
      'bg-active-tab': '#00f0ff',
      'bg-inactive-tab': '#021a2b',
      'bg-terminal': '#010a10',
      'text-main': '#ffffff',
      'text-muted': '#00f0ff',
      'accent': '#00f0ff',
      'border': '#021a2b',
      'terminal-bg': '#010a10',
      'terminal-fg': '#00f0ff'
    }
  }
```

- [ ] **Step 2: Commit changes**

```bash
git add src/renderer/store/theme.ts
git commit -m "feat: add hacker-style dark themes"
```

---

### Task 2: Verification

**Files:**
- N/A (UI verification)

- [ ] **Step 1: Open Settings > Appearance**
- [ ] **Step 2: Select "Code Red" and verify colors apply**
- [ ] **Step 3: Select "Amber Alert" and verify colors apply**
- [ ] **Step 4: Select "Matrix" and verify colors apply**
- [ ] **Step 5: Select "Cyberpunk" and verify colors apply**
- [ ] **Step 6: Select "Deep Sea" and verify colors apply**
- [ ] **Step 7: Verify terminal text is readable in each theme**

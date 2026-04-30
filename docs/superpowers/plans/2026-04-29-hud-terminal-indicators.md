# HUD Terminal Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the clipped border-based active terminal highlight with a floating HUD-style badge in the top-right corner of each terminal pane.

**Architecture:** Remove existing `outline` styles from terminal containers in `TerminalPane.tsx`. Introduce a `HUDBadge` component (or inline JSX) that renders a floating label with dynamic styling based on the focus state.

**Tech Stack:** React, TypeScript, CSS-in-JS (inline styles).

---

### Task 1: Clean up existing outline styles

**Files:**
- Modify: `src/renderer/components/TerminalPane.tsx`

- [ ] **Step 1: Remove outline logic from Main panel**

```tsx
// src/renderer/components/TerminalPane.tsx

// Remove:
// outline: splitFocused === 'main' ? '2px solid var(--accent)' : 'none',
// outlineOffset: '-2px',
// zIndex: splitFocused === 'main' ? 10 : 1
```

- [ ] **Step 2: Remove outline logic from CompanionA pane**

```tsx
// src/renderer/components/TerminalPane.tsx

// Remove:
// outline: splitFocused === 'companionA' ? '2px solid var(--accent)' : 'none',
// outlineOffset: '-2px',
// zIndex: splitFocused === 'companionA' ? 10 : 1
```

- [ ] **Step 3: Remove outline logic from CompanionB pane**

```tsx
// src/renderer/components/TerminalPane.tsx

// Remove:
// outline: splitFocused === 'companionB' ? '2px solid var(--accent)' : 'none',
// outlineOffset: '-2px',
// zIndex: splitFocused === 'companionB' ? 10 : 1
```

- [ ] **Step 4: Commit cleanup**

```bash
git add src/renderer/components/TerminalPane.tsx
git commit -m "style: remove terminal pane outline highlights"
```

---

### Task 2: Implement HUD Badge

**Files:**
- Modify: `src/renderer/components/TerminalPane.tsx`

- [ ] **Step 1: Create `HUDBadge` internal component**

Define this at the top of the file (outside the main `TerminalPane` component).

```tsx
function HUDBadge({ label, focused }: { label: string; focused: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      pointerEvents: 'none',
      zIndex: 20,
      backgroundColor: focused ? 'var(--accent)' : 'transparent',
      color: focused ? '#fff' : 'var(--text-muted)',
      border: focused ? '1px solid var(--accent)' : '1px solid var(--text-muted)',
      textTransform: 'uppercase',
      transition: 'all 0.15s ease-in-out',
      letterSpacing: '0.05em'
    }}>
      {label}
    </div>
  )
}
```

- [ ] **Step 2: Inject badge into Main panel**

```tsx
{/* Main panel */}
<div 
  onClick={() => onFocusPane('main')} 
  style={{ 
    flex: mainFlex, 
    position: 'relative', 
    overflow: 'hidden', 
    order: splitSwapped ? 2 : 0,
  }}
>
  {sessionStack}
  <HUDBadge label="Main" focused={splitFocused === 'main'} />
</div>
```

- [ ] **Step 3: Inject badge into CompanionA pane**

```tsx
{/* CompanionA pane */}
<div 
  onClick={() => onFocusPane('companionA')} 
  style={{ 
    flex: companionAFlex, 
    position: 'relative', 
    overflow: 'hidden', 
    order: secondarySwapped ? 2 : 0,
  }}
>
  {companionAStack}
  <HUDBadge label="Companion A" focused={splitFocused === 'companionA'} />
</div>
```

- [ ] **Step 4: Inject badge into CompanionB pane**

```tsx
{/* CompanionB pane */}
<div 
  onClick={() => onFocusPane('companionB')} 
  style={{
    flex: companionBFlex,
    position: 'relative',
    overflow: 'hidden',
    order: secondarySwapped ? 0 : 2,
    display: threeWayOpen ? undefined : 'none',
  }}
>
  {companionBStack}
  <HUDBadge label="Companion B" focused={splitFocused === 'companionB'} />
</div>
```

- [ ] **Step 5: Verify and Commit**

Run `npm run lint` or check for type errors.

```bash
git add src/renderer/components/TerminalPane.tsx
git commit -m "feat: add HUD terminal indicators"
```

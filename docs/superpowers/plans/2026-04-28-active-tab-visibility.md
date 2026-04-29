# Active Tab Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active session tab significantly more visible with an elevated, modern design.

**Architecture:** Update the inline styles in `TabBar.tsx` to use theme variables and CSS properties for elevation (shadow, borders).

**Tech Stack:** React, TypeScript, CSS (inline styles)

---

### Task 1: Update TabBar Styling

**Files:**
- Modify: `src/renderer/components/TabBar.tsx`

- [ ] **Step 1: Apply elevated styles to the active tab**

Replace the active tab's style logic to include background color from theme, top accent border, bold font, and box shadow.

```tsx
<<<<
            background: s.id === confirmKillId ? '#8b0000' : (s.id === activeSessionId ? 'var(--bg-main)' : 'var(--bg-inactive-tab)'),
            color: s.id === confirmKillId ? '#fff' : 'var(--text-main)',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
====
            background: s.id === confirmKillId ? '#8b0000' : (s.id === activeSessionId ? 'var(--bg-active-tab)' : 'var(--bg-inactive-tab)'),
            color: s.id === confirmKillId ? '#fff' : 'var(--text-main)',
            border: 'none',
            borderTop: s.id === activeSessionId ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: s.id === activeSessionId ? 'bold' : 'normal',
            boxShadow: s.id === activeSessionId ? '0 -2px 10px rgba(0,0,0,0.2)' : 'none',
            padding: s.id === activeSessionId ? '6px 16px' : '4px 12px',
            cursor: 'pointer',
            zIndex: s.id === activeSessionId ? 1 : 0,
            transition: 'all 0.1s ease',
>>>>
```

- [ ] **Step 2: Verify changes in TabBar.tsx**

Check that the file compiles and the logic correctly applies styles based on `activeSessionId`.

### Task 2: Add Style Tests for TabBar

**Files:**
- Modify: `tests/renderer/TabBar.test.tsx`

- [ ] **Step 1: Add a test case for active tab styling**

Add a test to verify that the active tab has the expected style attributes (background, borderTop, fontWeight).

```tsx
test('active tab has prominent styling', () => {
  render(<TabBar sessions={sessions} activeSessionId="a" onSelect={() => {}} onNew={() => {}} />)
  const activeTab = screen.getByText('claude-main')
  const styles = window.getComputedStyle(activeTab)
  
  // Note: getComputedStyle might return resolved variables if jsdom handles them, 
  // but we can at least check for presence of styles or specific non-variable values if needed.
  // In jsdom, it usually returns the literal values if not resolved.
  expect(activeTab).toHaveStyle('background: var(--bg-active-tab)')
  expect(activeTab).toHaveStyle('border-top: 3px solid var(--accent)')
  expect(activeTab).toHaveStyle('font-weight: bold')
})
```

- [ ] **Step 2: Run tests**

Run: `npm test tests/renderer/TabBar.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/TabBar.tsx tests/renderer/TabBar.test.tsx
git commit -m "feat: improve active tab visibility with elevated styling"
```

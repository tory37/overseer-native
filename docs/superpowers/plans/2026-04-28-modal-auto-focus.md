# Modal Auto-focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-focus the first input field when a modal is opened, starting with the New Session dialog.

**Architecture:** Use the `autoFocus` React prop for the first input in modals. For more complex cases or where `autoFocus` might not work as expected with conditional rendering, use a `useRef` and `useEffect` hook.

**Tech Stack:** React (TypeScript)

---

### Task 1: Auto-focus first input in NewSessionDialog

**Files:**
- Modify: `src/renderer/components/NewSessionDialog.tsx`
- Test: `tests/renderer/NewSessionDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/renderer/NewSessionDialog.test.tsx
// Add a test to check if the session name input is focused on mount
import React from 'react'
import { render, screen } from '@testing-library/react'
import { NewSessionDialog } from '../../src/renderer/components/NewSessionDialog'

test('auto focuses the session name input on mount', () => {
  render(<NewSessionDialog onCreate={() => {}} onCancel={() => {}} />)
  const input = screen.getByLabelText('Name')
  expect(input).toHaveFocus()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/renderer/NewSessionDialog.test.tsx`
Expected: FAIL with "Expected element to have focus"

- [ ] **Step 3: Add autoFocus to NewSessionDialog input**

```tsx
// src/renderer/components/NewSessionDialog.tsx
// Add autoFocus to the Name input
<input
  id="session-name"
  aria-label="Name"
  style={inputStyle}
  value={name}
  onChange={e => setName(e.target.value)}
  required
  autoFocus // [!code ++]
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/renderer/NewSessionDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/NewSessionDialog.tsx tests/renderer/NewSessionDialog.test.tsx
git commit -m "feat: auto focus first input in NewSessionDialog"
```

### Task 2: Audit and add focus to other modals (if applicable)

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Add focus to SettingsModal close button (for accessibility)**

Since `SettingsModal` doesn't have text inputs by default, focusing the close button or the first interactive element is good practice.

```tsx
// src/renderer/components/SettingsModal.tsx
<button
  title="Close settings"
  onClick={onClose}
  autoFocus // [!code ++]
  style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
>
  ✕
</button>
```

- [ ] **Step 2: Add focus to KeyboardShortcutsModal close button**

```tsx
// src/renderer/components/KeyboardShortcutsModal.tsx
<button
  title="Close"
  onClick={onClose}
  autoFocus // [!code ++]
  style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
>
  ✕
</button>
```

- [ ] **Step 3: Verify manually or add simple tests**

- [ ] **Step 4: Commit**

```bash
git add src/renderer/components/SettingsModal.tsx src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "feat: add autoFocus to close buttons in Settings and Shortcuts modals"
```

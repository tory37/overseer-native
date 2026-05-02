# Fix and Expand KeyboardShortcutsModal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix failing tests for `KeyboardShortcutsModal` by providing the new `onSaveKeybindings` prop and adding new tests for shortcut editing and saving.

**Architecture:** Update existing tests to satisfy the new interface. Add new tests using `@testing-library/react` to simulate shortcut capture and saving logic.

**Tech Stack:** React, Jest, React Testing Library.

---

### Task 1: Fix Existing Tests

**Files:**
- Modify: `tests/renderer/KeyboardShortcutsModal.test.tsx`

- [ ] **Step 1: Update all render calls to include onSaveKeybindings prop**

```typescript
render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test tests/renderer/KeyboardShortcutsModal.test.tsx`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add tests/renderer/KeyboardShortcutsModal.test.tsx
git commit -m "test: fix KeyboardShortcutsModal tests by adding onSaveKeybindings prop"
```

### Task 2: Test Capturing a New Shortcut

**Files:**
- Modify: `tests/renderer/KeyboardShortcutsModal.test.tsx`

- [ ] **Step 1: Write failing test case for capturing a new shortcut**

```typescript
test('allows capturing a new shortcut', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  
  // Find "Set" button for "New Session"
  const newSessionRow = screen.getByText('New Session').closest('div')
  const setButton = screen.getByRole('button', { name: 'Set' }) // This might need refinement if multiple Set buttons exist
  // Refined search:
  const row = screen.getByText('New Session').parentElement!
  const rowSetButton = row.querySelector('button')!
  fireEvent.click(rowSetButton)

  expect(screen.getByText('Press keys...')).toBeInTheDocument()

  // Simulate keydown Ctrl+Alt+K
  fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true, altKey: true, shiftKey: false })

  expect(screen.getByText('Ctrl+Alt+K')).toBeInTheDocument()
  expect(screen.getByText('Save Shortcuts')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Actually, this might pass if the code is already implemented. But I should run it.

Run: `npm test tests/renderer/KeyboardShortcutsModal.test.tsx`
Expected: PASS (since implementation exists, but we are adding the test now)

- [ ] **Step 3: Commit**

```bash
git add tests/renderer/KeyboardShortcutsModal.test.tsx
git commit -m "test: add test case for capturing a new shortcut"
```

### Task 3: Test Saving Shortcuts

**Files:**
- Modify: `tests/renderer/KeyboardShortcutsModal.test.tsx`

- [ ] **Step 1: Write test case for calling onSaveKeybindings**

```typescript
test('calls onSaveKeybindings when Save clicked', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined)
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={onSave} />)
  
  // Capture new shortcut for New Session
  const row = screen.getByText('New Session').parentElement!
  const setButton = row.querySelector('button')!
  fireEvent.click(setButton)
  fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true, altKey: true, shiftKey: false })

  const saveButton = screen.getByText('Save Shortcuts')
  fireEvent.click(saveButton)

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    newSession: { code: 'KeyK', ctrl: true, alt: true, shift: false }
  }))
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test tests/renderer/KeyboardShortcutsModal.test.tsx`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add tests/renderer/KeyboardShortcutsModal.test.tsx
git commit -m "test: add test case for saving shortcuts"
```

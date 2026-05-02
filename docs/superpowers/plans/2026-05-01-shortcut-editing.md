# KeyboardShortcutsModal Shortcut Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `KeyboardShortcutsModal` to allow users to customize their keyboard shortcuts.

**Architecture:** Add state to track pending keybindings, a capturing mode to listen for key presses, and a save mechanism to persist changes.

**Tech Stack:** React, TypeScript, IPC.

---

### Task 1: Update Props and Imports

**Files:**
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Update imports and Props interface**

```typescript
import React, { useEffect, useState, useMemo } from 'react'
import { formatKeybinding, ACTION_LABELS } from '../types/ipc'
import type { Keybindings, KeybindingAction } from '../types/ipc'

interface Props {
  keybindings: Keybindings
  onClose: () => void
  onSaveKeybindings: (kb: Keybindings) => Promise<void>
}
```

- [ ] **Step 2: Remove local ACTION_LABELS**

Remove the `const ACTION_LABELS` definition since it's now imported from `../types/ipc`.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "refactor: update KeyboardShortcutsModal props and imports"
```

### Task 2: Implement Capture and Save Logic

**Files:**
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Add state and useMemo for dirty check**

```typescript
export function KeyboardShortcutsModal({ keybindings, onClose, onSaveKeybindings }: Props) {
  const [pendingKb, setPendingKb] = useState<Keybindings>(keybindings)
  const [capturingAction, setCapturingAction] = useState<KeybindingAction | null>(null)
  const [savingKb, setSavingKb] = useState(false)

  const isKbDirty = useMemo(() => JSON.stringify(pendingKb) !== JSON.stringify(keybindings), [pendingKb, keybindings])
```

- [ ] **Step 2: Add key capture useEffect**

```typescript
  useEffect(() => {
    if (!capturingAction) return
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.key === 'Escape') { setCapturingAction(null); return }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      setPendingKb(prev => ({
        ...prev,
        [capturingAction]: { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey },
      }))
      setCapturingAction(null)
    }
    window.addEventListener('keydown', handleCapture, { capture: true })
    return () => window.removeEventListener('keydown', handleCapture, { capture: true })
  }, [capturingAction])
```

- [ ] **Step 3: Update Escape handler to ignore if capturing**

```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (capturingAction) return // Ignore global Escape if we are capturing
      if (e.key === 'Escape' || e.key === '/') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, capturingAction])
```

- [ ] **Step 4: Add handleSave function**

```typescript
  const handleSave = async () => {
    setSavingKb(true)
    try {
      await onSaveKeybindings(pendingKb)
    } finally {
      setSavingKb(false)
    }
  }
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "feat: implement key capture and save logic in KeyboardShortcutsModal"
```

### Task 3: Update UI for Editing

**Files:**
- Modify: `src/renderer/components/KeyboardShortcutsModal.tsx`

- [ ] **Step 1: Update shortcut row to include "Set" button and handle capturing state**

```typescript
                {group.actions.map(action => {
                  const kb = pendingKb[action]
                  if (!kb) return null
                  const isCapturing = capturingAction === action
                  return (
                    <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{ACTION_LABELS[action] ?? action}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCapturing ? (
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>Press keys...</span>
                        ) : (
                          <kbd style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text-main)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {formatKeybinding(kb)}
                          </kbd>
                        )}
                        <button
                          onClick={() => setCapturingAction(isCapturing ? null : action)}
                          style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {isCapturing ? 'Cancel' : 'Set'}
                        </button>
                      </div>
                    </div>
                  )
                })}
```

- [ ] **Step 2: Add footer with "Save Shortcuts" button**

```typescript
        {isKbDirty && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              onClick={() => setPendingKb(keybindings)}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer' }}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={savingKb}
              style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 24px', borderRadius: 4, cursor: 'pointer', opacity: savingKb ? 0.7 : 1 }}
            >
              {savingKb ? 'Saving...' : 'Save Shortcuts'}
            </button>
          </div>
        )}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/KeyboardShortcutsModal.tsx
git commit -m "feat: update KeyboardShortcutsModal UI for shortcut editing"
```

### Task 4: Pass onSaveKeybindings to KeyboardShortcutsModal

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Pass onSaveKeybindings prop**

```typescript
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          keybindings={keybindings}
          onClose={() => setShowShortcutsModal(false)}
          onSaveKeybindings={updateKeybindings}
        />
      )}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: pass updateKeybindings to KeyboardShortcutsModal"
```

### Task 5: Verification

- [ ] **Step 1: Run type check**

Run: `npx tsc -p tsconfig.renderer.json --noEmit`
Expected: No errors.

- [ ] **Step 2: Commit**

```bash
git commit --allow-empty -m "chore: verify KeyboardShortcutsModal and App types"
```

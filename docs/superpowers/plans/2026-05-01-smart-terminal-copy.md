# Smart Terminal Copying Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a "smart copy" for the terminal that ignores soft-wrapped line breaks, preserving only intentional newlines.

**Architecture:** Create a utility function `getSmartSelectionText` that inspects the xterm.js buffer's `isWrapped` property for each line in the selection range. If a line is a continuation of the previous one (`isWrapped: true`), the newline between them is omitted in the copied text.

**Tech Stack:** TypeScript, React, xterm.js (@xterm/xterm).

---

### Task 1: Create Terminal Utilities and Unit Tests

**Files:**
- Create: `src/renderer/lib/terminal-utils.ts`
- Create: `tests/renderer/terminal-utils.test.ts`

- [ ] **Step 1: Write the failing tests for smart selection**

```typescript
import { getSmartSelectionText } from '../../src/renderer/lib/terminal-utils';

describe('getSmartSelectionText', () => {
  const mockTerminal = (lines: { text: string, isWrapped: boolean }[], selection: { start: { x: number, y: number }, end: { x: number, y: number } } | null) => {
    return {
      hasSelection: () => !!selection,
      getSelectionPosition: () => selection,
      getSelection: () => 'fallback', // Not used if position exists
      cols: 80,
      buffer: {
        active: {
          length: lines.length,
          getLine: (y: number) => {
            const line = lines[y];
            if (!line) return undefined;
            return {
              isWrapped: line.isWrapped,
              translateToString: (trimRight?: boolean, start?: number, end?: number) => {
                let s = line.text.substring(start ?? 0, end ?? line.text.length);
                if (trimRight) s = s.trimEnd();
                return s;
              }
            };
          }
        }
      }
    } as any;
  };

  it('should join wrapped lines without a newline', () => {
    const term = mockTerminal([
      { text: 'This is a long line that wraps', isWrapped: false },
      { text: 'at the end of the terminal.', isWrapped: true }
    ], { start: { x: 0, y: 0 }, end: { x: 27, y: 1 } });
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('This is a long line that wrapsat the end of the terminal.');
  });

  it('should keep newlines for non-wrapped lines', () => {
    const term = mockTerminal([
      { text: 'Line 1', isWrapped: false },
      { text: 'Line 2', isWrapped: false }
    ], { start: { x: 0, y: 0 }, end: { x: 6, y: 1 } });
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('Line 1\nLine 2');
  });

  it('should handle partial selection correctly', () => {
    const term = mockTerminal([
      { text: 'ABCDE', isWrapped: false },
      { text: 'FGHIJ', isWrapped: true }
    ], { start: { x: 2, y: 0 }, end: { x: 2, y: 1 } }); // Selection "CDE" + "FG"
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('CDEFG');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**
Run: `npm test tests/renderer/terminal-utils.test.ts`
Expected: Fail (module not found)

- [ ] **Step 3: Implement getSmartSelectionText**

```typescript
import { Terminal } from '@xterm/xterm';

/**
 * Gets the selected text from the terminal, but intelligently joins lines
 * that were soft-wrapped by the terminal.
 */
export function getSmartSelectionText(term: Terminal): string {
  if (!term.hasSelection()) {
    return '';
  }

  const range = term.getSelectionPosition();
  if (!range) {
    return term.getSelection();
  }

  let text = '';
  const buffer = term.buffer.active;

  for (let y = range.start.y; y <= range.end.y; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;

    const isFirstLine = y === range.start.y;
    const isLastLine = y === range.end.y;

    const startX = isFirstLine ? range.start.x : 0;
    const endX = isLastLine ? range.end.x : term.cols;

    // Check if the NEXT line is wrapped.
    const nextLine = y < buffer.length - 1 ? buffer.getLine(y + 1) : undefined;
    const isWrappedNext = nextLine ? nextLine.isWrapped : false;

    // We only trim right if the next line is NOT wrapped.
    // If it is wrapped, the trailing spaces (if any) are part of the wrap.
    const lineText = line.translateToString(!isWrappedNext && !isLastLine, startX, endX);
    text += lineText;

    if (!isLastLine && !isWrappedNext) {
      text += '\n';
    }
  }

  return text;
}
```

- [ ] **Step 4: Run tests and verify success**
Run: `npm test tests/renderer/terminal-utils.test.ts`
Expected: Pass

- [ ] **Step 5: Commit**
```bash
git add src/renderer/lib/terminal-utils.ts tests/renderer/terminal-utils.test.ts
git commit -m "feat: add smart selection text utility with tests"
```

---

### Task 2: Integrate Smart Copy into TerminalInstance

**Files:**
- Modify: `src/renderer/components/TerminalInstance.tsx`

- [ ] **Step 1: Import utility and update copy logic**

```typescript
// Add import at the top
import { getSmartSelectionText } from '../lib/terminal-utils';

// Find the copy logic in useEffect (search for unsubCopy)
// Before:
// const sel = term.getSelection()
// After:
// const sel = getSmartSelectionText(term)

// Also update the Ctrl+Shift+C handler
```

- [ ] **Step 2: Update terminal.attachCustomKeyEventHandler and unsubCopy**

```typescript
// Inside TerminalInstance.tsx
// ...
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.type === 'keydown' && e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        const sel = getSmartSelectionText(term) // Changed from term.getSelection()
        if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
        return false
      }
// ...
    const unsubCopy = window.overseer.onTerminalCopy(() => {
      if (!focusedRef.current || isDisposed) return
      const sel = getSmartSelectionText(term) // Changed from term.getSelection()
      if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
    })
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/components/TerminalInstance.tsx
git commit -m "feat: use smart selection in TerminalInstance"
```

---

### Task 3: Integrate Smart Copy into CompanionTerminal

**Files:**
- Modify: `src/renderer/components/CompanionTerminal.tsx`

- [ ] **Step 1: Import utility and update copy logic**

```typescript
// Add import at the top
import { getSmartSelectionText } from '../lib/terminal-utils';

// Update Ctrl+Shift+C handler and unsubCopy callback
```

- [ ] **Step 2: Apply changes**

```typescript
// Inside CompanionTerminal.tsx
// ...
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.type === 'keydown' && e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        const sel = getSmartSelectionText(term) // Changed from term.getSelection()
        if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
        return false
      }
// ...
    const unsubCopy = window.overseer.onTerminalCopy(() => {
      if (!focusedRef.current) return
      const sel = getSmartSelectionText(term) // Changed from term.getSelection()
      if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
    })
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/components/CompanionTerminal.tsx
git commit -m "feat: use smart selection in CompanionTerminal"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Build and run tests**
Run: `npm run build && npm test`
Expected: Everything passes.

- [ ] **Step 2: Manual verification (Optional but recommended)**
If possible, run the app and verify copying a wrapped line works as expected.
Since I am an agent, I'll rely on the unit tests for this specific logic.

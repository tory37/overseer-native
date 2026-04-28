# Fix 3-Way Split Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the bug where "Open 3-Way Split" (Ctrl+Shift+=) does nothing if the split is currently closed. It should instead spawn both companions and open the 3-way layout directly.

**Architecture:** Update `onSplitOpenThreeWay` in `useCompanion.ts` to remove the `splitOpen` guard and implement a sequence that ensures both Companion A and Companion B are spawned.

**Tech Stack:** React, TypeScript, Jest

---

## Task 1: Update `useCompanion.test.tsx` and `useCompanion.ts`

**Files:**
- Modify: `src/renderer/hooks/useCompanion.ts`
- Modify: `tests/renderer/useCompanion.test.tsx`

- [ ] **Step 1: Add the failing test case**

Modify `tests/renderer/useCompanion.test.tsx`. Find the `onSplitOpenThreeWay` describe/test block and add this test case:

```tsx
test('onSplitOpenThreeWay when split is closed: spawns BOTH companion A and B, opens 3-way, and focuses B', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  
  // Trigger from closed state
  await act(async () => { 
    result.current.onSplitOpenThreeWay() 
  })

  // Should have spawned two companions
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(2)
  expect((window as any).overseer.spawnCompanion).toHaveBeenNthCalledWith(1, '/home/test')
  expect((window as any).overseer.spawnCompanion).toHaveBeenNthCalledWith(2, '/home/test')

  // State should reflect 3-way split open
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.threeWayOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionB')
  expect(result.current.allCompanions).toHaveLength(1)
  expect(result.current.allCompanionsB).toHaveLength(1)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/renderer/useCompanion.test.tsx`
Expected: FAIL. `spawnCompanion` called 0 times (due to the guard clause) or only once if partial logic exists.

- [ ] **Step 3: Update `onSplitOpenThreeWay` implementation**

Modify `src/renderer/hooks/useCompanion.ts`. Replace the `onSplitOpenThreeWay` function with the following:

```ts
  const onSplitOpenThreeWay = useCallback(async () => {
    const session = activeSessionRef.current
    if (!session) return

    // helper to ensure companion A exists
    let aId = companions.A.get(session.id)
    if (!aId) {
      try {
        aId = await window.overseer.spawnCompanion(session.cwd)
        setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, aId!) }))
      } catch (err) {
        console.error('companion A spawn failed:', err)
        return
      }
    }

    // helper to ensure companion B exists
    let bId = companions.B.get(session.id)
    if (!bId) {
      try {
        bId = await window.overseer.spawnCompanion(session.cwd)
        setCompanions(p => ({ ...p, B: new Map(p.B).set(session.id, bId!) }))
      } catch (err) {
        console.error('companion B spawn failed:', err)
        // Even if B fails, we should at least open A if it succeeded
        setSplitOpen(true)
        setSplitFocused('companionA')
        return
      }
    }

    setSplitOpen(true)
    setThreeWayOpen(true)
    setSplitFocused('companionB')
  }, [companions])
```

*Note: Update the `CompanionAPI` interface and the returned object in `useCompanion` if the signature changed (it's now `async`, but the UI doesn't strictly need to await it unless we want to).*

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/renderer/useCompanion.test.tsx`
Expected: PASS

- [ ] **Step 5: Final check and Commit**

Run: `npx tsc --noEmit -p tsconfig.renderer.json` to ensure no type errors.

```bash
git add src/renderer/hooks/useCompanion.ts tests/renderer/useCompanion.test.tsx
git commit -m "fix: allow opening 3-way split directly from closed state"
```

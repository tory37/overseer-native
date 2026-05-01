# Layout Persisting Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the race condition in `useCompanion` that overwrites the session layout on startup and restore companions to visually show the saved layout.

**Architecture:** We will fix the race condition in `useCompanion.ts` by using a ref `lastSessionIdForPersist` to ensure the persist effect ignores the initial render when switching sessions. We will also update the layout loader to asynchronously spawn missing companion processes if the layout expects them to be open. We will remove the old synchronous normalization effect, which incorrectly forced `threeWayOpen` to `false` before companions could spawn.

**Tech Stack:** React hooks (TypeScript), Jest/React Testing Library.

---

### Task 1: Fix `useCompanion` Layout Loading and Persisting

**Files:**
- Modify: `src/renderer/hooks/useCompanion.ts`

- [ ] **Step 1: Replace layout loading effect**
Modify `src/renderer/hooks/useCompanion.ts`. Delete the existing `// Load layout when session changes` effect and the `// Normalize split layout state` effect (lines ~65-115) and replace them with this combined effect:

```typescript
  // Load layout and spawn missing companions
  useEffect(() => {
    let isCancelled = false

    const loadAndSpawn = async () => {
      const session = activeSession
      if (!session) return

      const layoutToUse = session.layout || {
        splitOpen: false,
        threeWayOpen: false,
        splitDirection: 'horizontal' as const,
        splitSwapped: false,
        secondarySwapped: false,
        outerSplitRatio: 0.5,
        innerSplitRatio: 0.5,
      }

      setSplitOpen(layoutToUse.splitOpen)
      setThreeWayOpen(layoutToUse.threeWayOpen)
      setSplitDirection(layoutToUse.splitDirection)
      setSplitSwapped(layoutToUse.splitSwapped)
      setSecondarySwapped(layoutToUse.secondarySwapped)
      setOuterSplitRatio(layoutToUse.outerSplitRatio)
      setInnerSplitRatio(layoutToUse.innerSplitRatio)

      if (layoutToUse.splitOpen) {
        const comps = companionsRef.current
        let aId = comps.A.get(session.id)
        if (!aId) {
          try {
            aId = await window.overseer.spawnCompanion(session.cwd)
            if (isCancelled) return
            setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, aId!) }))
          } catch (err) {
            console.error('companion A restore spawn failed:', err)
          }
        }
        if (layoutToUse.threeWayOpen) {
          let bId = comps.B.get(session.id)
          if (!bId) {
            try {
              bId = await window.overseer.spawnCompanion(session.cwd)
              if (isCancelled) return
              setCompanions(p => ({ ...p, B: new Map(p.B).set(session.id, bId!) }))
            } catch (err) {
              console.error('companion B restore spawn failed:', err)
            }
          }
        }
      } else {
        // If we switched to a session that doesn't expect splits, focus main
        setSplitFocused('main')
      }
    }
    
    loadAndSpawn()

    return () => {
      isCancelled = true
    }
  }, [activeSession?.id])
```

- [ ] **Step 2: Add `lastSessionIdForPersist` ref**
Add a new ref to `useCompanion.ts` near the other refs (e.g. after `splitFocusedRef`):

```typescript
  const splitFocusedRef   = useRef(splitFocused)
  const lastSessionIdForPersist = useRef(activeSession?.id)
```

- [ ] **Step 3: Fix `updateSession` race condition**
Modify the `// Persist layout changes` effect in `src/renderer/hooks/useCompanion.ts`. Update it to skip the first run for a new session ID:

```typescript
  // Persist layout changes
  useEffect(() => {
    if (!activeSession) return
    if (lastSessionIdForPersist.current !== activeSession.id) {
      lastSessionIdForPersist.current = activeSession.id
      return
    }
    const layout: SessionLayout = {
      splitOpen,
      threeWayOpen,
      splitDirection,
      splitSwapped,
      secondarySwapped,
      outerSplitRatio,
      innerSplitRatio,
    }
    useSessionStore.getState().updateSession(activeSession.id, { layout })
  }, [activeSession?.id, splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped, outerSplitRatio, innerSplitRatio])
```

- [ ] **Step 4: Fix `onCompanionExit` hook to handle focus**
Since we removed the normalization effect, we must ensure `onCompanionExit` gracefully handles when B dies. Wait, the existing `onCompanionExit` handles B dying (sets `threeWayOpen=false`, focuses A), and if A dies, it handles that too. No changes needed.

- [ ] **Step 5: Run tests**
Run `npm run test -- tests/renderer/useCompanion.test.tsx` and ensure it passes.

- [ ] **Step 6: Commit**
```bash
git add src/renderer/hooks/useCompanion.ts
git commit -m "fix: resolve layout restore race condition and spawn companions on load"
```

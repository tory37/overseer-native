import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session } from '../types/ipc'

interface CompanionMaps {
  A: Map<string, string> // sessionId → companionId
  B: Map<string, string>
}

export interface CompanionState {
  activeCompanionId: string | null
  allCompanions:  Array<{ sessionId: string; companionId: string }>
  allCompanionsB: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  threeWayOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  secondarySwapped: boolean
  splitFocused: 'main' | 'companionA' | 'companionB'
  outerSplitRatio: number
  innerSplitRatio: number
}

export interface CompanionAPI extends CompanionState {
  onSplitFocus:            () => void
  onSplitFocusPrev:        () => void
  onSplitSwap:             () => void
  onSplitSwapSecondary:    () => void
  onSplitToggleDirection:  () => void
  onSplitOpenThreeWay:     () => void | Promise<void>
  onSplitClose:            () => void
  onOuterRatio:            (r: number) => void
  onInnerRatio:            (r: number) => void
  killCompanionForSession: (sessionId: string) => void
  onSetSplitFocused:       (f: 'main' | 'companionA' | 'companionB') => void
}

export function useCompanion(activeSession: Session | undefined): CompanionAPI {
  const [companions, setCompanions] = useState<CompanionMaps>({ A: new Map(), B: new Map() })
  const [splitOpen, setSplitOpen]           = useState(false)
  const [threeWayOpen, setThreeWayOpen]     = useState(false)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [splitSwapped, setSplitSwapped]     = useState(false)
  const [secondarySwapped, setSecondarySwapped] = useState(false)
  const [splitFocused, setSplitFocused]     = useState<'main' | 'companionA' | 'companionB'>('main')
  const [outerSplitRatio, setOuterSplitRatio] = useState(0.5)
  const [innerSplitRatio, setInnerSplitRatio] = useState(0.5)

  const activeSessionRef  = useRef(activeSession)
  const companionsRef     = useRef(companions)
  const splitOpenRef      = useRef(splitOpen)
  const threeWayOpenRef   = useRef(threeWayOpen)
  const splitFocusedRef   = useRef(splitFocused)

  useEffect(() => { activeSessionRef.current  = activeSession  }, [activeSession])
  // companionsRef must be updated before the normalization effect reads it
  useEffect(() => { companionsRef.current     = companions     }, [companions])
  useEffect(() => { splitOpenRef.current      = splitOpen      }, [splitOpen])
  useEffect(() => { threeWayOpenRef.current   = threeWayOpen   }, [threeWayOpen])
  useEffect(() => { splitFocusedRef.current   = splitFocused   }, [splitFocused])

  // Normalize split layout state when the active session changes.
  // splitOpen/threeWayOpen are global, but companion existence is per-session —
  // this keeps them in sync so stale values from a previous session don't bleed over.
  useEffect(() => {
    const session = activeSession
    if (!session) return
    const comps = companionsRef.current
    const aId = comps.A.get(session.id)
    const bId = comps.B.get(session.id)
    if (!aId) {
      setThreeWayOpen(false)
      setSplitFocused('main')
    } else {
      if (!splitOpenRef.current) setSplitOpen(true)
      if (!bId) {
        setThreeWayOpen(false)
        setSplitFocused(f => f === 'companionB' ? 'companionA' : f)
      } else {
        if (!threeWayOpenRef.current) setThreeWayOpen(true)
      }
    }
  }, [activeSession?.id])

  useEffect(() => {
    const unsub = window.overseer.onCompanionExit((companionId) => {
      setCompanions(prev => {
        // Check B first
        for (const [sid, cid] of prev.B) {
          if (cid === companionId) {
            const B = new Map(prev.B)
            B.delete(sid)
            if (sid === activeSessionRef.current?.id) {
              setThreeWayOpen(false)
              setSplitFocused(f => f === 'companionB' ? 'companionA' : f)
            }
            return { ...prev, B }
          }
        }
        // Check A
        for (const [sid, cid] of prev.A) {
          if (cid === companionId) {
            const A = new Map(prev.A)
            A.delete(sid)
            const bId = prev.B.get(sid)
            const B = bId ? (() => {
              window.overseer.killCompanion(bId).catch(() => {})
              const nb = new Map(prev.B)
              nb.delete(sid)
              return nb
            })() : prev.B
            if (sid === activeSessionRef.current?.id) {
              setSplitOpen(false)
              setThreeWayOpen(false)
              setSplitFocused('main')
            }
            return { A, B }
          }
        }
        return prev
      })
    })
    return unsub
  }, [])

  const onSplitFocus = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return
    const existingId = companionsRef.current.A.get(session.id)
    if (!existingId) {
      // No companion yet — spawn one
      window.overseer.spawnCompanion(session.cwd).then(id => {
        setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
        setSplitOpen(true)
        setSplitFocused('companionA')
      }).catch((err: unknown) => console.error('companion spawn failed:', err))
      return
    }
    if (!splitOpenRef.current) {
      // Companion exists but split is hidden — reveal it
      setSplitOpen(true)
      setSplitFocused('companionA')
      return
    }
    // Split is open — cycle focus forward
    setSplitFocused(f => {
      if (f === 'main') return 'companionA'
      if (f === 'companionA') return threeWayOpenRef.current ? 'companionB' : 'main'
      return 'main'
    })
  }, [])

  const onSplitFocusPrev = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return
    const existingId = companionsRef.current.A.get(session.id)
    if (!existingId) {
      // No companion yet — spawn one
      window.overseer.spawnCompanion(session.cwd).then(id => {
        setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
        setSplitOpen(true)
        setSplitFocused('companionA')
      }).catch((err: unknown) => console.error('companion spawn failed:', err))
      return
    }
    if (!splitOpenRef.current) {
      // Companion exists but split is hidden — reveal it
      setSplitOpen(true)
      setSplitFocused('companionA')
      return
    }
    // Split is open — cycle focus backward
    setSplitFocused(f => {
      if (f === 'main') return threeWayOpenRef.current ? 'companionB' : 'companionA'
      if (f === 'companionA') return 'main'
      return 'companionA'
    })
  }, [])

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

  const onSplitClose = useCallback(() => {
    const session = activeSessionRef.current
    const focused = splitFocusedRef.current
    if (!session) return
    if (focused === 'main') {
      if (!splitOpenRef.current) return
      setCompanions(prev => {
        const aId = prev.A.get(session.id)
        const bId = prev.B.get(session.id)
        if (aId) window.overseer.killCompanion(aId).catch(() => {})
        if (bId) window.overseer.killCompanion(bId).catch(() => {})
        const A = new Map(prev.A)
        const B = new Map(prev.B)
        A.delete(session.id)
        B.delete(session.id)
        return { A, B }
      })
      setSplitOpen(false)
      setThreeWayOpen(false)
      return
    }
    if (focused === 'companionB') {
      setCompanions(prev => {
        const bId = prev.B.get(session.id)
        if (!bId) return prev
        window.overseer.killCompanion(bId).catch(() => {})
        const B = new Map(prev.B)
        B.delete(session.id)
        return { ...prev, B }
      })
      setThreeWayOpen(false)
      setSplitFocused('companionA')
      return
    }
    setCompanions(prev => {
      const aId = prev.A.get(session.id)
      const bId = prev.B.get(session.id)
      if (aId) window.overseer.killCompanion(aId).catch(() => {})
      if (bId) window.overseer.killCompanion(bId).catch(() => {})
      const A = new Map(prev.A)
      const B = new Map(prev.B)
      A.delete(session.id)
      B.delete(session.id)
      return { A, B }
    })
    setSplitOpen(false)
    setThreeWayOpen(false)
    setSplitFocused('main')
  }, [])

  const onSplitSwap = useCallback(() => {
    if (splitOpenRef.current) setSplitSwapped(s => !s)
  }, [])

  const onSplitSwapSecondary = useCallback(() => {
    if (threeWayOpenRef.current) setSecondarySwapped(s => !s)
  }, [])

  const onSplitToggleDirection = useCallback(() => {
    if (splitOpenRef.current) setSplitDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')
  }, [])

  const onOuterRatio = useCallback((r: number) => {
    setOuterSplitRatio(Math.min(0.9, Math.max(0.1, r)))
  }, [])

  const onInnerRatio = useCallback((r: number) => {
    setInnerSplitRatio(Math.min(0.9, Math.max(0.1, r)))
  }, [])

  const killCompanionForSession = useCallback((sessionId: string) => {
    setCompanions(prev => {
      const aId = prev.A.get(sessionId)
      const bId = prev.B.get(sessionId)
      if (aId) window.overseer.killCompanion(aId).catch(() => {})
      if (bId) window.overseer.killCompanion(bId).catch(() => {})
      const A = new Map(prev.A)
      const B = new Map(prev.B)
      A.delete(sessionId)
      B.delete(sessionId)
      return { A, B }
    })
    if (sessionId === activeSessionRef.current?.id) {
      setSplitOpen(false)
      setThreeWayOpen(false)
      setSplitFocused('main')
    }
    // The normalization effect (keyed on activeSession?.id) will re-open the split
    // for the next session if it still has live companions, correcting the global reset above.
  }, [])

  const activeCompanionId = activeSession ? (companions.A.get(activeSession.id) ?? null) : null
  const allCompanions  = Array.from(companions.A.entries()).map(([sessionId, companionId]) => ({ sessionId, companionId }))
  const allCompanionsB = Array.from(companions.B.entries()).map(([sessionId, companionId]) => ({ sessionId, companionId }))

  return {
    activeCompanionId, allCompanions, allCompanionsB,
    splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
    splitFocused, outerSplitRatio, innerSplitRatio,
    onSplitFocus, onSplitFocusPrev, onSplitSwap, onSplitSwapSecondary,
    onSplitToggleDirection, onSplitOpenThreeWay, onSplitClose,
    onOuterRatio, onInnerRatio, killCompanionForSession,
    onSetSplitFocused: setSplitFocused,
  }
}

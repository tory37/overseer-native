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
  onSplitOpenThreeWay:     () => void
  onSplitClose:            () => void
  onOuterRatio:            (r: number) => void
  onInnerRatio:            (r: number) => void
  killCompanionForSession: (sessionId: string) => void
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
  const splitOpenRef      = useRef(splitOpen)
  const threeWayOpenRef   = useRef(threeWayOpen)
  const splitFocusedRef   = useRef(splitFocused)

  useEffect(() => { activeSessionRef.current  = activeSession  }, [activeSession])
  useEffect(() => { splitOpenRef.current      = splitOpen      }, [splitOpen])
  useEffect(() => { threeWayOpenRef.current   = threeWayOpen   }, [threeWayOpen])
  useEffect(() => { splitFocusedRef.current   = splitFocused   }, [splitFocused])

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
    if (!splitOpenRef.current) {
      setCompanions(prev => {
        if (prev.A.get(session.id)) {
          setSplitOpen(true)
          setSplitFocused('companionA')
          return prev
        }
        window.overseer.spawnCompanion(session.cwd).then(id => {
          setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
          setSplitOpen(true)
          setSplitFocused('companionA')
        }).catch((err: unknown) => console.error('companion spawn failed:', err))
        return prev
      })
      return
    }
    setSplitFocused(f => {
      if (f === 'main') return 'companionA'
      if (f === 'companionA') return threeWayOpenRef.current ? 'companionB' : 'main'
      return 'main'
    })
  }, [])

  const onSplitFocusPrev = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return
    if (!splitOpenRef.current) {
      setCompanions(prev => {
        if (prev.A.get(session.id)) {
          setSplitOpen(true)
          setSplitFocused('companionA')
          return prev
        }
        window.overseer.spawnCompanion(session.cwd).then(id => {
          setCompanions(p => ({ ...p, A: new Map(p.A).set(session.id, id) }))
          setSplitOpen(true)
          setSplitFocused('companionA')
        }).catch((err: unknown) => console.error('companion spawn failed:', err))
        return prev
      })
      return
    }
    setSplitFocused(f => {
      if (f === 'main') return threeWayOpenRef.current ? 'companionB' : 'companionA'
      if (f === 'companionA') return 'main'
      return 'companionA'
    })
  }, [])

  const onSplitOpenThreeWay = useCallback(() => {
    if (!splitOpenRef.current) return
    const session = activeSessionRef.current
    if (!session) return
    setCompanions(prev => {
      if (prev.B.get(session.id)) {
        setThreeWayOpen(true)
        setSplitFocused('companionB')
        return prev
      }
      window.overseer.spawnCompanion(session.cwd).then(id => {
        setCompanions(p => ({ ...p, B: new Map(p.B).set(session.id, id) }))
        setThreeWayOpen(true)
        setSplitFocused('companionB')
      }).catch((err: unknown) => console.error('companion B spawn failed:', err))
      return prev
    })
  }, [])

  const onSplitClose = useCallback(() => {
    const session = activeSessionRef.current
    const focused = splitFocusedRef.current
    if (focused === 'main' || !session) return
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
  }
}

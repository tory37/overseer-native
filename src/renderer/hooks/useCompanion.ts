import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session } from '../types/ipc'

export interface CompanionState {
  activeCompanionId: string | null
  allCompanions: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export interface CompanionAPI extends CompanionState {
  onSplitFocus:            () => void
  onSplitSwap:             () => void
  onSplitToggleDirection:  () => void
  killCompanionForSession: (sessionId: string) => void
}

export function useCompanion(activeSession: Session | undefined): CompanionAPI {
  const [companions, setCompanions]         = useState<Map<string, string>>(new Map()) // sessionId → companionId
  const [splitOpen, setSplitOpen]           = useState(false)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [splitSwapped, setSplitSwapped]     = useState(false)
  const [splitFocused, setSplitFocused]     = useState<'main' | 'companion'>('main')

  const activeSessionRef = useRef(activeSession)
  useEffect(() => { activeSessionRef.current = activeSession }, [activeSession])

  useEffect(() => {
    const unsub = window.overseer.onCompanionExit((companionId) => {
      setCompanions(prev => {
        const next = new Map(prev)
        for (const [sid, cid] of next) {
          if (cid === companionId) {
            next.delete(sid)
            if (sid === activeSessionRef.current?.id) {
              setSplitOpen(false)
              setSplitFocused('main')
            }
            break
          }
        }
        return next
      })
    })
    return unsub
  }, [])

  const onSplitFocus = useCallback(() => {
    setSplitOpen(open => {
      if (!open) {
        const session = activeSessionRef.current
        if (!session) return open
        // Companion map state is read via a ref updated in a separate effect below
        // We schedule the open; if already spawned we open sync, else async after spawn
        setCompanions(prev => {
          const existing = prev.get(session.id)
          if (existing) {
            setSplitOpen(true)
            setSplitFocused('companion')
          } else {
            window.overseer.spawnCompanion(session.cwd).then(id => {
              setCompanions(p => new Map(p).set(session.id, id))
              setSplitOpen(true)
              setSplitFocused('companion')
            }).catch((err: unknown) => console.error('companion spawn failed:', err))
          }
          return prev
        })
        return open
      }
      setSplitFocused(f => f === 'main' ? 'companion' : 'main')
      return open
    })
  }, [])

  const onSplitSwap = useCallback(() => {
    setSplitOpen(open => {
      if (open) setSplitSwapped(s => !s)
      return open
    })
  }, [])

  const onSplitToggleDirection = useCallback(() => {
    setSplitOpen(open => {
      if (open) setSplitDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')
      return open
    })
  }, [])

  const killCompanionForSession = useCallback((sessionId: string) => {
    setCompanions(prev => {
      const companionId = prev.get(sessionId)
      if (!companionId) return prev
      window.overseer.killCompanion(companionId).catch(() => {})
      const next = new Map(prev)
      next.delete(sessionId)
      return next
    })
  }, [])

  const activeCompanionId = activeSession ? (companions.get(activeSession.id) ?? null) : null
  const allCompanions = Array.from(companions.entries()).map(([sessionId, companionId]) => ({ sessionId, companionId }))

  return {
    activeCompanionId,
    allCompanions,
    splitOpen,
    splitDirection,
    splitSwapped,
    splitFocused,
    onSplitFocus,
    onSplitSwap,
    onSplitToggleDirection,
    killCompanionForSession,
  }
}

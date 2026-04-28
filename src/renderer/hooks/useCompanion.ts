import { useState, useEffect, useCallback } from 'react'

export interface CompanionState {
  companionId: string | null
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export interface CompanionAPI extends CompanionState {
  onSplitFocus:           () => void
  onSplitSwap:            () => void
  onSplitToggleDirection: () => void
}

export function useCompanion(): CompanionAPI {
  const [companionId,    setCompanionId]    = useState<string | null>(null)
  const [splitOpen,      setSplitOpen]      = useState(false)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [splitSwapped,   setSplitSwapped]   = useState(false)
  const [splitFocused,   setSplitFocused]   = useState<'main' | 'companion'>('main')

  useEffect(() => {
    const unsubscribe = window.overseer.onCompanionExit(() => {
      setCompanionId(null)
      setSplitOpen(false)
      setSplitFocused('main')
    })
    return unsubscribe
  }, [])

  const onSplitFocus = useCallback(() => {
    setSplitOpen(open => {
      if (!open) {
        window.overseer.spawnCompanion().then(id => {
          setCompanionId(id)
          setSplitOpen(true)
          setSplitFocused('companion')
        }).catch((err: unknown) => console.error('companion spawn failed:', err))
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

  return { companionId, splitOpen, splitDirection, splitSwapped, splitFocused, onSplitFocus, onSplitSwap, onSplitToggleDirection }
}

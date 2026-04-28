import { useState, useEffect, useRef } from 'react'
import { DEFAULT_KEYBINDINGS, matchKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

export interface ShortcutHandlers {
  onNewSession:     () => void
  onKillSession:    () => void
  onNextSession:    () => void
  onPrevSession:    () => void
  onSessionByIndex: (index: number) => void
  onOpenDrawer:           () => void
  onOpenSettings:         () => void
  onOpenShortcuts:        () => void
  onSplitFocus:           () => void
  onSplitSwap:            () => void
  onSplitToggleDirection: () => void
}

export interface KeyboardShortcutsAPI {
  keybindings:       Keybindings
  updateKeybindings: (kb: Keybindings) => Promise<void>
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): KeyboardShortcutsAPI {
  const [keybindings, setKeybindings] = useState<Keybindings>(DEFAULT_KEYBINDINGS)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    window.overseer.readKeybindings().then(kb => {
      if (kb) setKeybindings(kb)
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = matchKeybinding(keybindings, e)
      if (!action) return
      e.preventDefault()
      const h = handlersRef.current
      if (action === 'newSession')    { h.onNewSession();    return }
      if (action === 'killSession')   { h.onKillSession();   return }
      if (action === 'nextSession')   { h.onNextSession();   return }
      if (action === 'prevSession')   { h.onPrevSession();   return }
      if (action === 'openDrawer')           { h.onOpenDrawer();           return }
      if (action === 'openSettings')         { h.onOpenSettings();         return }
      if (action === 'openShortcuts')        { h.onOpenShortcuts();        return }
      if (action === 'splitFocus')           { h.onSplitFocus();           return }
      if (action === 'splitSwap')            { h.onSplitSwap();            return }
      if (action === 'splitToggleDirection') { h.onSplitToggleDirection(); return }
      const idxMatch = action.match(/^sessionByIndex(\d)$/)
      if (idxMatch) h.onSessionByIndex(parseInt(idxMatch[1], 10))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keybindings])

  const updateKeybindings = async (kb: Keybindings) => {
    await window.overseer.writeKeybindings(kb)
    setKeybindings(kb)
  }

  return { keybindings, updateKeybindings }
}

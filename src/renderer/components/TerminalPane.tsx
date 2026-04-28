import React from 'react'
import { TerminalInstance } from './TerminalInstance'
import { CompanionTerminal } from './CompanionTerminal'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  keybindings: Keybindings
  allCompanions: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export function TerminalPane({ sessions, activeSessionId, keybindings, allCompanions, splitOpen, splitDirection, splitSwapped, splitFocused }: Props) {
  const sessionStack = sessions.map(session => (
    <div
      key={session.id}
      style={{ position: 'absolute', inset: 0, display: session.id === activeSessionId ? 'block' : 'none' }}
    >
      <TerminalInstance session={session} keybindings={keybindings} />
    </div>
  ))

  const activeCompanionId = allCompanions.find(c => c.sessionId === activeSessionId)?.companionId ?? null
  const showCompanion = splitOpen && !!activeCompanionId
  const isRow = splitDirection === 'horizontal'

  // Render all companions as a stack (preserves xterm state when switching tabs)
  const companionStack = allCompanions.map(({ sessionId, companionId }) => (
    <div
      key={companionId}
      style={{ position: 'absolute', inset: 0, display: sessionId === activeSessionId ? 'block' : 'none' }}
    >
      <CompanionTerminal
        companionId={companionId}
        focused={splitFocused === 'companion' && sessionId === activeSessionId}
        keybindings={keybindings}
      />
    </div>
  ))

  // Always use the same flex structure so sessionStack's wrapper div never changes position in the
  // React tree. An early-return branch here would cause React to unmount and remount all
  // TerminalInstance components when switching between sessions with and without a companion
  // (same xterm DOM-remount problem we solved for swap/layout with CSS order).
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isRow ? 'row' : 'column', background: '#1e1e1e' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', order: splitSwapped ? 2 : 0 }}>
        {sessionStack}
      </div>
      <div style={{ width: isRow ? '1px' : '100%', height: isRow ? '100%' : '1px', background: '#555', flexShrink: 0, order: 1, display: showCompanion ? undefined : 'none' }} />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', order: splitSwapped ? 0 : 2, display: showCompanion ? undefined : 'none' }}>
        {companionStack}
      </div>
    </div>
  )
}

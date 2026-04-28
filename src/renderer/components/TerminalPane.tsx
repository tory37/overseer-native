import React from 'react'
import { TerminalInstance } from './TerminalInstance'
import { CompanionTerminal } from './CompanionTerminal'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  keybindings: Keybindings
  companionId: string | null
  splitOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  splitFocused: 'main' | 'companion'
}

export function TerminalPane({ sessions, activeSessionId, keybindings, companionId, splitOpen, splitDirection, splitSwapped, splitFocused }: Props) {
  const sessionStack = sessions.map(session => (
    <div
      key={session.id}
      style={{ position: 'absolute', inset: 0, display: session.id === activeSessionId ? 'block' : 'none' }}
    >
      <TerminalInstance session={session} keybindings={keybindings} />
    </div>
  ))

  if (!splitOpen || !companionId) {
    return (
      <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
        {sessionStack}
      </div>
    )
  }

  const isRow = splitDirection === 'horizontal'
  const mainPane = (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {sessionStack}
    </div>
  )
  const companionPane = (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <CompanionTerminal
        companionId={companionId}
        focused={splitFocused === 'companion'}
        keybindings={keybindings}
      />
    </div>
  )
  const firstPane  = splitSwapped ? companionPane : mainPane
  const secondPane = splitSwapped ? mainPane : companionPane

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isRow ? 'row' : 'column', background: '#1e1e1e' }}>
      {firstPane}
      <div style={{ width: isRow ? '1px' : '100%', height: isRow ? '100%' : '1px', background: '#555', flexShrink: 0 }} />
      {secondPane}
    </div>
  )
}

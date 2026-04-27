import React from 'react'
import { TerminalInstance } from './TerminalInstance'
import type { Session } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
}

export function TerminalPane({ sessions, activeSessionId }: Props) {
  return (
    <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
      {sessions.map(session => (
        <div
          key={session.id}
          style={{
            position: 'absolute',
            inset: 0,
            display: session.id === activeSessionId ? 'block' : 'none',
          }}
        >
          <TerminalInstance session={session} />
        </div>
      ))}
    </div>
  )
}

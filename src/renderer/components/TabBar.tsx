import React from 'react'
import type { Session } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  confirmKillId?: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function TabBar({ sessions, activeSessionId, confirmKillId, onSelect, onNew }: Props) {
  return (
    <div style={{ display: 'flex', background: '#2d2d2d', padding: '4px 8px', gap: '4px' }}>
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            padding: '4px 12px',
            background: s.id === confirmKillId ? '#8b0000' : (s.id === activeSessionId ? '#1e1e1e' : '#3a3a3a'),
            color: s.id === confirmKillId ? '#fff' : '#ccc',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
          }}
        >
          {s.name}{s.id === confirmKillId ? ' (press again to kill)' : ''}
        </button>
      ))}
      <button
        aria-label="+"
        onClick={onNew}
        style={{ padding: '4px 10px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '18px' }}
      >
        +
      </button>
    </div>
  )
}

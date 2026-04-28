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
    <div style={{ display: 'flex', background: 'var(--bg-header)', padding: '4px 8px', gap: '4px' }}>
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            padding: '4px 12px',
            background: s.id === confirmKillId ? '#8b0000' : (s.id === activeSessionId ? 'var(--bg-main)' : 'var(--bg-inactive-tab)'),
            color: s.id === confirmKillId ? '#fff' : 'var(--text-main)',
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
        style={{ padding: '4px 10px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '18px' }}
      >
        +
      </button>
    </div>
  )
}

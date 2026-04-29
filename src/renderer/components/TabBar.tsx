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
            background: s.id === confirmKillId ? '#8b0000' : (s.id === activeSessionId ? 'var(--bg-active-tab)' : 'var(--bg-inactive-tab)'),
            color: s.id === confirmKillId ? '#fff' : 'var(--text-main)',
            border: 'none',
            borderTop: s.id === activeSessionId ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: s.id === activeSessionId ? 'bold' : 'normal',
            boxShadow: s.id === activeSessionId ? '0 -2px 10px rgba(0,0,0,0.2)' : 'none',
            padding: s.id === activeSessionId ? '6px 16px' : '4px 12px',
            cursor: 'pointer',
            zIndex: s.id === activeSessionId ? 1 : 0,
            transition: 'all 0.1s ease',
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

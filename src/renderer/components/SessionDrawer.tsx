import React from 'react'
import type { Session } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onKill: (id: string) => void
  onClose: () => void
}

export function SessionDrawer({ sessions, activeSessionId, onSelect, onKill, onClose }: Props) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
  }
  const drawerStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px',
    background: '#252526', display: 'flex', flexDirection: 'column', padding: '16px', gap: '8px',
  }
  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? '#094771' : '#2d2d2d',
    borderRadius: '4px', padding: '8px 12px', color: '#ccc',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  })

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#eee', margin: 0 }}>All Sessions</h3>
        {sessions.map(s => (
          <div key={s.id} style={itemStyle(s.id === activeSessionId)}>
            <div
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => { onSelect(s.id); onClose() }}
            >
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.agentType} · {s.cwd}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onKill(s.id) }}
              style={{ background: 'transparent', border: 'none', color: '#c55', cursor: 'pointer', padding: '4px', fontSize: '14px' }}
              title="Kill session"
            >
              ✕
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div style={{ color: '#666', fontSize: '13px' }}>No sessions yet.</div>
        )}
      </div>
    </div>
  )
}

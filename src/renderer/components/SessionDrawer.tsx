import React, { useState, useEffect } from 'react'
import type { Session } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onKill: (id: string) => void
  onClose: () => void
}

export function SessionDrawer({ sessions, activeSessionId, onSelect, onKill, onClose }: Props) {
  const [focusedIdx, setFocusedIdx] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIdx(i => Math.min(i + 1, sessions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIdx(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const s = sessions[focusedIdx]
        if (s) { onSelect(s.id); onClose() }
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const s = sessions[focusedIdx]
        if (s) onKill(s.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions, focusedIdx, onClose, onSelect, onKill])

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
  }
  const drawerStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px',
    background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', padding: '16px', gap: '8px',
  }
  const itemStyle = (isActive: boolean, isFocused: boolean): React.CSSProperties => ({
    background: isActive ? 'var(--bg-active-tab)' : isFocused ? 'var(--bg-active-tab)' : 'var(--bg-inactive-tab)',
    borderRadius: '4px', padding: '8px 12px', color: 'var(--text-main)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    outline: isFocused ? '1px solid var(--accent)' : 'none',
  })

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: 'var(--text-main)', margin: 0 }}>All Sessions</h3>
        {sessions.map((s, i) => (
          <div key={s.id} style={itemStyle(s.id === activeSessionId, i === focusedIdx)}>
            <div
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => { onSelect(s.id); onClose() }}
            >
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.agentType} · {s.cwd}</div>
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
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sessions yet.</div>
        )}
      </div>
    </div>
  )
}

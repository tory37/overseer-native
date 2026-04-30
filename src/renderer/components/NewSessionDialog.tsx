import React, { useState, useEffect } from 'react'
import type { CreateSessionOptions, Session } from '../types/ipc'
import { useSpritesStore } from '../store/sprites'

interface Props {
  onCreate: (options: CreateSessionOptions) => void
  onCancel: () => void
}

export function NewSessionDialog({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('')
  const [agentType, setAgentType] = useState<Session['agentType']>('shell')
  const [cwd, setCwd] = useState('')
  const [cwdValid, setCwdValid] = useState<boolean | null>(null)
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>('')
  const sprites = useSpritesStore(s => s.sprites)

  useEffect(() => {
    setCwdValid(null)
    if (!cwd) return
    const timer = setTimeout(async () => {
      const valid = await window.overseer.isDirectory(cwd)
      setCwdValid(valid)
    }, 400)
    return () => clearTimeout(timer)
  }, [cwd])

  const handleBrowse = async () => {
    const chosen = await window.overseer.openDirectory(cwd)
    if (chosen) setCwd(chosen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sprite = sprites.find(s => s.id === selectedSpriteId)
    onCreate({
      name,
      agentType,
      cwd,
      spriteId: sprite?.id ?? null,
      spriteName: sprite?.name,
      persona: sprite?.persona,
    })
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-header)', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '360px',
  }
  const labelStyle: React.CSSProperties = { color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }
  const inputStyle: React.CSSProperties = { background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 8px' }
  const cwdInputStyle: React.CSSProperties = {
    ...inputStyle,
    flex: 1,
    border: cwdValid === false ? '1px solid #e05252' : '1px solid var(--border)',
  }

  return (
    <div style={overlayStyle}>
      <form style={dialogStyle} onSubmit={handleSubmit}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>New Session</h2>
        <label style={labelStyle} htmlFor="session-name">
          Name
          <input id="session-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required autoFocus />
        </label>
        <label style={labelStyle} htmlFor="agent-type">
          Agent
          <select id="agent-type" aria-label="Agent" style={inputStyle} value={agentType} onChange={e => setAgentType(e.target.value as Session['agentType'])}>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="cursor">Cursor</option>
            <option value="shell">Shell</option>
          </select>
        </label>
        <label style={labelStyle} htmlFor="cwd">
          Working Directory
          <div style={{ display: 'flex', gap: '6px' }}>
            <input id="cwd" aria-label="Working Directory" style={cwdInputStyle} value={cwd} onChange={e => setCwd(e.target.value)} />
            <button type="button" onClick={handleBrowse} style={{ ...inputStyle, cursor: 'pointer', whiteSpace: 'nowrap' }}>Browse</button>
          </div>
          {cwdValid === false && <span style={{ color: '#e05252', fontSize: '12px' }}>Directory not found</span>}
        </label>
        <label style={labelStyle} htmlFor="sprite-select">
          Sprite <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span>
          <select id="sprite-select" aria-label="Sprite" style={inputStyle} value={selectedSpriteId} onChange={e => setSelectedSpriteId(e.target.value)}>
            <option value="">None</option>
            {sprites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ ...inputStyle, background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>Create</button>
        </div>
      </form>
    </div>
  )
}

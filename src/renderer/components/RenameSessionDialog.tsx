import React, { useState } from 'react'

interface Props {
  initialName: string
  onRename: (newName: string) => void
  onCancel: () => void
}

export function RenameSessionDialog({ initialName, onRename, onCancel }: Props) {
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onRename(name.trim())
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

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <form style={dialogStyle} onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Rename Session</h2>
        <label style={labelStyle} htmlFor="rename-input">
          New Name
          <input 
            id="rename-input"
            style={inputStyle} 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            autoFocus 
            onFocus={e => e.target.select()}
          />
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ ...inputStyle, background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>Rename</button>
        </div>
      </form>
    </div>
  )
}

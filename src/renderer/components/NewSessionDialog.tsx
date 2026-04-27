import React, { useState } from 'react'
import type { CreateSessionOptions, Session } from '../types/ipc'

interface Props {
  onCreate: (options: CreateSessionOptions) => void
  onCancel: () => void
}

export function NewSessionDialog({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('')
  const [agentType, setAgentType] = useState<Session['agentType']>('shell')
  const [cwd, setCwd] = useState(typeof process !== 'undefined' ? (process.env.HOME || '/') : '/')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, agentType, cwd })
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: '#2d2d2d', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '360px',
  }
  const labelStyle: React.CSSProperties = { color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }
  const inputStyle: React.CSSProperties = { background: '#1e1e1e', color: '#eee', border: '1px solid #555', borderRadius: '4px', padding: '6px 8px' }

  return (
    <div style={overlayStyle}>
      <form style={dialogStyle} onSubmit={handleSubmit}>
        <h2 style={{ color: '#eee', margin: 0 }}>New Session</h2>
        <label style={labelStyle} htmlFor="session-name">
          Name
          <input id="session-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
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
          <input id="cwd" aria-label="Working Directory" style={inputStyle} value={cwd} onChange={e => setCwd(e.target.value)} required />
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ ...inputStyle, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ ...inputStyle, background: '#0e639c', cursor: 'pointer' }}>Create</button>
        </div>
      </form>
    </div>
  )
}

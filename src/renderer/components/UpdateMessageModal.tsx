import React from 'react'

interface Props {
  version: string
  features: string[]
  onClose: () => void
}

export function UpdateMessageModal({ version, features, onClose }: Props) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  }
  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-header)', padding: '32px', borderRadius: '12px',
    display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    border: '1px solid var(--accent)',
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--accent)', margin: '0 0 8px 0' }}>Welcome to Overseer v{version}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Latest features and improvements:</p>
        </div>
        
        <ul style={{ 
          color: 'var(--text-main)', 
          fontSize: '15px', 
          lineHeight: '1.5',
          paddingLeft: '20px',
          margin: 0,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {features.map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
        </ul>

        <button 
          onClick={onClose}
          style={{ 
            background: 'var(--accent)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '12px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}

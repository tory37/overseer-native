import React, { useEffect, useState } from 'react'
import { UpdateStatus } from '../types/ipc'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ type: 'idle' })

  useEffect(() => {
    return window.overseer.updateStatus((s) => setStatus(s))
  }, [])

  if (status.type === 'idle' || status.type === 'checking' || status.type === 'error') return null

  return (
    <div style={{ 
      background: 'var(--accent)', 
      color: '#fff', 
      padding: '8px 16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      fontSize: 13,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <span style={{ fontWeight: 500 }}>
          {status.type === 'available' && `New version ${status.version} available. Downloading...`}
          {status.type === 'downloading' && `Downloading update: ${Math.round(status.percent)}%`}
          {status.type === 'downloaded' && `Version ${status.version} ready to install.`}
        </span>
        
        {status.type === 'downloading' && (
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, maxWidth: 200, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${status.percent}%`, background: '#fff' }} />
          </div>
        )}
      </div>

      {status.type === 'downloaded' && (
        <button 
          onClick={() => window.overseer.updateInstall()}
          style={{ 
            background: '#fff', 
            color: 'var(--accent)', 
            border: 'none', 
            padding: '4px 12px', 
            borderRadius: 4, 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: 12,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Restart to Update
        </button>
      )}
    </div>
  )
}

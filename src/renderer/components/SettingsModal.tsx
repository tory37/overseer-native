import React, { useEffect, useState } from 'react'
import type { DriftStatus, SyncResult } from '../types/ipc'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<DriftStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    window.overseer.syncStatus().then(setStatus)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setLastResult(null)
    const result = await window.overseer.syncRun()
    setLastResult(result)
    if (result.ok) {
      const updated = await window.overseer.syncStatus()
      setStatus(updated)
    }
    setSyncing(false)
  }

  const formatTimestamp = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : 'Never'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 480, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Settings</h2>
          <button
            title="Close settings"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px', color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Sync</h3>
          <div style={{ borderTop: '1px solid #444', paddingTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              Last synced: {status ? formatTimestamp(status.lastSyncedAt) : '…'}
            </div>
            {status && (
              <>
                <div style={{ marginBottom: 4 }}>
                  Rules: {status.rules.length} changed
                  {status.rules.length > 0 && (
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      ({status.rules.join(', ')})
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  Skills: {status.skills.length} changed
                  {status.skills.length > 0 && (
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      ({status.skills.join(', ')})
                    </span>
                  )}
                </div>
              </>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ background: '#0e639c', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            {lastResult && !lastResult.ok && (
              <pre style={{ marginTop: 12, padding: 8, background: '#1e1e1e', border: '1px solid #c00', borderRadius: 4, color: '#f88', fontSize: 11, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>
                {lastResult.output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

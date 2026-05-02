import React, { useEffect, useState } from 'react'
import { matchKeybinding } from '../types/ipc'
import type { DriftStatus, SyncResult, Keybindings, UpdateStatus } from '../types/ipc'
import { useThemeStore, BUILTIN_THEMES } from '../store/theme'

interface Props {
  onClose: () => void
  keybindings: Keybindings
}

export function SettingsModal({ onClose, keybindings }: Props) {
  const { isDev, openDataFolder, clearAndRestart } = window.overseer || {}
  const { activeThemeId, customThemes, setActiveTheme } = useThemeStore()
  const allThemes = [...BUILTIN_THEMES, ...customThemes]

  const [status,     setStatus]     = useState<DriftStatus | null>(null)
  const [syncing,    setSyncing]    = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  const [updateStatus,    setUpdateStatus]    = useState<UpdateStatus>({ type: 'idle' })

  useEffect(() => {
    window.overseer?.syncStatus?.().then(setStatus)
    return window.overseer?.updateStatus?.(setUpdateStatus)
  }, [])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      
      const action = matchKeybinding(keybindings, e)
      if (action === 'openSettings') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [onClose, keybindings])

  const handleSync = async () => {
    if (!window.overseer?.syncRun) return
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

  const handleCheckUpdates = async () => {
    await window.overseer?.updateCheck?.()
  }

  const formatTimestamp = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : 'Never'

  const sectionHeading: React.CSSProperties = {
    margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
  }
  const divider: React.CSSProperties = { borderTop: '1px solid var(--border)', paddingTop: 12 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-header)', color: 'var(--text-main)', borderRadius: 8, padding: 24, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: 18 }}>Settings</h2>
          <button
            title="Close settings"
            onClick={onClose}
            autoFocus
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={sectionHeading}>Appearance</h3>
          <div style={divider}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 13, color: 'var(--text-main)' }}>Theme</label>
              <select
                value={activeThemeId}
                onChange={(e) => setActiveTheme(e.target.value)}
                style={{
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 14,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {allThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={sectionHeading}>Sync</h3>
          <div style={divider}>
            <div style={{ marginBottom: 8 }}>
              Last synced: {status ? formatTimestamp(status.lastSyncedAt) : '…'}
            </div>
            {status && (
              <>
                <div style={{ marginBottom: 4 }}>
                  Rules: {status.rules.length} changed
                  {status.rules.length > 0 && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                      ({status.rules.join(', ')})
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  Skills: {status.skills.length} changed
                  {status.skills.length > 0 && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                      ({status.skills.join(', ')})
                    </span>
                  )}
                </div>
              </>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            {lastResult && !lastResult.ok && (
              <pre style={{ marginTop: 12, padding: 8, background: 'var(--bg-main)', border: '1px solid #c00', borderRadius: 4, color: '#f88', fontSize: 11, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>
                {lastResult.output}
              </pre>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={sectionHeading}>Updates</h3>
          <div style={divider}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleCheckUpdates}
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
              >
                Check for Updates
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {updateStatus.type === 'checking' && 'Checking...'}
                {updateStatus.type === 'idle' && 'App is up to date.'}
                {updateStatus.type === 'error' && `Error: ${updateStatus.message}`}
                {updateStatus.type === 'available' && `Update ${updateStatus.version} found!`}
                {updateStatus.type === 'downloading' && `Downloading... ${Math.round(updateStatus.percent)}%`}
                {updateStatus.type === 'downloaded' && `Version ${updateStatus.version} ready.`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={sectionHeading}>Data Management</h3>
          <div style={divider}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => openDataFolder?.()}
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
              >
                Open Data Folder
              </button>
              {isDev && (
                <button
                  onClick={() => { if (confirm('Clear ALL data and restart?')) clearAndRestart?.() }}
                  style={{ background: 'rgba(255, 0, 0, 0.1)', color: '#f88', border: '1px solid #c00', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Clear & Restart (Dev Only)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

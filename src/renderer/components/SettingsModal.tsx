import React, { useEffect, useState } from 'react'
import { formatKeybinding, matchKeybinding } from '../types/ipc'
import type { DriftStatus, SyncResult, Keybindings, KeybindingAction, UpdateStatus } from '../types/ipc'
import { useThemeStore, BUILTIN_THEMES } from '../store/theme'

const ACTION_LABELS: Record<string, string> = {
  newSession:       'New Session',
  killSession:      'Kill Active Session',
  nextSession:      'Next Session',
  prevSession:      'Previous Session',
  sessionByIndex1:  'Switch to Session 1',
  sessionByIndex2:  'Switch to Session 2',
  sessionByIndex3:  'Switch to Session 3',
  sessionByIndex4:  'Switch to Session 4',
  sessionByIndex5:  'Switch to Session 5',
  sessionByIndex6:  'Switch to Session 6',
  sessionByIndex7:  'Switch to Session 7',
  sessionByIndex8:  'Switch to Session 8',
  sessionByIndex9:  'Switch to Session 9',
  openDrawer:       'Open Session List',
  openSettings:     'Open Settings',
  openShortcuts:    'Show Keyboard Shortcuts',
  splitFocus:       'Focus Next Pane',
  splitFocusPrev:   'Focus Prev Pane',
  splitOpenThreeWay: 'Open 3-Way Split',
  splitClose:       'Close Active Pane',
  splitSwap:        'Swap Panes',
  splitSwapSecondary: 'Swap Secondary Panes',
  splitToggleDirection: 'Toggle Split Dir',
  toggleSpritePanel: 'Toggle Sprite Panel',
  openSpriteStudio: 'Open Sprite Studio',
}

interface Props {
  onClose: () => void
  keybindings: Keybindings
  onSaveKeybindings: (kb: Keybindings) => Promise<void>
}

export function SettingsModal({ onClose, keybindings, onSaveKeybindings }: Props) {
  const { isDev, openDataFolder, clearAndRestart } = window.overseer || {}
  const { activeThemeId, customThemes, setActiveTheme } = useThemeStore()
  const allThemes = [...BUILTIN_THEMES, ...customThemes]

  const [status,     setStatus]     = useState<DriftStatus | null>(null)
  const [syncing,    setSyncing]    = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  const [pendingKb,       setPendingKb]       = useState<Keybindings>(() => keybindings)
  const [capturingAction, setCapturingAction] = useState<KeybindingAction | null>(null)
  const [savingKb,        setSavingKb]        = useState(false)
  const [updateStatus,    setUpdateStatus]    = useState<UpdateStatus>({ type: 'idle' })

  const isKbDirty = JSON.stringify(pendingKb) !== JSON.stringify(keybindings)

  useEffect(() => {
    window.overseer?.syncStatus?.().then(setStatus)
    return window.overseer?.updateStatus?.(setUpdateStatus)
  }, [])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (capturingAction) return
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      
      const action = matchKeybinding(keybindings, e)
      if (action === 'openSettings') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [onClose, capturingAction, keybindings])

  useEffect(() => {
    if (!capturingAction) return
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.key === 'Escape') { setCapturingAction(null); return }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      setPendingKb(prev => ({
        ...prev,
        [capturingAction]: { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey },
      }))
      setCapturingAction(null)
    }
    window.addEventListener('keydown', handleCapture, { capture: true })
    return () => window.removeEventListener('keydown', handleCapture, { capture: true })
  }, [capturingAction])

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

  const handleSaveKb = async () => {
    setSavingKb(true)
    await onSaveKeybindings(pendingKb)
    setSavingKb(false)
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

        <div>
          <h3 style={sectionHeading}>Shortcuts</h3>
          <div style={divider}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <tbody>
                {(Object.entries(pendingKb) as [KeybindingAction, Keybindings[KeybindingAction]][]).map(([action, kb]) => (
                  <tr key={action} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 0', color: 'var(--text-main)', fontSize: 13 }}>{ACTION_LABELS[action] ?? action}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>
                      {capturingAction === action ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Press keys…</span>
                      ) : (
                        <kbd style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {formatKeybinding(kb)}
                        </kbd>
                      )}
                    </td>
                    <td style={{ padding: '6px 0 6px 8px' }}>
                      <button
                        onClick={() => setCapturingAction(action)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Set
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isKbDirty && (
              <button
                onClick={handleSaveKb}
                disabled={savingKb}
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: savingKb ? 'wait' : 'pointer', opacity: savingKb ? 0.7 : 1 }}
              >
                {savingKb ? 'Saving…' : 'Save Shortcuts'}
              </button>
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

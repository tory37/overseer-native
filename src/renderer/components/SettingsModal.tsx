import React, { useEffect, useState } from 'react'
import { formatKeybinding } from '../types/ipc'
import type { DriftStatus, SyncResult, Keybindings, KeybindingAction } from '../types/ipc'

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
}

interface Props {
  onClose: () => void
  keybindings: Keybindings
  onSaveKeybindings: (kb: Keybindings) => Promise<void>
}

export function SettingsModal({ onClose, keybindings, onSaveKeybindings }: Props) {
  const [status,     setStatus]     = useState<DriftStatus | null>(null)
  const [syncing,    setSyncing]    = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  const [pendingKb,       setPendingKb]       = useState<Keybindings>(() => keybindings)
  const [capturingAction, setCapturingAction] = useState<KeybindingAction | null>(null)
  const [savingKb,        setSavingKb]        = useState(false)

  const isKbDirty = JSON.stringify(pendingKb) !== JSON.stringify(keybindings)

  useEffect(() => {
    window.overseer.syncStatus().then(setStatus)
  }, [])

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

  const formatTimestamp = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : 'Never'

  const sectionHeading: React.CSSProperties = {
    margin: '0 0 12px', color: '#aaa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
  }
  const divider: React.CSSProperties = { borderTop: '1px solid #444', paddingTop: 12 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Settings</h2>
          <button
            title="Close settings"
            onClick={onClose}
            autoFocus
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
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

        <div>
          <h3 style={sectionHeading}>Shortcuts</h3>
          <div style={divider}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <tbody>
                {(Object.entries(pendingKb) as [KeybindingAction, Keybindings[KeybindingAction]][]).map(([action, kb]) => (
                  <tr key={action} style={{ borderBottom: '1px solid #3a3a3a' }}>
                    <td style={{ padding: '6px 0', color: '#ccc', fontSize: 13 }}>{ACTION_LABELS[action] ?? action}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>
                      {capturingAction === action ? (
                        <span style={{ color: '#888', fontSize: 12 }}>Press keys…</span>
                      ) : (
                        <kbd style={{ background: '#1e1e1e', border: '1px solid #555', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#eee', fontFamily: 'monospace' }}>
                          {formatKeybinding(kb)}
                        </kbd>
                      )}
                    </td>
                    <td style={{ padding: '6px 0 6px 8px' }}>
                      <button
                        onClick={() => setCapturingAction(action)}
                        style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
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
                style={{ background: '#0e639c', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: savingKb ? 'wait' : 'pointer', opacity: savingKb ? 0.7 : 1 }}
              >
                {savingKb ? 'Saving…' : 'Save Shortcuts'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

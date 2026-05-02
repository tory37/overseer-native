import React, { useEffect, useState, useMemo } from 'react'
import { formatKeybinding, ACTION_LABELS } from '../types/ipc'
import type { Keybindings, KeybindingAction } from '../types/ipc'

interface Props {
  keybindings: Keybindings
  onClose: () => void
  onSaveKeybindings: (kb: Keybindings) => Promise<void>
}

const GROUPS: { title: string, actions: KeybindingAction[] }[] = [
  {
    title: 'SESSIONS',
    actions: [
      'newSession', 'killSession', 'nextSession', 'prevSession',
      'sessionByIndex1', 'sessionByIndex2', 'sessionByIndex3',
      'sessionByIndex4', 'sessionByIndex5', 'sessionByIndex6',
      'sessionByIndex7', 'sessionByIndex8', 'sessionByIndex9'
    ]
  },
  {
    title: 'PANES',
    actions: [
      'splitFocus', 'splitFocusPrev', 'splitOpenThreeWay', 'splitClose',
      'splitSwap', 'splitSwapSecondary', 'splitToggleDirection'
    ]
  },
  {
    title: 'GENERAL',
    actions: ['openDrawer', 'openSettings', 'openShortcuts']
  },
  {
    title: 'SPRITE',
    actions: ['toggleSpritePanel', 'openSpriteStudio']
  }
]

export function KeyboardShortcutsModal({ keybindings, onClose, onSaveKeybindings }: Props) {
  const [pendingKb, setPendingKb] = useState<Keybindings>(keybindings)
  const [capturingAction, setCapturingAction] = useState<KeybindingAction | null>(null)
  const [savingKb, setSavingKb] = useState(false)

  const isKbDirty = useMemo(() => JSON.stringify(pendingKb) !== JSON.stringify(keybindings), [pendingKb, keybindings])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (capturingAction) return // Ignore global Escape if we are capturing
      if (e.key === 'Escape' || e.key === '/') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, capturingAction])

  const handleSave = async () => {
    setSavingKb(true)
    try {
      await onSaveKeybindings(pendingKb)
    } finally {
      setSavingKb(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-header)', color: 'var(--text-main)', borderRadius: 8, padding: 24, width: 900, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: 20 }}>Keyboard Shortcuts</h2>
          <button
            title="Close"
            onClick={onClose}
            autoFocus
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {GROUPS.map(group => (
            <div key={group.title}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                {group.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.actions.map(action => {
                  const kb = pendingKb[action]
                  if (!kb) return null
                  const isCapturing = capturingAction === action
                  return (
                    <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{ACTION_LABELS[action] ?? action}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCapturing ? (
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'bold' }}>Press keys...</span>
                        ) : (
                          <kbd style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text-main)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {formatKeybinding(kb)}
                          </kbd>
                        )}
                        <button
                          onClick={() => setCapturingAction(isCapturing ? null : action)}
                          style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {isCapturing ? 'Cancel' : 'Set'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {isKbDirty && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              onClick={() => setPendingKb(keybindings)}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer' }}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={savingKb}
              style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 24px', borderRadius: 4, cursor: 'pointer', opacity: savingKb ? 0.7 : 1 }}
            >
              {savingKb ? 'Saving...' : 'Save Shortcuts'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

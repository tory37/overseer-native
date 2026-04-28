import React, { useEffect } from 'react'
import { formatKeybinding } from '../types/ipc'
import type { Keybindings } from '../types/ipc'

interface Props {
  keybindings: Keybindings
  onClose: () => void
}

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
  openDrawer:           'Open Session List',
  openSettings:         'Open Settings',
  openShortcuts:        'Show Keyboard Shortcuts',
  splitFocus:           'Open / Focus Next Pane',
  splitFocusPrev:       'Focus Previous Pane',
  splitOpenThreeWay:    'Open 3-Way Split',
  splitClose:           'Close Focused Pane',
  splitSwap:            'Swap Main / Secondary Columns',
  splitSwapSecondary:   'Swap Companion Panes (3-way)',
  splitToggleDirection: 'Toggle Split Direction',
}

export function KeyboardShortcutsModal({ keybindings, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 500, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Keyboard Shortcuts</h2>
          <button
            title="Close"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {(Object.entries(keybindings) as [string, Keybindings[keyof Keybindings]][]).map(([action, kb]) => (
              <tr key={action} style={{ borderBottom: '1px solid #3a3a3a' }}>
                <td style={{ padding: '8px 0', color: '#ccc' }}>{ACTION_LABELS[action] ?? action}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <kbd style={{ background: '#1e1e1e', border: '1px solid #555', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#eee', fontFamily: 'monospace' }}>
                    {formatKeybinding(kb)}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React, { useEffect } from 'react'
import { formatKeybinding } from '../types/ipc'
import type { Keybindings, KeybindingAction } from '../types/ipc'

interface Props {
  keybindings: Keybindings
  onClose: () => void
}

const ACTION_LABELS: Record<string, string> = {
  newSession:       'New Session',
  killSession:      'Delete Active Session',
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
  }
]

export function KeyboardShortcutsModal({ keybindings, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '/') { e.preventDefault(); onClose() }
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
        style={{ background: '#2d2d2d', color: '#ccc', borderRadius: 8, padding: 24, width: 900, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 20 }}>Keyboard Shortcuts</h2>
          <button
            title="Close"
            onClick={onClose}
            autoFocus
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {GROUPS.map(group => (
            <div key={group.title}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid #3a3a3a', paddingBottom: 8 }}>
                {group.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.actions.map(action => {
                  const kb = keybindings[action]
                  if (!kb) return null
                  return (
                    <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: 13, color: '#ccc' }}>{ACTION_LABELS[action] ?? action}</span>
                      <kbd style={{ background: '#1e1e1e', border: '1px solid #555', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#eee', fontFamily: 'monospace', marginLeft: 8, whiteSpace: 'nowrap' }}>
                        {formatKeybinding(kb)}
                      </kbd>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

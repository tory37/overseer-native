import React from 'react'
import { GitPanel } from './GitPanel'
import type { Session } from '../types/ipc'

// SPRITE SYSTEM SUPPRESSED: SpritePanel import and rendering removed.
// GitPanel now occupies full sidebar height. See feat/sprite-suppression.

interface Props {
  activeSession: Session | undefined
}

export function RightSidebar({ activeSession }: Props) {
  if (!activeSession) return null

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <GitPanel cwd={activeSession.cwd} />
    </div>
  )
}

import React from 'react'
import { GitPanel } from './GitPanel'
import { SpritePanel } from './SpritePanel'
import type { Session } from '../types/ipc'

interface Props {
  activeSession: Session | undefined
  spritePanelVisible: boolean
  onOpenStudio: () => void
}

export function RightSidebar({ activeSession, spritePanelVisible, onOpenStudio }: Props) {
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
      <SpritePanel
        sessionId={activeSession.id}
        spriteId={activeSession.spriteId ?? null}
        animationState="idle"
        visible={spritePanelVisible}
        onOpenStudio={onOpenStudio}
      />
    </div>
  )
}

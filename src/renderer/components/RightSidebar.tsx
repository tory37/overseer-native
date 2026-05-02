import React from 'react'
import { ToolContainer } from './ToolContainer'
import { SpritePanel } from './SpritePanel'
import type { Session } from '../types/ipc'
import type { ToolContext } from '../hooks/usePlugins'

interface Props {
  activeSession: Session | undefined
  spritePanelVisible: boolean
  onOpenStudio: () => void
}

export function RightSidebar({ activeSession, spritePanelVisible, onOpenStudio }: Props) {
  if (!activeSession) return null

  const context: ToolContext = {
    version: 1,
    cwd: activeSession.cwd,
    sessionId: activeSession.id,
  }

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ToolContainer context={context} />
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

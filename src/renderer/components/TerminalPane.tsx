import React, { useRef } from 'react'
import { TerminalInstance } from './TerminalInstance'
import { CompanionTerminal } from './CompanionTerminal'
import type { Session, Keybindings, Theme } from '../types/ipc'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  activeTheme: Theme
  keybindings: Keybindings
  allCompanions:  Array<{ sessionId: string; companionId: string }>
  allCompanionsB: Array<{ sessionId: string; companionId: string }>
  splitOpen: boolean
  threeWayOpen: boolean
  splitDirection: 'horizontal' | 'vertical'
  splitSwapped: boolean
  secondarySwapped: boolean
  splitFocused: 'main' | 'companionA' | 'companionB'
  outerSplitRatio: number
  innerSplitRatio: number
  onOuterRatio: (r: number) => void
  onInnerRatio: (r: number) => void
  onFocusPane: (which: 'main' | 'companionA' | 'companionB') => void
}

function DragHandle({
  direction,
  onRatio,
  containerRef,
  flipped = false,
  order,
}: {
  direction: 'horizontal' | 'vertical'
  onRatio: (r: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  flipped?: boolean
  order?: number
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const onMouseMove = (me: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      let raw = direction === 'horizontal'
        ? (me.clientX - rect.left) / rect.width
        : (me.clientY - rect.top) / rect.height
      if (flipped) raw = 1 - raw
      onRatio(Math.min(0.9, Math.max(0.1, raw)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const isHoriz = direction === 'horizontal'
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: isHoriz ? '5px' : '100%',
        height: isHoriz ? '100%' : '5px',
        background: '#555',
        flexShrink: 0,
        cursor: isHoriz ? 'col-resize' : 'row-resize',
        zIndex: 1,
        ...(order !== undefined ? { order } : {}),
      }}
    />
  )
}

export function TerminalPane({
  sessions, activeSessionId, activeTheme, keybindings,
  allCompanions, allCompanionsB,
  splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
  splitFocused, outerSplitRatio, innerSplitRatio,
  onOuterRatio, onInnerRatio, onFocusPane,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const isRow = splitDirection === 'horizontal'
  const activeCompanionAId = allCompanions.find(c => c.sessionId === activeSessionId)?.companionId ?? null
  const activeCompanionBId = allCompanionsB.find(c => c.sessionId === activeSessionId)?.companionId ?? null
  const showCompanion = splitOpen && (!!activeCompanionAId || !!activeCompanionBId)

  const sessionStack = sessions.map(session => {
    const isVisible = session.id === activeSessionId
    return (
      <div
        key={session.id}
        style={{ position: 'absolute', inset: 0, display: isVisible ? 'block' : 'none' }}
      >
        <TerminalInstance
          session={session}
          focused={splitFocused === 'main' && isVisible}
          visible={isVisible}
          keybindings={keybindings}
          activeTheme={activeTheme}
        />
      </div>
    )
  })

  const companionAStack = allCompanions.map(({ sessionId, companionId }) => {
    const isVisible = sessionId === activeSessionId
    return (
      <div
        key={companionId}
        style={{ position: 'absolute', inset: 0, display: isVisible ? 'block' : 'none' }}
      >
        <CompanionTerminal
          companionId={companionId}
          focused={splitFocused === 'companionA' && isVisible}
          visible={isVisible}
          keybindings={keybindings}
          activeTheme={activeTheme}
        />
      </div>
    )
  })

  const companionBStack = allCompanionsB.map(({ sessionId, companionId }) => {
    const isVisible = threeWayOpen && sessionId === activeSessionId
    return (
      <div
        key={companionId}
        style={{ position: 'absolute', inset: 0, display: isVisible ? 'block' : 'none' }}
      >
        <CompanionTerminal
          companionId={companionId}
          focused={splitFocused === 'companionB' && isVisible}
          visible={isVisible}
          keybindings={keybindings}
          activeTheme={activeTheme}
        />
      </div>
    )
  })

  const mainFlex      = showCompanion ? `0 0 ${outerSplitRatio * 100}%`       : '1'
  const secondaryFlex = showCompanion ? `0 0 ${(1 - outerSplitRatio) * 100}%` : '0'
  const companionAFlex = threeWayOpen ? `0 0 ${innerSplitRatio * 100}%`       : '1'
  const companionBFlex = threeWayOpen ? `0 0 ${(1 - innerSplitRatio) * 100}%` : '0'

  // Always use the same flex structure so sessionStack's wrapper never changes
  // position in the React tree (avoids remounting xterm on layout changes).
  return (
    <div ref={outerRef} style={{ flex: 1, display: 'flex', flexDirection: isRow ? 'row' : 'column', background: 'var(--bg-main)' }}>
      {/* Main panel */}
      <div 
        onClick={() => onFocusPane('main')} 
        style={{ 
          flex: mainFlex, 
          position: 'relative', 
          overflow: 'hidden', 
          order: splitSwapped ? 2 : 0,
        }}
      >
        {sessionStack}
      </div>

      {/* Outer drag handle — only when companion is visible */}
      {showCompanion && (
        <DragHandle
          direction={splitDirection}
          onRatio={onOuterRatio}
          containerRef={outerRef}
          flipped={splitSwapped}
        />
      )}

      {/* Secondary column */}
      <div
        ref={innerRef}
        style={{
          flex: secondaryFlex,
          display: showCompanion ? 'flex' : 'none',
          flexDirection: isRow ? 'column' : 'row',
          overflow: 'hidden',
          order: splitSwapped ? 0 : 2,
        }}
      >
        {/* CompanionA pane */}
        <div 
          onClick={() => onFocusPane('companionA')} 
          style={{ 
            flex: companionAFlex, 
            position: 'relative', 
            overflow: 'hidden', 
            order: secondarySwapped ? 2 : 0,
          }}
        >
          {companionAStack}
        </div>

        {/* Inner drag handle — only in 3-way mode */}
        {threeWayOpen && (
          <DragHandle
            direction={isRow ? 'vertical' : 'horizontal'}
            onRatio={onInnerRatio}
            containerRef={innerRef}
            flipped={secondarySwapped}
            order={1}
          />
        )}

        {/* CompanionB pane */}
        <div onClick={() => onFocusPane('companionB')} style={{
          flex: companionBFlex,
          position: 'relative',
          overflow: 'hidden',
          order: secondarySwapped ? 0 : 2,
          display: threeWayOpen ? undefined : 'none',
        }}>
          {companionBStack}
        </div>
      </div>
    </div>
  )
}

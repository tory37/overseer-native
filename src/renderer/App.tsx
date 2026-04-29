import React, { useEffect, useState } from 'react'
import { useSessionStore } from './store/sessions'
import { TabBar } from './components/TabBar'
import { TerminalPane } from './components/TerminalPane'
import { RightSidebar } from './components/RightSidebar'
import { SpriteStudio } from './components/SpriteStudio'
import { NewSessionDialog } from './components/NewSessionDialog'
import { SessionDrawer } from './components/SessionDrawer'
import { SettingsModal } from './components/SettingsModal'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCompanion } from './hooks/useCompanion'
import { useThemeStore, BUILTIN_THEMES } from './store/theme'
import { useSpritesStore } from './store/sprites'
import type { CreateSessionOptions } from './types/ipc'

export default function App() {
  const { sessions, activeSessionId, load, createSession, killSession, setActive } = useSessionStore()
  const { activeThemeId, customThemes, loadSettings: loadThemeSettings } = useThemeStore()
  const { loadSprites } = useSpritesStore()

  const [showNewDialog,      setShowNewDialog]      = useState(false)
  const [showDrawer,         setShowDrawer]          = useState(false)
  const [showSettings,       setShowSettings]        = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [confirmKillId,      setConfirmKillId]      = useState<string | null>(null)
  const [showSpriteStudio,   setShowSpriteStudio]   = useState(false)
  const [spriteStudioEditId, setSpriteStudioEditId] = useState<string | null>(null)
  const [spritePanelVisible, setSpritePanelVisible] = useState(true)

  useEffect(() => { load(); loadThemeSettings(); loadSprites() }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const activeTheme = [...BUILTIN_THEMES, ...customThemes].find(t => t.id === activeThemeId) || BUILTIN_THEMES[0]

  useEffect(() => {
    Object.entries(activeTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
  }, [activeTheme])

  useEffect(() => {
    if (confirmKillId) {
      const timer = setTimeout(() => setConfirmKillId(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [confirmKillId])

  const handleNextSession = () => {
    if (sessions.length === 0) return
    const idx = sessions.findIndex(s => s.id === activeSessionId)
    setActive(sessions[(idx + 1) % sessions.length].id)
  }

  const handlePrevSession = () => {
    if (sessions.length === 0) return
    const idx = sessions.findIndex(s => s.id === activeSessionId)
    setActive(sessions[(idx - 1 + sessions.length) % sessions.length].id)
  }

  const handleSessionByIndex = (index: number) => {
    const session = sessions[index - 1]
    if (session) setActive(session.id)
  }

  const {
    allCompanions, allCompanionsB,
    splitOpen, threeWayOpen, splitDirection, splitSwapped, secondarySwapped,
    splitFocused, outerSplitRatio, innerSplitRatio,
    onSplitFocus, onSplitFocusPrev, onSplitSwap, onSplitSwapSecondary,
    onSplitToggleDirection, onSplitOpenThreeWay, onSplitClose,
    onOuterRatio, onInnerRatio,
    killCompanionForSession, onSetSplitFocused,
  } = useCompanion(activeSession)

  const handleKillActive = () => {
    if (!activeSessionId) return
    if (confirmKillId === activeSessionId) {
      killCompanionForSession(activeSessionId)
      killSession(activeSessionId).catch(console.error)
      setConfirmKillId(null)
    } else {
      setConfirmKillId(activeSessionId)
    }
  }

  const { keybindings, updateKeybindings } = useKeyboardShortcuts({
    onNewSession:           () => setShowNewDialog(true),
    onKillSession:          handleKillActive,
    onNextSession:          handleNextSession,
    onPrevSession:          handlePrevSession,
    onSessionByIndex:       handleSessionByIndex,
    onOpenDrawer:           () => setShowDrawer(prev => !prev),
    onOpenSettings:         () => setShowSettings(prev => !prev),
    onOpenShortcuts:        () => setShowShortcutsModal(prev => !prev),
    onSplitFocus,
    onSplitFocusPrev,
    onSplitOpenThreeWay,
    onSplitClose,
    onSplitSwap,
    onSplitSwapSecondary,
    onSplitToggleDirection,
    onToggleSpritePanel: () => setSpritePanelVisible(v => !v),
    onOpenSpriteStudio:  () => setShowSpriteStudio(prev => {
      if (!prev) setSpriteStudioEditId(null)
      return !prev
    }),
  })

  const handleCreate = async (options: CreateSessionOptions) => {
    await createSession(options)
    setShowNewDialog(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-header)' }}>
        <button
          onClick={() => setShowDrawer(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}
          title="All sessions"
        >
          ☰
        </button>
        <TabBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          confirmKillId={confirmKillId}
          onSelect={setActive}
          onNew={() => setShowNewDialog(true)}
        />
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', marginLeft: 'auto' }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TerminalPane
          sessions={sessions}
          activeSessionId={activeSessionId}
          activeTheme={activeTheme}
          keybindings={keybindings}
          allCompanions={allCompanions}
          allCompanionsB={allCompanionsB}
          splitOpen={splitOpen}
          threeWayOpen={threeWayOpen}
          splitDirection={splitDirection}
          splitSwapped={splitSwapped}
          secondarySwapped={secondarySwapped}
          splitFocused={splitFocused}
          outerSplitRatio={outerSplitRatio}
          innerSplitRatio={innerSplitRatio}
          onOuterRatio={onOuterRatio}
          onInnerRatio={onInnerRatio}
          onFocusPane={onSetSplitFocused}
        />
        <RightSidebar
          activeSession={activeSession}
          spritePanelVisible={spritePanelVisible}
          onOpenStudio={() => { setSpriteStudioEditId(null); setShowSpriteStudio(true) }}
        />
      </div>

      {showNewDialog && (
        <NewSessionDialog
          onCreate={handleCreate}
          onCancel={() => setShowNewDialog(false)}
        />
      )}

      {showDrawer && (
        <SessionDrawer
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActive}
          onKill={async (id) => { try { await killSession(id) } catch (err) { console.error('kill session failed:', err) } }}
          onClose={() => setShowDrawer(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          keybindings={keybindings}
          onSaveKeybindings={updateKeybindings}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal
          keybindings={keybindings}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {showSpriteStudio && (
        <SpriteStudio
          onClose={() => setShowSpriteStudio(false)}
          editingId={spriteStudioEditId}
        />
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useSessionStore } from './store/sessions'
import { TabBar } from './components/TabBar'
import { TerminalPane } from './components/TerminalPane'
import { GitPanel } from './components/GitPanel'
import { NewSessionDialog } from './components/NewSessionDialog'
import { SessionDrawer } from './components/SessionDrawer'
import { SettingsModal } from './components/SettingsModal'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCompanion } from './hooks/useCompanion'
import type { CreateSessionOptions } from './types/ipc'

export default function App() {
  const { sessions, activeSessionId, load, createSession, killSession, setActive } = useSessionStore()
  const [showNewDialog,      setShowNewDialog]      = useState(false)
  const [showDrawer,         setShowDrawer]          = useState(false)
  const [showSettings,       setShowSettings]        = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  useEffect(() => { load() }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId)

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
    killCompanionForSession,
  } = useCompanion(activeSession)

  const handleKillActive = () => {
    if (activeSessionId) {
      killCompanionForSession(activeSessionId)
      killSession(activeSessionId).catch(console.error)
    }
  }

  const { keybindings, updateKeybindings } = useKeyboardShortcuts({
    onNewSession:           () => setShowNewDialog(true),
    onKillSession:          handleKillActive,
    onNextSession:          handleNextSession,
    onPrevSession:          handlePrevSession,
    onSessionByIndex:       handleSessionByIndex,
    onOpenDrawer:           () => setShowDrawer(true),
    onOpenSettings:         () => setShowSettings(true),
    onOpenShortcuts:        () => setShowShortcutsModal(true),
    onSplitFocus,
    onSplitFocusPrev,
    onSplitOpenThreeWay,
    onSplitClose,
    onSplitSwap,
    onSplitSwapSecondary,
    onSplitToggleDirection,
  })

  const handleCreate = async (options: CreateSessionOptions) => {
    await createSession(options)
    setShowNewDialog(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#2d2d2d' }}>
        <button
          onClick={() => setShowDrawer(true)}
          style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}
          title="All sessions"
        >
          ☰
        </button>
        <TabBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActive}
          onNew={() => setShowNewDialog(true)}
        />
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', marginLeft: 'auto' }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TerminalPane
          sessions={sessions}
          activeSessionId={activeSessionId}
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
        />
        {activeSession && <GitPanel cwd={activeSession.cwd} />}
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
    </div>
  )
}

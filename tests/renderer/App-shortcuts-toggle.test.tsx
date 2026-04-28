import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../../src/renderer/App'

// Mock components that use xterm
jest.mock('../../src/renderer/components/TerminalPane', () => ({
  TerminalPane: () => <div data-testid="terminal-pane" />
}))
jest.mock('../../src/renderer/components/GitPanel', () => ({
  GitPanel: () => <div data-testid="git-panel" />
}))

// Mock the window.overseer API
beforeEach(() => {
  (window as any).overseer = {
    load: jest.fn(),
    readTheme: jest.fn().mockResolvedValue({ activeThemeId: 'overseer-dark', customThemes: [] }),
    writeTheme: jest.fn().mockResolvedValue(undefined),
    readKeybindings: jest.fn().mockResolvedValue(null),
    writeKeybindings: jest.fn().mockResolvedValue(undefined),
    onPtyData: jest.fn().mockReturnValue(() => {}),
    onPtyError: jest.fn().mockReturnValue(() => {}),
    getScrollback: jest.fn().mockResolvedValue(''),
    resize: jest.fn(),
    sendInput: jest.fn(),
    onCompanionData: jest.fn().mockReturnValue(() => {}),
    onCompanionError: jest.fn().mockReturnValue(() => {}),
    onCompanionExit: jest.fn().mockReturnValue(() => {}),
    spawnCompanion: jest.fn().mockResolvedValue({ id: 'c1' }),
    killCompanion: jest.fn().mockResolvedValue(undefined),
    killSession: jest.fn().mockResolvedValue(undefined),
    listSessions: jest.fn().mockResolvedValue([]),
  }
})

test('Ctrl+Shift+Slash toggles KeyboardShortcutsModal', async () => {
  render(<App />)

  // Initially not present
  expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()

  // Press Ctrl+Shift+Slash to open
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()

  // Press Ctrl+Shift+Slash again to close
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
})

test('Slash key closes KeyboardShortcutsModal when open', async () => {
  render(<App />)

  // Open modal
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()

  // Press Slash key (without modifiers)
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', code: 'Slash', bubbles: true }))
  })
  expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument()
})

test('Ctrl+Shift+W requires two presses to kill session', async () => {
  const session = { id: 's1', name: 'Session 1', agentType: 'shell', cwd: '/', envVars: {}, scrollbackPath: '' }
  ;(window as any).overseer.listSessions.mockResolvedValue([session])

  render(<App />)

  // Wait for session to load
  await act(async () => { await Promise.resolve() })
  
  // Initial state: Session 1 is there
  expect(screen.getByText('Session 1')).toBeInTheDocument()

  // First press of Ctrl+Shift+W
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  
  // Should show confirmation text
  expect(screen.getByText('Session 1 (press again to kill)')).toBeInTheDocument()
  expect((window as any).overseer.killSession).not.toHaveBeenCalled()

  // Second press of Ctrl+Shift+W
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  
  // Should have called killSession
  expect((window as any).overseer.killSession).toHaveBeenCalledWith('s1')
})

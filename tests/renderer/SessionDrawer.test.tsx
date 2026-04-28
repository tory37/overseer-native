import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SessionDrawer } from '../../src/renderer/components/SessionDrawer'
import type { Session } from '../../src/renderer/types/ipc'

const sessions: Session[] = [
  { id: 'a', name: 'session-a', agentType: 'claude', cwd: '/tmp/a', envVars: {}, scrollbackPath: '', spriteId: null },
  { id: 'b', name: 'session-b', agentType: 'shell',  cwd: '/tmp/b', envVars: {}, scrollbackPath: '', spriteId: null },
]

test('renders all session names', () => {
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={() => {}} onClose={() => {}} />)
  expect(screen.getByText('session-a')).toBeInTheDocument()
  expect(screen.getByText('session-b')).toBeInTheDocument()
})

test('calls onSelect and onClose when a session row is clicked', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.click(screen.getByText('session-b'))
  expect(onSelect).toHaveBeenCalledWith('b')
  expect(onClose).toHaveBeenCalled()
})

test('calls onKill with session id when kill button clicked', () => {
  const onKill = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={onKill} onClose={() => {}} />)
  const killButtons = screen.getAllByTitle('Kill session')
  fireEvent.click(killButtons[0])
  expect(onKill).toHaveBeenCalledWith('a')
})

test('calls onClose when Escape pressed', () => {
  const onClose = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('Enter selects the initially focused session (index 0)', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('a')
  expect(onClose).toHaveBeenCalled()
})

test('ArrowDown moves focus to next session, Enter selects it', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('b')
})

test('ArrowUp from index 0 stays at 0', () => {
  const onSelect = jest.fn()
  const onClose  = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={onSelect} onKill={() => {}} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('a')
})

test('Delete kills the focused session', () => {
  const onKill = jest.fn()
  render(<SessionDrawer sessions={sessions} activeSessionId="a" onSelect={() => {}} onKill={onKill} onClose={() => {}} />)
  fireEvent.keyDown(window, { key: 'Delete' })
  expect(onKill).toHaveBeenCalledWith('a')
})

test('shows "No sessions yet." when empty', () => {
  render(<SessionDrawer sessions={[]} activeSessionId={null} onSelect={() => {}} onKill={() => {}} onClose={() => {}} />)
  expect(screen.getByText('No sessions yet.')).toBeInTheDocument()
})

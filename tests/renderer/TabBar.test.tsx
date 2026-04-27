import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TabBar } from '../../src/renderer/components/TabBar'
import type { Session } from '../../src/renderer/types/ipc'

const sessions: Session[] = [
  { id: 'a', name: 'claude-main', agentType: 'claude', cwd: '/tmp', envVars: {}, scrollbackPath: '' },
  { id: 'b', name: 'gemini-test', agentType: 'gemini', cwd: '/tmp', envVars: {}, scrollbackPath: '' },
]

test('renders a tab for each session', () => {
  render(<TabBar sessions={sessions} activeSessionId="a" onSelect={() => {}} onNew={() => {}} />)
  expect(screen.getByText('claude-main')).toBeInTheDocument()
  expect(screen.getByText('gemini-test')).toBeInTheDocument()
})

test('calls onSelect with session id when tab is clicked', () => {
  const onSelect = jest.fn()
  render(<TabBar sessions={sessions} activeSessionId="a" onSelect={onSelect} onNew={() => {}} />)
  fireEvent.click(screen.getByText('gemini-test'))
  expect(onSelect).toHaveBeenCalledWith('b')
})

test('calls onNew when + button is clicked', () => {
  const onNew = jest.fn()
  render(<TabBar sessions={sessions} activeSessionId="a" onSelect={() => {}} onNew={onNew} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  expect(onNew).toHaveBeenCalled()
})

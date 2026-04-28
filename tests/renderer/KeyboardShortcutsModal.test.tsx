import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyboardShortcutsModal } from '../../src/renderer/components/KeyboardShortcutsModal'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

test('renders all action labels', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} />)
  expect(screen.getByText('New Session')).toBeInTheDocument()
  expect(screen.getByText('Kill Active Session')).toBeInTheDocument()
  expect(screen.getByText('Open Settings')).toBeInTheDocument()
  expect(screen.getByText('Show Keyboard Shortcuts')).toBeInTheDocument()
})

test('renders formatted keybindings for defaults', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} />)
  expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
  expect(screen.getByText('Ctrl+Shift+,')).toBeInTheDocument()
})

test('calls onClose when close button clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(screen.getByTitle('Close'))
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when Escape pressed', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when overlay backdrop clicked', () => {
  const onClose = jest.fn()
  const { container } = render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(container.firstChild as Element)
  expect(onClose).toHaveBeenCalled()
})

test('does not call onClose when inner dialog clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} />)
  fireEvent.click(screen.getByRole('heading', { name: 'Keyboard Shortcuts' }))
  expect(onClose).not.toHaveBeenCalled()
})

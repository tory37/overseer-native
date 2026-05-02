import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyboardShortcutsModal } from '../../src/renderer/components/KeyboardShortcutsModal'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

test('auto focuses the close button on mount', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  expect(screen.getByTitle('Close')).toHaveFocus()
})

test('renders category headers', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  expect(screen.getByText('SESSIONS')).toBeInTheDocument()
  expect(screen.getByText('PANES')).toBeInTheDocument()
  expect(screen.getByText('GENERAL')).toBeInTheDocument()
})

test('renders action labels', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  expect(screen.getByText('New Session')).toBeInTheDocument()
  expect(screen.getByText('Open Settings')).toBeInTheDocument()
})

test('renders formatted keybindings for defaults', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
  expect(screen.getByText('Ctrl+Shift+,')).toBeInTheDocument()
})

test('calls onClose when close button clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} onSaveKeybindings={jest.fn()} />)
  fireEvent.click(screen.getByTitle('Close'))
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when Escape pressed', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} onSaveKeybindings={jest.fn()} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('calls onClose when overlay backdrop clicked', () => {
  const onClose = jest.fn()
  const { container } = render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} onSaveKeybindings={jest.fn()} />)
  fireEvent.click(container.firstChild as Element)
  expect(onClose).toHaveBeenCalled()
})

test('does not call onClose when inner dialog clicked', () => {
  const onClose = jest.fn()
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={onClose} onSaveKeybindings={jest.fn()} />)
  fireEvent.click(screen.getByRole('heading', { name: 'Keyboard Shortcuts' }))
  expect(onClose).not.toHaveBeenCalled()
})

test('allows capturing a new shortcut', () => {
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={jest.fn()} />)
  
  // Find "Set" button for "New Session"
  const row = screen.getByText('New Session').parentElement!
  const setButton = row.querySelector('button')!
  fireEvent.click(setButton)

  expect(screen.getByText('Press keys...')).toBeInTheDocument()

  // Simulate keydown Ctrl+Alt+K
  fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true, altKey: true, shiftKey: false })

  expect(screen.getByText('Ctrl+Alt+K')).toBeInTheDocument()
  expect(screen.getByText('Save Shortcuts')).toBeInTheDocument()
})

test('calls onSaveKeybindings when Save clicked', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined)
  render(<KeyboardShortcutsModal keybindings={DEFAULT_KEYBINDINGS} onClose={jest.fn()} onSaveKeybindings={onSave} />)
  
  // Capture new shortcut for New Session
  const row = screen.getByText('New Session').parentElement!
  const setButton = row.querySelector('button')!
  fireEvent.click(setButton)
  fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true, altKey: true, shiftKey: false })

  const saveButton = screen.getByText('Save Shortcuts')
  await act(async () => {
    fireEvent.click(saveButton)
  })

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    newSession: { code: 'KeyK', ctrl: true, alt: true, shift: false }
  }))
})


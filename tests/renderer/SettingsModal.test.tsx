import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SettingsModal } from '../../src/renderer/components/SettingsModal'
import type { DriftStatus, SyncResult } from '../../src/renderer/types/ipc'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

const noDrift: DriftStatus = { lastSyncedAt: '2026-04-27T12:00:00.000Z', rules: [], skills: [] }
const withDrift: DriftStatus = { lastSyncedAt: null, rules: ['global.md', 'compression.md'], skills: ['brainstorming.md'] }
const successResult: SyncResult = { ok: true, output: 'Synced.' }
const failResult: SyncResult = { ok: false, output: 'Error: script not found' }

function setupMocks(status: DriftStatus, syncResult: SyncResult) {
  Object.defineProperty(window, 'overseer', {
    value: {
      syncStatus: jest.fn().mockResolvedValue(status),
      syncRun: jest.fn().mockResolvedValue(syncResult),
    },
    writable: true,
    configurable: true,
  })
}

test('auto focuses the close button on mount', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  expect(screen.getByTitle('Close settings')).toHaveFocus()
})

test('shows "Never" when lastSyncedAt is null', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/Never/)).toBeInTheDocument())
})

test('shows drift counts when status loads', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/Rules:.*2 changed/)).toBeInTheDocument())
  expect(screen.getByText(/Skills:.*1 changed/)).toBeInTheDocument()
})

test('shows drifted filenames', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => expect(screen.getByText(/global\.md/)).toBeInTheDocument())
  expect(screen.getByText(/brainstorming\.md/)).toBeInTheDocument()
})

test('shows "0 changed" when no drift', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => expect(screen.getAllByText(/0 changed/).length).toBeGreaterThan(0))
})

test('clicking Sync Now calls syncRun', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(window.overseer.syncRun as jest.Mock).toHaveBeenCalled())
})

test('shows error output when sync fails', async () => {
  setupMocks(noDrift, failResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(screen.getByText(/Error: script not found/)).toBeInTheDocument())
})

test('calls onClose when close button clicked', async () => {
  setupMocks(noDrift, successResult)
  const onClose = jest.fn()
  render(<SettingsModal onClose={onClose} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByTitle('Close settings'))
  expect(onClose).toHaveBeenCalled()
})

test('renders Shortcuts section heading', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('Shortcuts')).toBeInTheDocument()
})

test('shows action labels in shortcuts table', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('New Session')).toBeInTheDocument()
  expect(screen.getByText('Open Settings')).toBeInTheDocument()
})

test('shows formatted keybinding strings', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
})

test('shows "Press keys…" prompt after clicking Set for an action', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  expect(screen.getByText('Press keys…')).toBeInTheDocument()
})

test('capturing a key combo updates the pending binding display', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={jest.fn()} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  fireEvent.keyDown(window, { code: 'KeyT', ctrlKey: true, shiftKey: true, key: 'T' })
  expect(screen.getByText('Ctrl+Shift+T')).toBeInTheDocument()
})

test('Save Shortcuts button calls onSaveKeybindings after a change', async () => {
  setupMocks(noDrift, successResult)
  const onSaveKeybindings = jest.fn().mockResolvedValue(undefined)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} onSaveKeybindings={onSaveKeybindings} />)
  await waitFor(() => screen.getByText('Sync Now'))
  const setButtons = screen.getAllByText('Set')
  fireEvent.click(setButtons[0])
  fireEvent.keyDown(window, { code: 'KeyT', ctrlKey: true, shiftKey: true, key: 'T' })
  fireEvent.click(screen.getByText('Save Shortcuts'))
  await waitFor(() => expect(onSaveKeybindings).toHaveBeenCalled())
})

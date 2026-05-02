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
      readTheme: jest.fn().mockResolvedValue({ activeThemeId: 'overseer-dark', customThemes: [] }),
      writeTheme: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockReturnValue(() => {}),
      updateCheck: jest.fn().mockResolvedValue(undefined),
      updateInstall: jest.fn().mockResolvedValue(undefined),
    },
    writable: true,
    configurable: true,
  })
}

test('auto focuses the close button on mount', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  expect(screen.getByTitle('Close settings')).toHaveFocus()
})

test('shows "Never" when lastSyncedAt is null', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => expect(screen.getByText(/Never/)).toBeInTheDocument())
})

test('shows drift counts when status loads', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => expect(screen.getByText(/Rules:.*2 changed/)).toBeInTheDocument())
  expect(screen.getByText(/Skills:.*1 changed/)).toBeInTheDocument()
})

test('shows drifted filenames', async () => {
  setupMocks(withDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => expect(screen.getByText(/global\.md/)).toBeInTheDocument())
  expect(screen.getByText(/brainstorming\.md/)).toBeInTheDocument()
})

test('shows "0 changed" when no drift', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => expect(screen.getAllByText(/0 changed/).length).toBeGreaterThan(0))
})

test('clicking Sync Now calls syncRun', async () => {
  setupMocks(noDrift, successResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(window.overseer.syncRun as jest.Mock).toHaveBeenCalled())
})

test('shows error output when sync fails', async () => {
  setupMocks(noDrift, failResult)
  render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByText('Sync Now'))
  await waitFor(() => expect(screen.getByText(/Error: script not found/)).toBeInTheDocument())
})

test('calls onClose when close button clicked', async () => {
  setupMocks(noDrift, successResult)
  const onClose = jest.fn()
  render(<SettingsModal onClose={onClose} keybindings={DEFAULT_KEYBINDINGS} />)
  await waitFor(() => screen.getByText('Sync Now'))
  fireEvent.click(screen.getByTitle('Close settings'))
  expect(onClose).toHaveBeenCalled()
})

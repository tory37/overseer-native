import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SettingsModal } from '../../src/renderer/components/SettingsModal'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'
import { useThemeStore } from '../../src/renderer/store/theme'

// Mock useThemeStore
jest.mock('../../src/renderer/store/theme', () => ({
  BUILTIN_THEMES: [
    { id: 'theme-1', name: 'Theme 1' },
    { id: 'theme-2', name: 'Theme 2' },
  ],
  useThemeStore: jest.fn(),
}))

const mockSetActiveTheme = jest.fn()

describe('SettingsModal Theme Cycling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      activeThemeId: 'theme-1',
      customThemes: [],
      setActiveTheme: mockSetActiveTheme,
    })

    Object.defineProperty(window, 'overseer', {
      value: {
        syncStatus: jest.fn().mockResolvedValue({ lastSyncedAt: null, rules: [], skills: [] }),
        updateStatus: jest.fn().mockReturnValue(() => {}),
      },
      writable: true,
      configurable: true,
    })
  })

  test('cycles to next theme on button click', () => {
    render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
    const nextButton = screen.getByTitle('Next theme (ArrowRight)')
    fireEvent.click(nextButton)
    expect(mockSetActiveTheme).toHaveBeenCalledWith('theme-2')
  })

  test('cycles to previous theme on button click', () => {
    render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
    const prevButton = screen.getByTitle('Previous theme (ArrowLeft)')
    fireEvent.click(prevButton)
    expect(mockSetActiveTheme).toHaveBeenCalledWith('theme-2') // theme-1 -> theme-2 circularly
  })

  test('cycles themes with keyboard arrows', () => {
    render(<SettingsModal onClose={jest.fn()} keybindings={DEFAULT_KEYBINDINGS} />)
    
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mockSetActiveTheme).toHaveBeenCalledWith('theme-2')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mockSetActiveTheme).toHaveBeenCalledWith('theme-2')
  })
})

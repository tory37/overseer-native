import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts } from '../../src/renderer/hooks/useKeyboardShortcuts'
import type { ShortcutHandlers } from '../../src/renderer/hooks/useKeyboardShortcuts'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'

function makeHandlers(): ShortcutHandlers {
  return {
    onNewSession:     jest.fn(),
    onKillSession:    jest.fn(),
    onNextSession:    jest.fn(),
    onPrevSession:    jest.fn(),
    onSessionByIndex: jest.fn(),
    onOpenDrawer:     jest.fn(),
    onOpenSettings:   jest.fn(),
    onOpenShortcuts:  jest.fn(),
  }
}

beforeEach(() => {
  ;(window as any).overseer = {
    readKeybindings:  jest.fn().mockResolvedValue(null),
    writeKeybindings: jest.fn().mockResolvedValue(undefined),
  }
})

test('returns DEFAULT_KEYBINDINGS initially', () => {
  const { result } = renderHook(() => useKeyboardShortcuts(makeHandlers()))
  expect(result.current.keybindings).toEqual(DEFAULT_KEYBINDINGS)
})

test('fires onNewSession for Ctrl+Shift+N (KeyN)', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNewSession).toHaveBeenCalledTimes(1)
})

test('fires onKillSession for Ctrl+Shift+W', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onKillSession).toHaveBeenCalledTimes(1)
})

test('fires onNextSession for Ctrl+Shift+BracketRight', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'BracketRight', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNextSession).toHaveBeenCalledTimes(1)
})

test('fires onPrevSession for Ctrl+Shift+BracketLeft', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'BracketLeft', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onPrevSession).toHaveBeenCalledTimes(1)
})

test('fires onOpenDrawer for Ctrl+Shift+E', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenDrawer).toHaveBeenCalledTimes(1)
})

test('fires onOpenSettings for Ctrl+Shift+Comma', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Comma', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenSettings).toHaveBeenCalledTimes(1)
})

test('fires onOpenShortcuts for Ctrl+Shift+Slash', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onOpenShortcuts).toHaveBeenCalledTimes(1)
})

test('fires onSessionByIndex(3) for Ctrl+Shift+Digit3', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onSessionByIndex).toHaveBeenCalledWith(3)
})

test('ignores Ctrl+N (no Shift) — does not fire onNewSession', () => {
  const handlers = makeHandlers()
  renderHook(() => useKeyboardShortcuts(handlers))
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', ctrlKey: true, shiftKey: false, bubbles: true }))
  })
  expect(handlers.onNewSession).not.toHaveBeenCalled()
})

test('loads custom keybindings from IPC and uses them', async () => {
  const custom = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }
  ;(window as any).overseer.readKeybindings = jest.fn().mockResolvedValue(custom)
  const handlers = makeHandlers()
  const { result } = renderHook(() => useKeyboardShortcuts(handlers))

  await act(async () => { await Promise.resolve() })

  expect(result.current.keybindings.newSession.code).toBe('KeyT')

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', ctrlKey: true, shiftKey: true, bubbles: true }))
  })
  expect(handlers.onNewSession).toHaveBeenCalledTimes(1)
})

test('updateKeybindings writes to disk and updates state', async () => {
  const handlers = makeHandlers()
  const { result } = renderHook(() => useKeyboardShortcuts(handlers))
  const custom = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }

  await act(async () => { await result.current.updateKeybindings(custom) })

  expect((window as any).overseer.writeKeybindings).toHaveBeenCalledWith(custom)
  expect(result.current.keybindings.newSession.code).toBe('KeyT')
})

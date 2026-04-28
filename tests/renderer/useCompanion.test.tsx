import { renderHook, act } from '@testing-library/react'
import { useCompanion } from '../../src/renderer/hooks/useCompanion'
import type { Session } from '../../src/renderer/types/ipc'

const mockSession: Session = {
  id: 'session-1',
  name: 'Test Session',
  agentType: 'claude',
  cwd: '/home/test',
  envVars: {},
  scrollbackPath: '',
}

beforeEach(() => {
  ;(window as any).overseer = {
    spawnCompanion:  jest.fn().mockResolvedValue('test-companion-id'),
    killCompanion:   jest.fn().mockResolvedValue(undefined),
    onCompanionData: jest.fn().mockReturnValue(() => {}),
    onCompanionExit: jest.fn().mockReturnValue(() => {}),
  }
})

test('starts with split closed', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.activeCompanionId).toBeNull()
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.splitDirection).toBe('horizontal')
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitFocus when closed: spawns companion with session cwd and focuses it', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledWith('/home/test')
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.activeCompanionId).toBe('test-companion-id')
  expect(result.current.allCompanions).toEqual([{ sessionId: 'session-1', companionId: 'test-companion-id' }])
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitFocus when open: toggles focus main↔companion', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitSwap toggles splitSwapped when open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitSwapped).toBe(false)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(true)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitSwap is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitToggleDirection toggles horizontal↔vertical when open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitDirection).toBe('horizontal')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('vertical')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('onSplitToggleDirection is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('companion:exit closes the split for the active session and removes the companion', async () => {
  let exitCb: ((id: string) => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: (id: string) => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitOpen).toBe(true)
  act(() => { exitCb?.('test-companion-id') })
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.activeCompanionId).toBeNull()
  expect(result.current.splitFocused).toBe('main')
})

test('killCompanionForSession kills and removes the companion', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.activeCompanionId).toBe('test-companion-id')
  act(() => { result.current.killCompanionForSession('session-1') })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('test-companion-id')
  expect(result.current.activeCompanionId).toBeNull()
  expect(result.current.allCompanions).toHaveLength(0)
})

test('onSplitFocus without active session is a no-op', async () => {
  const { result } = renderHook(() => useCompanion(undefined))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).not.toHaveBeenCalled()
  expect(result.current.splitOpen).toBe(false)
})

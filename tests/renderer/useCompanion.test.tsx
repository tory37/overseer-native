import { renderHook, act } from '@testing-library/react'
import { useCompanion } from '../../src/renderer/hooks/useCompanion'

beforeEach(() => {
  ;(window as any).overseer = {
    spawnCompanion:  jest.fn().mockResolvedValue('test-companion-id'),
    killCompanion:   jest.fn().mockResolvedValue(undefined),
    onCompanionData: jest.fn().mockReturnValue(() => {}),
    onCompanionExit: jest.fn().mockReturnValue(() => {}),
  }
})

test('starts with split closed', () => {
  const { result } = renderHook(() => useCompanion())
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.companionId).toBeNull()
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.splitDirection).toBe('horizontal')
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitFocus when closed: spawns companion and focuses it', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(1)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.companionId).toBe('test-companion-id')
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitFocus when open: toggles focus main↔companion', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companion')
})

test('onSplitSwap toggles splitSwapped when open', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitSwapped).toBe(false)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(true)
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitSwap is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion())
  act(() => { result.current.onSplitSwap() })
  expect(result.current.splitSwapped).toBe(false)
})

test('onSplitToggleDirection toggles horizontal↔vertical when open', async () => {
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitDirection).toBe('horizontal')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('vertical')
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('onSplitToggleDirection is a no-op when closed', () => {
  const { result } = renderHook(() => useCompanion())
  act(() => { result.current.onSplitToggleDirection() })
  expect(result.current.splitDirection).toBe('horizontal')
})

test('companion:exit closes the split and clears companionId', async () => {
  let exitCb: (() => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: () => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion())
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitOpen).toBe(true)
  act(() => { exitCb?.() })
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.companionId).toBeNull()
  expect(result.current.splitFocused).toBe('main')
})

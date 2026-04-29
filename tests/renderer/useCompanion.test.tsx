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
  spriteId: null,
}

beforeEach(() => {
  ;(window as any).overseer = {
    spawnCompanion:  jest.fn()
      .mockResolvedValueOnce('companion-a-id')
      .mockResolvedValueOnce('companion-b-id'),
    killCompanion:   jest.fn().mockResolvedValue(undefined),
    onCompanionData: jest.fn().mockReturnValue(() => {}),
    onCompanionExit: jest.fn().mockReturnValue(() => {}),
  }
})

// ─── initial state ──────────────────────────────────────────────────────────

test('starts with split closed and default state', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.activeCompanionId).toBeNull()
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.splitDirection).toBe('horizontal')
  expect(result.current.splitSwapped).toBe(false)
  expect(result.current.secondarySwapped).toBe(false)
  expect(result.current.outerSplitRatio).toBe(0.5)
  expect(result.current.innerSplitRatio).toBe(0.5)
})

// ─── onSplitFocus ────────────────────────────────────────────────────────────

test('onSplitFocus when closed: spawns companionA with session cwd and focuses it', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledWith('/home/test')
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.activeCompanionId).toBe('companion-a-id')
  expect(result.current.allCompanions).toEqual([{ sessionId: 'session-1', companionId: 'companion-a-id' }])
  expect(result.current.splitFocused).toBe('companionA')
})

test('onSplitFocus when open (2-way): cycles main → companionA → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
})

test('onSplitFocus when 3-way open: cycles main → companionA → companionB → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocus() })
  expect(result.current.splitFocused).toBe('companionB')
})

test('onSplitFocus without active session is a no-op', async () => {
  const { result } = renderHook(() => useCompanion(undefined))
  await act(async () => { result.current.onSplitFocus() })
  expect((window as any).overseer.spawnCompanion).not.toHaveBeenCalled()
  expect(result.current.splitOpen).toBe(false)
})

// ─── onSplitFocusPrev ────────────────────────────────────────────────────────

test('onSplitFocusPrev when open (2-way): cycles main → companionA → main (same as forward)', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitFocus() }) // back to main
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('main')
})

test('onSplitFocusPrev when 3-way open: cycles main → companionB → companionA → main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.onSplitFocus() }) // companionB → main
  expect(result.current.splitFocused).toBe('main')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitFocusPrev() })
  expect(result.current.splitFocused).toBe('main')
})

// ─── onSplitOpenThreeWay ─────────────────────────────────────────────────────

test('onSplitOpenThreeWay when split is open: spawns companionB and opens 3-way', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(2)
  expect(result.current.threeWayOpen).toBe(true)
  expect(result.current.allCompanionsB).toEqual([{ sessionId: 'session-1', companionId: 'companion-b-id' }])
  expect(result.current.splitFocused).toBe('companionB')
})

test('onSplitOpenThreeWay when split is closed: spawns BOTH companion A and B, opens 3-way, and focuses B', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  
  // Trigger from closed state
  await act(async () => { 
    result.current.onSplitOpenThreeWay() 
  })

  // Should have spawned two companions
  expect((window as any).overseer.spawnCompanion).toHaveBeenCalledTimes(2)
  expect((window as any).overseer.spawnCompanion).toHaveBeenNthCalledWith(1, '/home/test')
  expect((window as any).overseer.spawnCompanion).toHaveBeenNthCalledWith(2, '/home/test')

  // State should reflect 3-way split open
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.threeWayOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionB')
  expect(result.current.allCompanions).toHaveLength(1)
  expect(result.current.allCompanionsB).toHaveLength(1)
})

// ─── onSplitClose ────────────────────────────────────────────────────────────

test('onSplitClose when focused on companionB: kills B, sets threeWayOpen=false, focuses companionA', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionA')
  expect(result.current.allCompanionsB).toHaveLength(0)
})

test('onSplitClose when focused on companionA: kills A and B, closes split, focuses main', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.onSplitFocus() }) // → main
  act(() => { result.current.onSplitFocus() }) // → companionA
  expect(result.current.splitFocused).toBe('companionA')
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-a-id')
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
})

test('onSplitClose when focused on main: closes split', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitFocus() }) // → main
  act(() => { result.current.onSplitClose() })
  expect((window as any).overseer.killCompanion).toHaveBeenCalled()
  expect(result.current.splitOpen).toBe(false)
})

// ─── swap actions ────────────────────────────────────────────────────────────

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

test('onSplitSwapSecondary toggles secondarySwapped when 3-way open', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.secondarySwapped).toBe(false)
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(true)
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(false)
})

test('onSplitSwapSecondary is a no-op when not 3-way', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  act(() => { result.current.onSplitSwapSecondary() })
  expect(result.current.secondarySwapped).toBe(false)
})

// ─── direction ───────────────────────────────────────────────────────────────

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

// ─── ratios ──────────────────────────────────────────────────────────────────

test('onOuterRatio clamps to [0.1, 0.9] and updates outerSplitRatio', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onOuterRatio(0.3) })
  expect(result.current.outerSplitRatio).toBe(0.3)
  act(() => { result.current.onOuterRatio(0.05) })
  expect(result.current.outerSplitRatio).toBe(0.1)
  act(() => { result.current.onOuterRatio(0.95) })
  expect(result.current.outerSplitRatio).toBe(0.9)
})

test('onInnerRatio clamps to [0.1, 0.9] and updates innerSplitRatio', () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  act(() => { result.current.onInnerRatio(0.7) })
  expect(result.current.innerSplitRatio).toBe(0.7)
  act(() => { result.current.onInnerRatio(0.0) })
  expect(result.current.innerSplitRatio).toBe(0.1)
})

// ─── exit cascade ────────────────────────────────────────────────────────────

test('companionB exit: sets threeWayOpen=false, focuses companionA if was on B', async () => {
  let exitCb: ((id: string) => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: (id: string) => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  expect(result.current.splitFocused).toBe('companionB')
  act(() => { exitCb?.('companion-b-id') })
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitOpen).toBe(true)
  expect(result.current.splitFocused).toBe('companionA')
  expect(result.current.allCompanionsB).toHaveLength(0)
})

test('companionA exit: kills B, closes split, focuses main', async () => {
  let exitCb: ((id: string) => void) | null = null
  ;(window as any).overseer.onCompanionExit = jest.fn().mockImplementation((cb: (id: string) => void) => {
    exitCb = cb
    return () => {}
  })
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { exitCb?.('companion-a-id') })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
})

// ─── killCompanionForSession ──────────────────────────────────────────────────

test('killCompanionForSession kills both A and B and resets layout for active session', async () => {
  const { result } = renderHook(() => useCompanion(mockSession))
  await act(async () => { result.current.onSplitFocus() })
  await act(async () => { result.current.onSplitOpenThreeWay() })
  act(() => { result.current.killCompanionForSession('session-1') })
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-a-id')
  expect((window as any).overseer.killCompanion).toHaveBeenCalledWith('companion-b-id')
  expect(result.current.splitOpen).toBe(false)
  expect(result.current.threeWayOpen).toBe(false)
  expect(result.current.splitFocused).toBe('main')
  expect(result.current.allCompanions).toHaveLength(0)
  expect(result.current.allCompanionsB).toHaveLength(0)
})

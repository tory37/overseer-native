import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SpritePanel } from '../../src/renderer/components/SpritePanel'
import { useSpritesStore } from '../../src/renderer/store/sprites'
import { mockOverseer } from './setup'

jest.mock('../../src/renderer/lib/render-avatar', () => ({
  renderAvatar: jest.fn(() => '<svg data-testid="mock-avatar"></svg>'),
}))

beforeEach(() => {
  localStorage.clear()
  useSpritesStore.setState({ sprites: [] })
  ;(window as any).overseer = { ...mockOverseer }
  
  // Create overlay root for portals
  if (!document.getElementById('overlay-root')) {
    const root = document.createElement('div')
    root.id = 'overlay-root'
    document.body.appendChild(root)
  }
})

test('renders empty state with placeholder when spriteId is null', () => {
  render(<SpritePanel sessionId="s1" spriteId={null} animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect(screen.getByText('No Sprite assigned')).toBeInTheDocument()
  expect(screen.getByText('Open Studio')).toBeInTheDocument()
})

test('renders nothing when visible is false', () => {
  render(<SpritePanel sessionId="s1" spriteId={null} animationState="idle" visible={false} onOpenStudio={() => {}} />)
  expect(screen.queryByText('No Sprite assigned')).not.toBeInTheDocument()
})

test('renders avatar and placeholder bubble when spriteId matches', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  render(<SpritePanel sessionId="s1" spriteId={sprite.id} animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect(screen.getByText(/Salty/)).toBeInTheDocument()
  expect(screen.getByText('Awaiting transmission...')).toBeInTheDocument()
})

test('displays speech text in both bubbles when onSpriteSpeech fires', async () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  let capturedCb: ((p: { sessionId: string; text: string }) => void) | null = null
  ;(window as any).overseer.onSpriteSpeech = jest.fn().mockImplementation(cb => {
    capturedCb = cb
    return () => {}
  })
  render(<SpritePanel sessionId="s1" spriteId={sprite.id} animationState="idle" visible={true} onOpenStudio={() => {}} />)

  await act(async () => {
    capturedCb?.({ sessionId: 's1', text: 'hello sailor' })
  })

  // Should be in persistent bubble AND prominent bubble
  const matches = screen.getAllByText('hello sailor')
  expect(matches.length).toBe(2)
})

test('persistent bubble remains after overlay timeout', async () => {
  jest.useFakeTimers()
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  let capturedCb: ((p: { sessionId: string; text: string }) => void) | null = null
  ;(window as any).overseer.onSpriteSpeech = jest.fn().mockImplementation(cb => {
    capturedCb = cb
    return () => {}
  })
  render(<SpritePanel sessionId="s1" spriteId={sprite.id} animationState="idle" visible={true} onOpenStudio={() => {}} />)

  await act(async () => {
    capturedCb?.({ sessionId: 's1', text: 'hello sailor' })
  })

  expect(screen.getAllByText('hello sailor').length).toBe(2)

  await act(async () => {
    jest.advanceTimersByTime(8001)
  })

  // Only persistent bubble remains
  expect(screen.getAllByText('hello sailor').length).toBe(1)
  jest.useRealTimers()
})

test('does not display speech for a different session', async () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  let capturedCb: ((p: { sessionId: string; text: string }) => void) | null = null
  ;(window as any).overseer.onSpriteSpeech = jest.fn().mockImplementation(cb => {
    capturedCb = cb
    return () => {}
  })
  render(<SpritePanel sessionId="s1" spriteId={sprite.id} animationState="idle" visible={true} onOpenStudio={() => {}} />)

  await act(async () => {
    capturedCb?.({ sessionId: 'OTHER', text: 'not for me' })
  })

  expect(screen.queryByText('not for me')).not.toBeInTheDocument()
})

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
})

test('renders empty state when spriteId is null', () => {
  render(<SpritePanel sessionId="s1" spriteId={null} animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect(screen.getByText('No Sprite assigned')).toBeInTheDocument()
  expect(screen.getByText('Open Studio')).toBeInTheDocument()
})

test('renders nothing when visible is false', () => {
  render(<SpritePanel sessionId="s1" spriteId={null} animationState="idle" visible={false} onOpenStudio={() => {}} />)
  expect(screen.queryByText('No Sprite assigned')).not.toBeInTheDocument()
})

test('renders avatar when spriteId matches a sprite in store', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  render(<SpritePanel sessionId="s1" spriteId={sprite.id} animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect(screen.getByText(/Salty/)).toBeInTheDocument()
})

test('renders empty state when spriteId does not match any sprite', () => {
  render(<SpritePanel sessionId="s1" spriteId="nonexistent-id" animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect(screen.getByText('No Sprite assigned')).toBeInTheDocument()
})

test('subscribes to onSpriteSpeech with the session id', () => {
  render(<SpritePanel sessionId="s1" spriteId={null} animationState="idle" visible={true} onOpenStudio={() => {}} />)
  expect((window as any).overseer.onSpriteSpeech).toHaveBeenCalled()
})

test('displays speech text when onSpriteSpeech fires for matching session', async () => {
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

  expect(screen.getByText('hello sailor')).toBeInTheDocument()
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

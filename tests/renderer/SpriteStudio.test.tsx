import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SpriteStudio } from '../../src/renderer/components/SpriteStudio'
import { useSpritesStore } from '../../src/renderer/store/sprites'

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toString: () => '<svg></svg>' })),
}))
jest.mock('@dicebear/collection', () => ({ bottts: {} }))

beforeEach(() => {
  localStorage.clear()
  useSpritesStore.setState({ sprites: [] })
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

test('renders "New Sprite" heading when no editingId', () => {
  render(<SpriteStudio onClose={() => {}} />)
  expect(screen.getByText('New Sprite')).toBeInTheDocument()
})

test('renders "Edit Sprite" heading when editingId provided', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: 'grumpy' })
  render(<SpriteStudio onClose={() => {}} editingId={sprite.id} />)
  expect(screen.getByText('Edit Sprite')).toBeInTheDocument()
})

test('calls onClose when Cancel is clicked', () => {
  const onClose = jest.fn()
  render(<SpriteStudio onClose={onClose} />)
  fireEvent.click(screen.getByText('Cancel'))
  expect(onClose).toHaveBeenCalled()
})

test('creates a new sprite and calls onClose on Save', () => {
  const onClose = jest.fn()
  render(<SpriteStudio onClose={onClose} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Salty' } })
  fireEvent.change(screen.getByLabelText('Avatar Seed'), { target: { value: 'sailor123' } })
  fireEvent.change(screen.getByLabelText('Persona'), { target: { value: 'grumpy old sailor' } })
  fireEvent.click(screen.getByText('Save'))
  expect(onClose).toHaveBeenCalled()
  const sprites = useSpritesStore.getState().sprites
  expect(sprites).toHaveLength(1)
  expect(sprites[0].name).toBe('Salty')
  expect(sprites[0].seed).toBe('sailor123')
  expect(sprites[0].persona).toBe('grumpy old sailor')
  expect(sprites[0].style).toBe('bottts')
})

test('updates an existing sprite on Save', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: 'grumpy' })
  const onClose = jest.fn()
  render(<SpriteStudio onClose={onClose} editingId={sprite.id} />)
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Salty McSaltface' } })
  fireEvent.click(screen.getByText('Save'))
  expect(onClose).toHaveBeenCalled()
  expect(useSpritesStore.getState().sprites[0].name).toBe('Salty McSaltface')
})

test('Delete requires confirmation and auto-cancels after 2s', async () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  render(<SpriteStudio onClose={() => {}} editingId={sprite.id} />)

  fireEvent.click(screen.getByText('Delete'))
  expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
  expect(useSpritesStore.getState().sprites).toHaveLength(1)

  await act(async () => { jest.advanceTimersByTime(2000) })

  expect(screen.getByText('Delete')).toBeInTheDocument()
  expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument()
})

test('Delete removes sprite when confirmed', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  const onClose = jest.fn()
  render(<SpriteStudio onClose={onClose} editingId={sprite.id} />)

  fireEvent.click(screen.getByText('Delete'))
  fireEvent.click(screen.getByText('Confirm Delete'))

  expect(onClose).toHaveBeenCalled()
  expect(useSpritesStore.getState().sprites).toHaveLength(0)
})

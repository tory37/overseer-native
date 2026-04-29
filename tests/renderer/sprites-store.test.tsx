import { useSpritesStore } from '../../src/renderer/store/sprites'
import { mockOverseer } from './setup'

beforeEach(() => {
  localStorage.clear()
  useSpritesStore.setState({ sprites: [] })
  ;(window as any).overseer = { ...mockOverseer }
})

test('createSprite adds a sprite with a generated id', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: 'old sailor' })
  expect(sprite.id).toBeTruthy()
  expect(typeof sprite.id).toBe('string')
  expect(useSpritesStore.getState().sprites).toHaveLength(1)
  expect(useSpritesStore.getState().sprites[0].name).toBe('Salty')
})

test('createSprite gives each sprite a unique id', () => {
  const { createSprite } = useSpritesStore.getState()
  const a = createSprite({ name: 'A', style: 'bottts', seed: 'a', persona: '' })
  const b = createSprite({ name: 'B', style: 'bottts', seed: 'b', persona: '' })
  expect(a.id).not.toBe(b.id)
})

test('updateSprite patches only the named fields', () => {
  const { createSprite, updateSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: 'grumpy sailor' })
  updateSprite(sprite.id, { name: 'Salty McSaltface' })
  const updated = useSpritesStore.getState().sprites[0]
  expect(updated.name).toBe('Salty McSaltface')
  expect(updated.persona).toBe('grumpy sailor')
})

test('updateSprite ignores unknown ids', () => {
  const { createSprite, updateSprite } = useSpritesStore.getState()
  createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: 'grumpy' })
  updateSprite('does-not-exist', { name: 'X' })
  expect(useSpritesStore.getState().sprites[0].name).toBe('Salty')
})

test('deleteSprite removes the sprite by id', () => {
  const { createSprite, deleteSprite } = useSpritesStore.getState()
  const sprite = createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })
  deleteSprite(sprite.id)
  expect(useSpritesStore.getState().sprites).toHaveLength(0)
})

test('deleteSprite leaves other sprites untouched', () => {
  const { createSprite, deleteSprite } = useSpritesStore.getState()
  const a = createSprite({ name: 'A', style: 'bottts', seed: 'a', persona: '' })
  const b = createSprite({ name: 'B', style: 'bottts', seed: 'b', persona: '' })
  deleteSprite(a.id)
  expect(useSpritesStore.getState().sprites).toHaveLength(1)
  expect(useSpritesStore.getState().sprites[0].id).toBe(b.id)
})

import { useSpritesStore } from '../../src/renderer/store/sprites'
import { mockOverseer } from './setup'

describe('useSpritesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(window as any).overseer = { ...mockOverseer }
  })

  test('initializes with default sprite', () => {
    const state = useSpritesStore.getState()
    expect(state.sprites.length).toBeGreaterThanOrEqual(1)
    expect(state.sprites[0].id).toBe('default-sprite')
  })

  test('can create a new sprite', () => {
    const { createSprite } = useSpritesStore.getState()
    const newSprite = createSprite({
      name: 'Test Bot',
      style: 'bottts',
      seed: 'test',
      persona: 'Test persona'
    })
    
    expect(newSprite.id).toBeDefined()
    expect(newSprite.name).toBe('Test Bot')
    
    const { sprites } = useSpritesStore.getState()
    expect(sprites.find(s => s.id === newSprite.id)).toBeDefined()
  })

  test('can update a sprite', () => {
    const { updateSprite, sprites } = useSpritesStore.getState()
    const id = sprites[0].id
    updateSprite(id, { name: 'Updated Name' })
    
    const updated = useSpritesStore.getState().sprites.find(s => s.id === id)
    expect(updated?.name).toBe('Updated Name')
  })

  test('can delete a sprite', () => {
    const { createSprite, deleteSprite } = useSpritesStore.getState()
    const newSprite = createSprite({
      name: 'To Delete',
      style: 'bottts',
      seed: 'delete',
      persona: '...'
    })
    
    deleteSprite(newSprite.id)
    const { sprites } = useSpritesStore.getState()
    expect(sprites.find(s => s.id === newSprite.id)).toBeUndefined()
  })
})

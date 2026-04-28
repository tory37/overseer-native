import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Sprite {
  id: string
  name: string
  style: string  // DiceBear collection key — MVP: always 'bottts'
  seed: string
  persona: string
}

interface SpritesState {
  sprites: Sprite[]
  createSprite: (s: Omit<Sprite, 'id'>) => Sprite
  updateSprite: (id: string, patch: Partial<Omit<Sprite, 'id'>>) => void
  deleteSprite: (id: string) => void
}

export const useSpritesStore = create<SpritesState>()(
  persist(
    (set) => ({
      sprites: [],
      createSprite: (s) => {
        const sprite: Sprite = { ...s, id: crypto.randomUUID() }
        set(state => ({ sprites: [...state.sprites, sprite] }))
        return sprite
      },
      updateSprite: (id, patch) => {
        set(state => ({
          sprites: state.sprites.map(s => s.id === id ? { ...s, ...patch } : s),
        }))
      },
      deleteSprite: (id) => {
        set(state => ({ sprites: state.sprites.filter(s => s.id !== id) }))
      },
    }),
    { name: 'overseer-sprites' }
  )
)

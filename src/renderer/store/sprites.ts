import { create } from 'zustand'

export interface Sprite {
  id: string
  name: string
  style: string
  seed: string
  persona: string
}

const DEFAULT_SPRITE: Sprite = {
  id: 'default-sprite',
  name: 'Overseer',
  style: 'bottts',
  seed: 'overseer',
  persona: 'You are the Overseer, a helpful AI assistant. You are witty, concise, and professional.',
}

interface SpritesState {
  sprites: Sprite[]
  createSprite: (s: Omit<Sprite, 'id'>) => Sprite
  updateSprite: (id: string, patch: Partial<Omit<Sprite, 'id'>>) => void
  deleteSprite: (id: string) => void
  loadSprites: () => Promise<void>
}

export const useSpritesStore = create<SpritesState>((set, get) => ({
  sprites: [DEFAULT_SPRITE],
  createSprite: (s) => {
    const sprite: Sprite = { ...s, id: crypto.randomUUID() }
    set(state => ({ sprites: [...state.sprites, sprite] }))
    window.overseer.writeSprites({ sprites: get().sprites })
    return sprite
  },
  updateSprite: (id, patch) => {
    set(state => ({
      sprites: state.sprites.map(s => s.id === id ? { ...s, ...patch } : s),
    }))
    window.overseer.writeSprites({ sprites: get().sprites })
  },
  deleteSprite: (id) => {
    set(state => ({ sprites: state.sprites.filter(s => s.id !== id) }))
    window.overseer.writeSprites({ sprites: get().sprites })
  },
  loadSprites: async () => {
    const settings = await window.overseer.readSprites()
    const sprites = settings?.sprites || [DEFAULT_SPRITE]
    if (!sprites.find((s: any) => s.id === DEFAULT_SPRITE.id)) {
      sprites.unshift(DEFAULT_SPRITE)
    }
    set({ sprites })
  }
}))

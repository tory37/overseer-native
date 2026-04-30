import { createAvatar } from '@dicebear/core'
import { CURATED_STYLES } from './dicebear-styles'
import type { Sprite } from '../store/sprites'

export function renderAvatar(sprite: Sprite): string {
  const styleDef = CURATED_STYLES.find(s => s.id === sprite.style) ?? CURATED_STYLES[0]
  return createAvatar(styleDef.collection, {
    seed: sprite.seed,
    ...(sprite.options ?? {}),
  }).toString()
}

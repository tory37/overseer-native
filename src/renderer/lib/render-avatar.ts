import { createAvatar } from '@dicebear/core'
import { CURATED_STYLES } from './dicebear-styles'
import type { Sprite } from '../store/sprites'

export function renderAvatar(sprite: Sprite): string {
  const styleDef = CURATED_STYLES.find(s => s.id === sprite.style) ?? CURATED_STYLES[0]
  // DiceBear expects component options (eyes, mouth, etc.) as string arrays,
  // not plain strings. Wrap any string value so selections take effect.
  const opts = Object.fromEntries(
    Object.entries(sprite.options ?? {}).map(([k, v]) => [k, typeof v === 'string' ? [v] : v])
  )
  return createAvatar(styleDef.collection, {
    seed: sprite.seed,
    ...opts,
  }).toString()
}

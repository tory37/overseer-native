# Sprite Customization Design

**Date:** 2026-04-30
**Status:** Approved

---

## Overview

Add a full character creator to the Sprite Studio's EDIT view, allowing users to customize every visual aspect of their sprite — style, features, and colors — using a classic left/right arrow game UI. Changes propagate live to any open session using that sprite.

---

## Section 1: Data Model

Extend the `Sprite` interface in `src/renderer/store/sprites.ts`:

```typescript
export interface Sprite {
  id: string
  name: string
  style: string                       // e.g. 'bottts', 'pixel-art', 'avataaars'
  seed: string                        // kept — used by Randomize and as DiceBear fallback
  options: Record<string, unknown>    // NEW: explicit per-feature overrides passed to DiceBear
  persona: string
}
```

**Notes:**
- `style` already existed but was always `'bottts'`; it is now meaningful.
- `options` keys/values mirror DiceBear option names for the selected style.
- Omitting a key from `options` means DiceBear uses `seed`-based randomization for that feature.
- **Migration:** existing sprites without `options` treat it as `{}` on load. No data migration needed.

---

## Section 2: Style Config Module

New file: `src/renderer/lib/dicebear-styles.ts`

This is the single source of truth for all DiceBear style and option definitions. Components never import DiceBear collection packages directly — they go through this module.

### Types

```typescript
export type OptionDef =
  | { type: 'enum';   key: string; label: string; values: string[] }
  | { type: 'color';  key: string; label: string; values: string[] }
  | { type: 'number'; key: string; label: string; min: number; max: number; step: number }

export interface StyleDef {
  id: string
  label: string
  collection: any         // DiceBear collection object
  options: OptionDef[]
}
```

### Curated Styles

`CURATED_STYLES: StyleDef[]` — exactly 7 entries:

| id | label |
|----|-------|
| `bottts` | Bottts |
| `pixel-art` | Pixel Art |
| `fun-emoji` | Fun Emoji |
| `avataaars` | Avataaars |
| `micah` | Micah |
| `lorelei` | Lorelei |
| `personas` | Personas |

Each entry declares the options available for that style (sourced from DiceBear's published schema for each collection).

### Option rendering rules

| `OptionDef.type` | UI control |
|------------------|-----------|
| `enum` | Left/right arrows cycling through `values[]`; first position is "random" (key omitted from `options`) |
| `color` | Row of color swatches; first swatch is ✕ "random" (key omitted from `options`) |
| `number` | Left/right arrows stepping by `step` between `min`/`max`; default/0 = "random" |

---

## Section 3: SpriteStudio EDIT View Redesign

File: `src/renderer/components/SpriteStudio.tsx`

The existing EDIT view keeps: name input, persona textarea, avatar preview. The seed input is removed and replaced with the character creator block.

### Style Picker

Sits at the top of the character creator area:

```
← Bottts →
```

- Arrows cycle through `CURATED_STYLES`.
- Changing style resets `options` to `{}` (fresh slate); `seed` is preserved.

### Option Slots

Rendered dynamically from the selected `StyleDef.options` array. Each slot shows a label and its appropriate control (see Section 2 rendering rules).

### Sticky Preview + Randomize

- The 80×80 avatar preview is pinned at the top of the EDIT view and updates live as any option changes.
- A 🎲 **Randomize** button re-rolls `seed` only. Explicit `options` selections are preserved, so only seed-driven features re-randomize.

### Save behavior

"Save" writes `name`, `style`, `seed`, `options`, and `persona` to the Zustand store. The existing IPC propagation in `ipc-handlers.ts` broadcasts the updated sprite to all open sessions using it — no changes needed there.

---

## Section 4: Avatar Rendering

New shared utility: `src/renderer/lib/render-avatar.ts`

```typescript
import { createAvatar } from '@dicebear/core'
import { CURATED_STYLES } from './dicebear-styles'
import type { Sprite } from '../store/sprites'

export function renderAvatar(sprite: Sprite): string {
  const styleDef = CURATED_STYLES.find(s => s.id === sprite.style) ?? CURATED_STYLES[0]
  return createAvatar(styleDef.collection, {
    seed: sprite.seed,
    ...sprite.options,
  }).toString()
}
```

All avatar consumers replace their inline `createAvatar(bottts, { seed })` calls with `renderAvatar(sprite)`:

- `src/renderer/components/SpritePanel.tsx`
- `src/renderer/components/SpriteStudio.tsx` (preview in EDIT view)
- Any other component that renders an avatar SVG

**Live updates:** No IPC changes needed. `SpritePanel` already re-renders on store updates; the new `options` data flows through automatically.

---

## Keyboard Shortcuts

No new shortcuts are required. The existing `openSpriteStudio` binding (`Ctrl+Shift+P`) already opens the studio where customization happens.

---

## Out of Scope

- Custom/arbitrary DiceBear package selection (beyond the 7 curated styles)
- Importing or exporting sprite configs
- Animated avatars

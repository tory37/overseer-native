# Sprite Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static seed-based bottts avatar with a full character creator — style picker + per-option left/right arrows — embedded in the Sprite Studio EDIT view, with live propagation to open sessions.

**Architecture:** A new `dicebear-styles.ts` module centralizes all DiceBear style/option definitions; a `render-avatar.ts` utility replaces every inline `createAvatar(bottts, { seed })` call. The `Sprite` interface gains an optional `options` field. The SpriteStudio EDIT view is redesigned around these two modules.

**Tech Stack:** React, Zustand, DiceBear (`@dicebear/core`, `@dicebear/collection` v9.4.2), Jest + React Testing Library

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/lib/dicebear-styles.ts` | **Create** | Single source of truth for all 7 curated styles and their option definitions |
| `src/renderer/lib/render-avatar.ts` | **Create** | `renderAvatar(sprite)` utility — replaces all inline `createAvatar` calls |
| `src/renderer/store/sprites.ts` | **Modify** | Add optional `options` field to `Sprite`; update `DEFAULT_SPRITE` |
| `src/renderer/components/SpritePanel.tsx` | **Modify** | Use `renderAvatar` instead of hardcoded `createAvatar(bottts, { seed })` |
| `src/renderer/components/SpriteStudio.tsx` | **Modify** | Replace seed input with style picker + option slots; use `renderAvatar` for all previews |
| `tests/renderer/dicebear-styles.test.ts` | **Create** | Verify CURATED_STYLES structure |
| `tests/renderer/render-avatar.test.ts` | **Create** | Verify `renderAvatar` calls DiceBear correctly |
| `tests/renderer/SpriteStore.test.tsx` | **Modify** | Add `options` to sprite fixtures |
| `tests/renderer/SpritePanel.test.tsx` | **Modify** | Mock `render-avatar` instead of `@dicebear/collection` |
| `tests/renderer/SpriteStudio.test.tsx` | **Modify** | Mock `dicebear-styles` + `render-avatar`; test new UI |

---

## Task 1: Extend `Sprite` Interface

**Files:**
- Modify: `src/renderer/store/sprites.ts`
- Modify: `tests/renderer/SpriteStore.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `tests/renderer/SpriteStore.test.tsx`. Add a test after the existing ones:

```typescript
test('sprite has options field', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({
    name: 'Options Bot',
    style: 'bottts',
    seed: 'test',
    options: { eyes: 'bulging' },
    persona: '',
  })
  expect(sprite.options).toEqual({ eyes: 'bulging' })
})

test('sprite options defaults to undefined when omitted', () => {
  const { createSprite } = useSpritesStore.getState()
  const sprite = createSprite({
    name: 'No Options Bot',
    style: 'bottts',
    seed: 'test',
    persona: '',
  })
  expect(sprite.options).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest --testPathPattern="SpriteStore" --no-coverage
```

Expected: FAIL — TypeScript error: `options` does not exist on type

- [ ] **Step 3: Add `options` to the `Sprite` interface**

In `src/renderer/store/sprites.ts`, update the `Sprite` interface and `DEFAULT_SPRITE`:

```typescript
export interface Sprite {
  id: string
  name: string
  style: string
  seed: string
  options?: Record<string, unknown>
  persona: string
}

const DEFAULT_SPRITE: Sprite = {
  id: 'default-sprite',
  name: 'Overseer',
  style: 'bottts',
  seed: 'overseer',
  options: {},
  persona: 'You are the Overseer, a helpful AI assistant. You are witty, concise, and professional.',
}
```

No changes needed to `createSprite`, `updateSprite`, or `deleteSprite` — `Omit<Sprite, 'id'>` and `Partial<Omit<Sprite, 'id'>>` both work with optional fields.

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest --testPathPattern="SpriteStore" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/store/sprites.ts tests/renderer/SpriteStore.test.tsx
git commit -m "feat: add optional options field to Sprite interface"
```

---

## Task 2: Create `dicebear-styles.ts`

**Files:**
- Create: `src/renderer/lib/dicebear-styles.ts`
- Create: `tests/renderer/dicebear-styles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/renderer/dicebear-styles.test.ts`:

```typescript
import { CURATED_STYLES, type OptionDef, type StyleDef } from '../../src/renderer/lib/dicebear-styles'

jest.mock('@dicebear/collection', () => ({
  bottts: { __id: 'bottts' },
  pixelArt: { __id: 'pixelArt' },
  funEmoji: { __id: 'funEmoji' },
  avataaars: { __id: 'avataaars' },
  micah: { __id: 'micah' },
  lorelei: { __id: 'lorelei' },
  personas: { __id: 'personas' },
}))

describe('CURATED_STYLES', () => {
  test('has exactly 7 entries', () => {
    expect(CURATED_STYLES).toHaveLength(7)
  })

  test('each style has required fields', () => {
    for (const style of CURATED_STYLES) {
      expect(style.id).toBeTruthy()
      expect(style.label).toBeTruthy()
      expect(style.collection).toBeTruthy()
      expect(Array.isArray(style.options)).toBe(true)
    }
  })

  test('ids are the expected style slugs', () => {
    const ids = CURATED_STYLES.map(s => s.id)
    expect(ids).toEqual(['bottts', 'pixel-art', 'fun-emoji', 'avataaars', 'micah', 'lorelei', 'personas'])
  })

  test('each option has type, key, and label', () => {
    for (const style of CURATED_STYLES) {
      for (const opt of style.options) {
        expect(['enum', 'color']).toContain(opt.type)
        expect(opt.key).toBeTruthy()
        expect(opt.label).toBeTruthy()
      }
    }
  })

  test('bottts has eyes and baseColor options', () => {
    const bottts = CURATED_STYLES.find(s => s.id === 'bottts')!
    const eyes = bottts.options.find(o => o.key === 'eyes')!
    const color = bottts.options.find(o => o.key === 'baseColor')!
    expect(eyes.type).toBe('enum')
    expect((eyes as OptionDef & { type: 'enum' }).values.length).toBeGreaterThan(0)
    expect(color.type).toBe('color')
    expect((color as OptionDef & { type: 'color' }).values.length).toBeGreaterThan(0)
  })

  test('each enum option has at least one value', () => {
    for (const style of CURATED_STYLES) {
      for (const opt of style.options) {
        if (opt.type === 'enum') {
          expect(opt.values.length).toBeGreaterThan(0)
        }
        if (opt.type === 'color') {
          expect(opt.values.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest --testPathPattern="dicebear-styles" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/renderer/lib/dicebear-styles.ts`**

```typescript
import {
  bottts,
  pixelArt,
  funEmoji,
  avataaars,
  micah,
  lorelei,
  personas,
} from '@dicebear/collection'

export type OptionDef =
  | { type: 'enum';  key: string; label: string; values: string[] }
  | { type: 'color'; key: string; label: string; values: string[] }

export interface StyleDef {
  id: string
  label: string
  collection: object
  options: OptionDef[]
}

export const CURATED_STYLES: StyleDef[] = [
  {
    id: 'bottts',
    label: 'Bottts',
    collection: bottts,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',    values: ['bulging','dizzy','eva','frame1','frame2','glow','happy','hearts','robocop','round','roundFrame01','roundFrame02','sensor','shade01'] },
      { type: 'enum',  key: 'face',      label: 'Face',    values: ['round01','round02','square01','square02','square03','square04'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',   values: ['bite','diagram','grill01','grill02','grill03','smile01','smile02','square01','square02'] },
      { type: 'enum',  key: 'top',       label: 'Top',     values: ['antenna','antennaCrooked','bulb01','glowingBulb01','glowingBulb02','horns','lights','pyramid','radar'] },
      { type: 'enum',  key: 'sides',     label: 'Sides',   values: ['antenna01','antenna02','cables01','cables02','round','square','squareAssymetric'] },
      { type: 'enum',  key: 'texture',   label: 'Texture', values: ['camo01','camo02','circuits','dirty01','dirty02','dots','grunge01','grunge02'] },
      { type: 'color', key: 'baseColor', label: 'Color',   values: ['ffb300','1e88e5','546e7a','6d4c41','00acc1','f4511e','5e35b1','43a047','757575','3949ab','039be5','7cb342','c0ca33','fb8c00','d81b60','8e24aa','e53935','00897b','fdd835'] },
    ],
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    collection: pixelArt,
    options: [
      { type: 'enum',  key: 'eyes',         label: 'Eyes',     values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12'] },
      { type: 'enum',  key: 'mouth',        label: 'Mouth',    values: ['happy01','happy02','happy03','happy04','happy05','happy06','happy07','happy08','happy09','happy10','happy11','happy12','happy13','sad01','sad02','sad03','sad04','sad05','sad06','sad07','sad08','sad09','sad10'] },
      { type: 'enum',  key: 'hair',         label: 'Hair',     values: ['short01','short02','short03','short04','short05','short06','short07','short08','short09','short10','short11','short12','short13','short14','short15','short16','short17','short18','short19','short20','short21','short22','short23','short24','long01','long02','long03','long04','long05','long06','long07','long08','long09','long10','long11','long12','long13','long14','long15','long16','long17','long18','long19','long20','long21'] },
      { type: 'enum',  key: 'clothing',     label: 'Clothing', values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12','variant13','variant14','variant15','variant16','variant17','variant18','variant19','variant20','variant21','variant22','variant23'] },
      { type: 'color', key: 'skinColor',    label: 'Skin',     values: ['ffdbac','f5cfa0','eac393','e0b687','cb9e6e','b68655','a26d3d','8d5524'] },
      { type: 'color', key: 'hairColor',    label: 'Hair Color', values: ['cab188','603a14','83623b','a78961','611c17','603015','612616','28150a','009bbd','bd1700','91cb15'] },
      { type: 'color', key: 'clothingColor',label: 'Outfit Color', values: ['5bc0de','428bca','03396c','88d8b0','44c585','00b159','ff6f69','d11141','ae0001','ffeead','ffd969','ffc425'] },
    ],
  },
  {
    id: 'fun-emoji',
    label: 'Fun Emoji',
    collection: funEmoji,
    options: [
      { type: 'enum', key: 'eyes',  label: 'Eyes',  values: ['closed','closed2','crying','cute','glasses','love','pissed','plain','sad','shades','sleepClose','stars','tearDrop','wink','wink2'] },
      { type: 'enum', key: 'mouth', label: 'Mouth', values: ['plain','lilSmile','sad','shy','cute','wideSmile','shout','smileTeeth','smileLol','pissed','drip','tongueOut','kissHeart','sick','faceMask'] },
    ],
  },
  {
    id: 'avataaars',
    label: 'Avataaars',
    collection: avataaars,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',     values: ['closed','cry','default','eyeRoll','happy','hearts','side','squint','surprised','wink','winkWacky','xDizzy'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',    values: ['concerned','default','disbelief','eating','grimace','sad','screamOpen','serious','smile','tongue','twinkle','vomit'] },
      { type: 'enum',  key: 'eyebrows',  label: 'Eyebrows', values: ['angry','angryNatural','default','defaultNatural','flatNatural','frownNatural','raisedExcited','raisedExcitedNatural','sadConcerned','sadConcernedNatural','unibrowNatural','upDown','upDownNatural'] },
      { type: 'enum',  key: 'top',       label: 'Hair',     values: ['bigHair','bob','bun','curly','curvy','dreads','dreads01','dreads02','frida','fro','froBand','frizzle','hat','hijab','longButNotTooLong','miaWallace','shaggy','shaggyMullet','shavedSides','shortCurly','shortFlat','shortRound','shortWaved','sides','straight01','straight02','straightAndStrand','theCaesar','theCaesarAndSidePart','turban','winterHat1','winterHat02','winterHat03','winterHat04'] },
      { type: 'enum',  key: 'clothing',  label: 'Clothing', values: ['blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','hoodie','overall','shirtCrewNeck','shirtScoopNeck','shirtVNeck'] },
      { type: 'color', key: 'skinColor', label: 'Skin',     values: ['614335','d08b5b','ae5d29','edb98a','ffdbb4','fd9841','f8d25c'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['2c1b18','4a312c','724133','a55728','b58143','c93305','d6b370','e8e1e1','ecdcbf','f59797'] },
    ],
  },
  {
    id: 'micah',
    label: 'Micah',
    collection: micah,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',     values: ['eyes','eyesShadow','round','smiling','smilingShadow'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',    values: ['frown','laughing','nervous','pucker','sad','smile','smirk','surprised'] },
      { type: 'enum',  key: 'hair',      label: 'Hair',     values: ['dannyPhantom','dougFunny','fonze','full','mrClean','mrT','pixie','turban'] },
      { type: 'enum',  key: 'eyebrows',  label: 'Eyebrows', values: ['down','eyelashesDown','eyelashesUp','up'] },
      { type: 'enum',  key: 'nose',      label: 'Nose',     values: ['curve','pointed','tound'] },
      { type: 'enum',  key: 'ears',      label: 'Ears',     values: ['attached','detached'] },
      { type: 'color', key: 'baseColor', label: 'Skin',     values: ['77311d','ac6651','f9c9b6'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['000000','6bd9e9','77311d','9287ff','ac6651','d2eff3','e0ddff','f4d150','f9c9b6','fc909f','ffeba4','ffffff'] },
    ],
  },
  {
    id: 'lorelei',
    label: 'Lorelei',
    collection: lorelei,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',     values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12','variant13','variant14','variant15','variant16','variant17','variant18','variant19','variant20','variant21','variant22','variant23','variant24'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',    values: ['happy01','happy02','happy03','happy04','happy05','happy06','happy07','happy08','happy09','happy10','happy11','happy12','happy13','happy14','happy15','happy16','happy17','happy18','sad01','sad02','sad03','sad04','sad05','sad06','sad07','sad08','sad09'] },
      { type: 'enum',  key: 'hair',      label: 'Hair',     values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12','variant13','variant14','variant15','variant16','variant17','variant18','variant19','variant20','variant21','variant22','variant23','variant24','variant25','variant26','variant27','variant28','variant29','variant30','variant31','variant32','variant33','variant34','variant35','variant36','variant37','variant38','variant39','variant40','variant41','variant42','variant43','variant44','variant45','variant46','variant47','variant48'] },
      { type: 'enum',  key: 'head',      label: 'Head',     values: ['variant01','variant02','variant03','variant04'] },
      { type: 'enum',  key: 'eyebrows',  label: 'Eyebrows', values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12','variant13'] },
      { type: 'color', key: 'skinColor', label: 'Skin',     values: ['ffffff'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['000000'] },
    ],
  },
  {
    id: 'personas',
    label: 'Personas',
    collection: personas,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',     values: ['glasses','happy','open','sleep','sunglasses','wink'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',    values: ['bigSmile','frown','lips','pacifier','smile','smirk','surprise'] },
      { type: 'enum',  key: 'hair',      label: 'Hair',     values: ['bald','balding','beanie','bobBangs','bobCut','bunUndercut','buzzcut','cap','curly','curlyBun','curlyHighTop','extraLong','fade','long','mohawk','pigtails','shortCombover','shortComboverChops','sideShave','straightBun'] },
      { type: 'enum',  key: 'body',      label: 'Body',     values: ['checkered','rounded','small','squared'] },
      { type: 'enum',  key: 'nose',      label: 'Nose',     values: ['mediumRound','smallRound','wrinkles'] },
      { type: 'color', key: 'skinColor', label: 'Skin',     values: ['623d36','92594b','b16a5b','d78774','e5a07e','e7a391','eeb4a4'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['362c47','6c4545','dee1f5','e15c66','e16381','f27d65','f29c65'] },
    ],
  },
]
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest --testPathPattern="dicebear-styles" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/lib/dicebear-styles.ts tests/renderer/dicebear-styles.test.ts
git commit -m "feat: add dicebear-styles module with 7 curated styles"
```

---

## Task 3: Create `render-avatar.ts`

**Files:**
- Create: `src/renderer/lib/render-avatar.ts`
- Create: `tests/renderer/render-avatar.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/renderer/render-avatar.test.ts`:

```typescript
import { renderAvatar } from '../../src/renderer/lib/render-avatar'
import { createAvatar } from '@dicebear/core'

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toString: () => '<svg>test-avatar</svg>' })),
}))

jest.mock('../../src/renderer/lib/dicebear-styles', () => ({
  CURATED_STYLES: [
    { id: 'bottts',    label: 'Bottts',    collection: { __id: 'bottts' },    options: [] },
    { id: 'pixel-art', label: 'Pixel Art', collection: { __id: 'pixelArt' }, options: [] },
  ],
}))

const mockCreateAvatar = createAvatar as jest.Mock

beforeEach(() => {
  mockCreateAvatar.mockClear()
})

test('returns SVG string', () => {
  const result = renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'abc', options: {}, persona: '' })
  expect(result).toBe('<svg>test-avatar</svg>')
})

test('passes seed and options to createAvatar', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'myseed', options: { eyes: 'bulging' }, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.objectContaining({ seed: 'myseed', eyes: 'bulging' })
  )
})

test('uses first style as fallback when style id is unknown', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'unknown-style', seed: 'x', options: {}, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.anything()
  )
})

test('spreads options over seed so explicit options override seed-based values', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 's', options: { eyes: 'glow', baseColor: ['ff0000'] }, persona: '' })
  const callArgs = mockCreateAvatar.mock.calls[0][1]
  expect(callArgs.eyes).toBe('glow')
  expect(callArgs.baseColor).toEqual(['ff0000'])
  expect(callArgs.seed).toBe('s')
})

test('handles undefined options gracefully', () => {
  expect(() => {
    renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'x', persona: '' })
  }).not.toThrow()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest --testPathPattern="render-avatar" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/renderer/lib/render-avatar.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest --testPathPattern="render-avatar" --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/renderer/lib/render-avatar.ts tests/renderer/render-avatar.test.ts
git commit -m "feat: add renderAvatar utility"
```

---

## Task 4: Update `SpritePanel` to Use `renderAvatar`

**Files:**
- Modify: `src/renderer/components/SpritePanel.tsx`
- Modify: `tests/renderer/SpritePanel.test.tsx`

- [ ] **Step 1: Update the SpritePanel test mock**

In `tests/renderer/SpritePanel.test.tsx`, replace:

```typescript
jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toString: () => '<svg data-testid="mock-avatar"></svg>' })),
}))
jest.mock('@dicebear/collection', () => ({ bottts: {} }))
```

with:

```typescript
jest.mock('../../src/renderer/lib/render-avatar', () => ({
  renderAvatar: jest.fn(() => '<svg data-testid="mock-avatar"></svg>'),
}))
```

Also add `options: {}` to all sprite fixtures that call `createSprite` or `useSpritesStore.setState`. In the test that calls `createSprite({ name: 'Salty', style: 'bottts', seed: 'sailor', persona: '' })`, no change is needed since `options` is optional.

- [ ] **Step 2: Run tests to verify existing tests still pass with new mock**

```
npx jest --testPathPattern="SpritePanel" --no-coverage
```

Expected: PASS (all 7 existing tests)

- [ ] **Step 3: Update `SpritePanel.tsx`**

Replace the top imports:

```typescript
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'
```

with:

```typescript
import { renderAvatar } from '../lib/render-avatar'
```

Replace the avatar render block:

```typescript
let avatarSvg = ''
if (sprite) {
  try {
    avatarSvg = createAvatar(bottts, { seed: sprite.seed }).toString()
  } catch (err) {
    console.error(`[Sprite] Avatar render failed for sprite ${sprite.id}:`, err)
  }
}
```

with:

```typescript
let avatarSvg = ''
if (sprite) {
  try {
    avatarSvg = renderAvatar(sprite)
  } catch (err) {
    console.error(`[Sprite] Avatar render failed for sprite ${sprite.id}:`, err)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest --testPathPattern="SpritePanel" --no-coverage
```

Expected: PASS (all 7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/SpritePanel.tsx tests/renderer/SpritePanel.test.tsx
git commit -m "feat: update SpritePanel to use renderAvatar"
```

---

## Task 5: Redesign SpriteStudio EDIT View

**Files:**
- Modify: `src/renderer/components/SpriteStudio.tsx`
- Modify: `tests/renderer/SpriteStudio.test.tsx`

- [ ] **Step 1: Update the SpriteStudio test mocks and add new tests**

Replace all content in `tests/renderer/SpriteStudio.test.tsx` with:

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpriteStudio } from '../../src/renderer/components/SpriteStudio'
import { useSpritesStore } from '../../src/renderer/store/sprites'
import '@testing-library/jest-dom'

jest.mock('../../src/renderer/lib/render-avatar', () => ({
  renderAvatar: jest.fn(() => '<svg>avatar</svg>'),
}))

jest.mock('../../src/renderer/lib/dicebear-styles', () => ({
  CURATED_STYLES: [
    {
      id: 'bottts',
      label: 'Bottts',
      collection: {},
      options: [
        { type: 'enum',  key: 'eyes',      label: 'Eyes',  values: ['bulging', 'dizzy', 'eva'] },
        { type: 'color', key: 'baseColor', label: 'Color', values: ['ffb300', '1e88e5'] },
      ],
    },
    {
      id: 'pixel-art',
      label: 'Pixel Art',
      collection: {},
      options: [
        { type: 'enum', key: 'eyes', label: 'Eyes', values: ['variant01', 'variant02'] },
      ],
    },
  ],
}))

beforeEach(() => {
  useSpritesStore.setState({
    sprites: [
      { id: 'default-sprite', name: 'Overseer', style: 'bottts', seed: 'overseer', options: {}, persona: '...' },
    ],
    createSprite: jest.fn().mockReturnValue({ id: 'new-id', name: 'New', style: 'bottts', seed: 'x', options: {}, persona: '' }),
    updateSprite: jest.fn(),
    deleteSprite: jest.fn(),
    loadSprites: jest.fn(),
  })
})

describe('SpriteStudio — list view', () => {
  test('renders list view by default', () => {
    render(<SpriteStudio onClose={() => {}} />)
    expect(screen.getByText('Sprite Library')).toBeInTheDocument()
    expect(screen.getByText('Overseer')).toBeInTheDocument()
  })

  test('can switch to create view', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
    expect(screen.getByText('New Sprite')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  test('can switch to edit view from list', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Sprite')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Overseer')).toBeInTheDocument()
  })

  test('goes back to list from form', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('Sprite Library')).toBeInTheDocument()
  })
})

describe('SpriteStudio — EDIT view character creator', () => {
  beforeEach(() => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
  })

  test('shows style picker with Bottts by default', () => {
    expect(screen.getByText('Bottts')).toBeInTheDocument()
  })

  test('clicking right style arrow advances to Pixel Art', () => {
    // The style picker has two arrow buttons at the top of the creator
    const styleSection = screen.getByTestId('style-picker')
    const rightBtn = styleSection.querySelector('button:last-child')!
    fireEvent.click(rightBtn)
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
  })

  test('clicking left style arrow from first style wraps to last style', () => {
    const styleSection = screen.getByTestId('style-picker')
    const leftBtn = styleSection.querySelector('button:first-child')!
    fireEvent.click(leftBtn)
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
  })

  test('shows option labels for current style', () => {
    expect(screen.getByText('Eyes')).toBeInTheDocument()
    expect(screen.getByText('Color')).toBeInTheDocument()
  })

  test('enum option shows Random by default', () => {
    expect(screen.getAllByText('Random').length).toBeGreaterThan(0)
  })

  test('clicking right on enum option shows first value', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn)
    expect(screen.getByText('bulging')).toBeInTheDocument()
  })

  test('clicking left on enum option when at Random shows last value', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const leftBtn = eyesRow.querySelector('button:first-child')!
    fireEvent.click(leftBtn)
    expect(screen.getByText('eva')).toBeInTheDocument()
  })

  test('cycling from last enum value right returns to Random', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    // bulging → dizzy → eva → Random
    fireEvent.click(rightBtn) // bulging
    fireEvent.click(rightBtn) // dizzy
    fireEvent.click(rightBtn) // eva
    fireEvent.click(rightBtn) // Random
    expect(eyesRow.querySelector('[data-testid="option-value"]')?.textContent).toBe('Random')
  })

  test('changing style resets options (shows Random for all slots)', () => {
    // Select an eye value first
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn) // now shows 'bulging'
    expect(screen.getByText('bulging')).toBeInTheDocument()

    // Change style
    const styleSection = screen.getByTestId('style-picker')
    const styleRight = styleSection.querySelector('button:last-child')!
    fireEvent.click(styleRight)

    // Should show Pixel Art now and options reset
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
    expect(screen.queryByText('bulging')).not.toBeInTheDocument()
  })

  test('shows Randomize button', () => {
    expect(screen.getByText('🎲 Randomize')).toBeInTheDocument()
  })

  test('save calls store with style and options', () => {
    const { createSprite } = useSpritesStore.getState()
    const mockCreate = createSprite as jest.Mock

    // Select an eye value
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn) // eyes = bulging

    // Fill in name
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Bot' } })
    fireEvent.click(screen.getByText('Save'))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Bot',
        style: 'bottts',
        options: { eyes: 'bulging' },
      })
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx jest --testPathPattern="SpriteStudio" --no-coverage
```

Expected: FAIL — new tests can't find `data-testid="style-picker"` etc., and existing structure tests may pass but new ones fail.

- [ ] **Step 3: Rewrite `SpriteStudio.tsx`**

Replace the entire file with:

```typescript
import React, { useState } from 'react'
import { useSpritesStore, Sprite } from '../store/sprites'
import { renderAvatar } from '../lib/render-avatar'
import { CURATED_STYLES, type OptionDef } from '../lib/dicebear-styles'

interface Props {
  onClose: () => void
  editingId?: string | null
}

export function SpriteStudio({ onClose, editingId: initialEditingId }: Props) {
  const { sprites, createSprite, updateSprite, deleteSprite } = useSpritesStore()

  const [view, setView] = useState<'LIST' | 'EDIT'>(initialEditingId ? 'EDIT' : 'LIST')
  const [currentEditId, setCurrentEditId] = useState<string | null>(initialEditingId || null)

  const editing = currentEditId ? (sprites.find(s => s.id === currentEditId) ?? null) : null

  const [name, setName] = useState(editing?.name ?? '')
  const [style, setStyle] = useState(editing?.style ?? 'bottts')
  const [seed, setSeed] = useState(editing?.seed ?? Math.random().toString(36).slice(2, 10))
  const [options, setOptions] = useState<Record<string, unknown>>(editing?.options ?? {})
  const [persona, setPersona] = useState(editing?.persona ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const styleDef = CURATED_STYLES.find(s => s.id === style) ?? CURATED_STYLES[0]
  const styleIdx = CURATED_STYLES.findIndex(s => s.id === style)

  const handleStyleLeft = () => {
    const newIdx = (styleIdx - 1 + CURATED_STYLES.length) % CURATED_STYLES.length
    setStyle(CURATED_STYLES[newIdx].id)
    setOptions({})
  }

  const handleStyleRight = () => {
    const newIdx = (styleIdx + 1) % CURATED_STYLES.length
    setStyle(CURATED_STYLES[newIdx].id)
    setOptions({})
  }

  const handleEnumLeft = (def: OptionDef & { type: 'enum' }) => {
    const currentVal = options[def.key] as string | undefined
    const currentIdx = currentVal !== undefined ? def.values.indexOf(currentVal) : -1
    let newVal: string | undefined
    if (currentIdx === -1) {
      newVal = def.values[def.values.length - 1]
    } else if (currentIdx === 0) {
      newVal = undefined
    } else {
      newVal = def.values[currentIdx - 1]
    }
    if (newVal === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: newVal })
    }
  }

  const handleEnumRight = (def: OptionDef & { type: 'enum' }) => {
    const currentVal = options[def.key] as string | undefined
    const currentIdx = currentVal !== undefined ? def.values.indexOf(currentVal) : -1
    let newVal: string | undefined
    if (currentIdx === -1) {
      newVal = def.values[0]
    } else if (currentIdx === def.values.length - 1) {
      newVal = undefined
    } else {
      newVal = def.values[currentIdx + 1]
    }
    if (newVal === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: newVal })
    }
  }

  const handleColorSelect = (def: OptionDef & { type: 'color' }, color: string | undefined) => {
    if (color === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: [color] })
    }
  }

  const handleEdit = (sprite: Sprite) => {
    setCurrentEditId(sprite.id)
    setName(sprite.name)
    setStyle(sprite.style)
    setSeed(sprite.seed)
    setOptions(sprite.options ?? {})
    setPersona(sprite.persona)
    setView('EDIT')
  }

  const handleNew = () => {
    setCurrentEditId(null)
    setName('')
    setStyle('bottts')
    setSeed(Math.random().toString(36).slice(2, 10))
    setOptions({})
    setPersona('')
    setView('EDIT')
  }

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).slice(2, 10))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateSprite(editing.id, { name: name.trim(), style, seed, options, persona })
    } else {
      createSprite({ name: name.trim(), style, seed, options, persona })
    }
    setView('LIST')
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
      deleteSprite(id)
      setConfirmDelete(null)
      if (currentEditId === id) setView('LIST')
    } else {
      setConfirmDelete(id)
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(null), 2000)
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-header)', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '420px', maxWidth: '600px', width: '90%',
    maxHeight: '85vh', overflowY: 'auto',
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '6px 8px', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px',
  }
  const arrowBtnStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)',
    borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '14px', lineHeight: '1.4',
  }

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Sprite Library</h2>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
        {sprites.map(s => {
          let svg = ''
          try { svg = renderAvatar(s) } catch (e) {}
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px',
              background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border)',
            }}>
              <div style={{ width: '40px', height: '40px' }} dangerouslySetInnerHTML={{ __html: svg }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '14px' }}>{s.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  {s.persona}
                </div>
              </div>
              <button
                onClick={() => handleEdit(s)}
                style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                style={{
                  background: confirmDelete === s.id ? '#c0392b' : 'transparent',
                  color: confirmDelete === s.id ? '#fff' : '#e05252',
                  border: '1px solid #e05252', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer',
                }}
              >
                {confirmDelete === s.id ? 'Sure?' : 'Delete'}
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleNew}
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        + Create New Sprite
      </button>

      <div style={{
        marginTop: '12px', padding: '12px', background: 'var(--bg-main)',
        borderRadius: '4px', border: '1px dotted var(--border)', fontSize: '13px',
      }}>
        <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginBottom: '4px' }}>How to use Sprites</div>
        <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Assign a sprite to your session. When the AI outputs text wrapped in
          <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px', margin: '0 4px', color: 'var(--accent)' }}>
            &lt;speak&gt;...&lt;/speak&gt;
          </code>
          tags, it will appear in the sprite's speech bubble.
        </div>
      </div>
    </div>
  )

  const renderOptionSlot = (def: OptionDef) => {
    if (def.type === 'enum') {
      const currentVal = options[def.key] as string | undefined
      return (
        <div
          key={def.key}
          data-testid={`option-${def.key}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ width: '90px', color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>{def.label}</span>
          <button type="button" style={arrowBtnStyle} onClick={() => handleEnumLeft(def)}>←</button>
          <span
            data-testid="option-value"
            style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--text-main)', minWidth: '80px' }}
          >
            {currentVal ?? 'Random'}
          </span>
          <button type="button" style={arrowBtnStyle} onClick={() => handleEnumRight(def)}>→</button>
        </div>
      )
    }

    if (def.type === 'color') {
      const selectedColor = (options[def.key] as string[] | undefined)?.[0]
      return (
        <div
          key={def.key}
          data-testid={`option-${def.key}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
        >
          <span style={{ width: '90px', color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>{def.label}</span>
          <button
            type="button"
            onClick={() => handleColorSelect(def, undefined)}
            title="Random"
            style={{
              width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
              background: 'transparent', color: 'var(--text-muted)',
              border: selectedColor === undefined ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}
          >✕</button>
          {def.values.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(def, color)}
              title={`#${color}`}
              style={{
                width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', padding: 0,
                background: `#${color}`,
                border: selectedColor === color ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      )
    }

    return null
  }

  const renderForm = () => {
    let previewSvg = ''
    try {
      previewSvg = renderAvatar({ id: '', name: '', style, seed: seed || 'preview', options, persona })
    } catch (err) {}

    return (
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>{editing ? 'Edit Sprite' : 'New Sprite'}</h2>
          <button type="button" onClick={() => setView('LIST')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>← Back</button>
        </div>

        {/* Name + preview side by side */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <label style={{ ...labelStyle, flex: 1 }} htmlFor="sprite-name">
            Name
            <input id="sprite-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </label>
          {previewSvg && (
            <div
              style={{ width: '80px', height: '80px', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          )}
        </div>

        {/* Style picker */}
        <div
          data-testid="style-picker"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
        >
          <button type="button" style={arrowBtnStyle} onClick={handleStyleLeft}>←</button>
          <span style={{ color: 'var(--text-main)', fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
            {styleDef.label}
          </span>
          <button type="button" style={arrowBtnStyle} onClick={handleStyleRight}>→</button>
        </div>

        {/* Option slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {styleDef.options.map(renderOptionSlot)}
        </div>

        {/* Randomize */}
        <button
          type="button"
          onClick={handleRandomize}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          🎲 Randomize
        </button>

        {/* Persona */}
        <label style={labelStyle} htmlFor="sprite-persona">
          Persona
          <textarea
            id="sprite-persona"
            aria-label="Persona"
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
            value={persona}
            onChange={e => setPersona(e.target.value)}
            placeholder="Describe the character personality..."
          />
        </label>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setView('LIST')} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Save</button>
        </div>
      </form>
    )
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {view === 'LIST' ? renderList() : renderForm()}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx jest --testPathPattern="SpriteStudio" --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Run the full test suite to check for regressions**

```
npx jest --no-coverage
```

Expected: All renderer and main tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/SpriteStudio.tsx tests/renderer/SpriteStudio.test.tsx
git commit -m "feat: redesign SpriteStudio EDIT view with character creator UI"
```

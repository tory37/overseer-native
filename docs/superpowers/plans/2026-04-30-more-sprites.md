# More Default Sprites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 new default sprites (15 total) with specific DiceBear configurations and personas, ensuring existing users receive them automatically.

**Architecture:** Define a `DEFAULT_SPRITES` constant in the sprites store. Update the `loadSprites` logic to merge these defaults by ID into the user's stored sprites list.

**Tech Stack:** React, Zustand, TypeScript.

---

### Task 1: Define DEFAULT_SPRITES and Update Store Logic

**Files:**
- Modify: `src/renderer/store/sprites.ts`

- [ ] **Step 1: Add DEFAULT_SPRITES constant**

Replace the existing `DEFAULT_SPRITE` with the full `DEFAULT_SPRITES` array as defined in the spec.

```typescript
export const DEFAULT_SPRITES: Sprite[] = [
  {
    id: 'default-overseer',
    name: 'Overseer',
    style: 'bottts',
    seed: 'overseer',
    options: { eyes: 'round', mouth: 'smile01', top: 'antenna', baseColor: '1e88e5' },
    persona: 'You are the Overseer, a helpful AI assistant. You are witty, concise, and professional.',
  },
  {
    id: 'default-seamus',
    name: 'Seamus',
    style: 'avataaars',
    seed: 'Seamus',
    options: { top: 'winterHat02', mouth: 'serious', eyes: 'default', eyebrows: 'frownNatural', clothing: 'hoodie' },
    persona: 'You are Seamus, a crusty old sailor who is incredibly salty he\'s coding and not out fishing. You interject with nautical grumbles but you do the best job you can because that\'s how you were raised.',
  },
  {
    id: 'default-zen',
    name: 'Zen',
    style: 'lorelei',
    seed: 'Zen',
    options: { eyes: 'variant12', mouth: 'happy13', head: 'variant02' },
    persona: 'You are Zen, a meditative and calm coder. You encourage the user to breathe through stack traces and find inner peace in the code.',
  },
  {
    id: 'default-turbo',
    name: 'Turbo',
    style: 'bottts',
    seed: 'Turbo',
    options: { eyes: 'glow', mouth: 'grill01', top: 'radar', sides: 'antenna02', baseColor: 'f4511e' },
    persona: 'You are Turbo, a high-energy AI who loves optimization and speed. You talk fast and use lots of exclamation marks!',
  },
  {
    id: 'default-dr-debug',
    name: 'Dr. Debug',
    style: 'personas',
    seed: 'DrDebug',
    options: { eyes: 'open', mouth: 'smirk', hair: 'balding', nose: 'wrinkles', skinColor: 'e7a391' },
    persona: 'You are Dr. Debug, an academic and precise AI. You use sophisticated language to hypothesize about root causes and architectural integrity.',
  },
  {
    id: 'default-glitch',
    name: 'Glitch',
    style: 'bottts',
    seed: 'Glitch',
    options: { eyes: 'dizzy', mouth: 'diagram', top: 'horns', texture: 'grunge01', baseColor: '43a047' },
    persona: 'You are Glitch, an erratic AI who loves edge cases and occasionally speaks in leetspeak. You are fascinated by bugs.',
  },
  {
    id: 'default-nova',
    name: 'Nova',
    style: 'fun-emoji',
    seed: 'Nova',
    options: { eyes: 'stars', mouth: 'wideSmile' },
    persona: 'You are Nova, a cosmic explorer. You see code as a vast galaxy and use space metaphors to describe development.',
  },
  {
    id: 'default-chef',
    name: 'Chef',
    style: 'avataaars',
    seed: 'Chef',
    options: { top: 'winterHat03', mouth: 'smile', eyes: 'happy', clothing: 'blazerAndShirt' },
    persona: 'You are Chef, and you treat code like a five-star meal. You talk about "seasoning" logic and "whisking" functions until smooth.',
  },
  {
    id: 'default-detective',
    name: 'Detective',
    style: 'pixel-art',
    seed: 'Detective',
    options: { eyes: 'variant04', mouth: 'sad01', hair: 'short04', clothing: 'variant03', hairColor: '28150a' },
    persona: 'You are the Detective. You treat every bug like a noir mystery. The code is your beat, and you won\'t rest until the case is closed.',
  },
  {
    id: 'default-gamer',
    name: 'Gamer',
    style: 'pixel-art',
    seed: 'Gamer',
    options: { eyes: 'variant06', mouth: 'happy09', hair: 'short22', clothing: 'variant15', hairColor: '009bbd' },
    persona: 'You are Gamer. You use gaming slang and treat coding like a high-stakes match. Leveling up performance is your primary quest.',
  },
  {
    id: 'default-botanist',
    name: 'Botanist',
    style: 'lorelei',
    seed: 'Botanist',
    options: { eyes: 'variant05', mouth: 'happy02', hair: 'variant29', hairColor: '000000' },
    persona: 'You are Botanist. You use nature metaphors, talking about "pruning" dead code and "planting" new features to help the project bloom.',
  },
  {
    id: 'default-minimalist',
    name: 'Minimalist',
    style: 'personas',
    seed: 'Minimalist',
    options: { eyes: 'sleep', mouth: 'smile', hair: 'bald', body: 'small' },
    persona: 'You are Minimalist. You value extreme brevity. You speak only when necessary and keep your responses as short as possible.',
  },
  {
    id: 'default-historian',
    name: 'Historian',
    style: 'avataaars',
    seed: 'Historian',
    options: { top: 'turban', mouth: 'serious', eyes: 'default', eyebrows: 'default', clothing: 'blazerAndSweater' },
    persona: 'You are Historian. You frequently reminisce about the "good old days" of punch cards, COBOL, and manual memory management.',
  },
  {
    id: 'default-goth',
    name: 'Goth',
    style: 'micah',
    seed: 'Goth',
    options: { eyes: 'smilingShadow', mouth: 'frown', hair: 'pixie', eyebrows: 'down', hairColor: '000000' },
    persona: 'You are Goth, a melancholy and dark AI. You see the futility in every line of code, noting that everything is eventually deprecated.',
  },
  {
    id: 'default-coach',
    name: 'Coach',
    style: 'personas',
    seed: 'Coach',
    options: { eyes: 'happy', mouth: 'bigSmile', hair: 'cap', body: 'rounded', skinColor: 'fd9841' },
    persona: 'You are Coach. You are highly motivational and use sports metaphors. You believe in giving 110% on every pull request!',
  },
]
```

- [ ] **Step 2: Update loadSprites logic**

Modify `loadSprites` to merge `DEFAULT_SPRITES` into the loaded list.

```typescript
  loadSprites: async () => {
    if (!window.overseer?.readSprites) return
    const settings = await window.overseer.readSprites()
    let sprites = settings?.sprites || []
    
    // Ensure all default sprites are present
    let changed = false
    for (const def of DEFAULT_SPRITES) {
      if (!sprites.find((s: any) => s.id === def.id)) {
        sprites.push(def)
        changed = true
      }
    }

    if (changed) {
      window.overseer?.writeSprites?.({ sprites })
    }
    
    set({ sprites })
  }
```

- [ ] **Step 3: Update initial state**

Initialize the store with `DEFAULT_SPRITES` instead of `[DEFAULT_SPRITE]`.

```typescript
export const useSpritesStore = create<SpritesState>((set, get) => ({
  sprites: DEFAULT_SPRITES,
  // ... rest
}))
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/store/sprites.ts
git commit -m "feat: add 14 new default sprites and update merge logic"
```

---

### Task 2: Verify Merge Logic with Tests

**Files:**
- Modify: `tests/renderer/sprites-store.test.tsx`

- [ ] **Step 1: Add test case for merging defaults**

Add a test that simulates loading a `sprites.json` that only contains the old default, and verifies that the new defaults are appended and saved.

```typescript
it('merges new default sprites into existing user sprites', async () => {
  const existingSprites = [{ id: 'default-sprite', name: 'Overseer', ... }]
  window.overseer.readSprites = vi.fn().mockResolvedValue({ sprites: existingSprites })
  window.overseer.writeSprites = vi.fn()

  const { result } = renderHook(() => useSpritesStore())
  await act(async () => {
    await result.current.loadSprites()
  })

  expect(result.current.sprites.length).toBeGreaterThanOrEqual(15)
  expect(window.overseer.writeSprites).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests**

Run: `npm test tests/renderer/sprites-store.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/renderer/sprites-store.test.tsx
git commit -m "test: verify default sprite merging logic"
```

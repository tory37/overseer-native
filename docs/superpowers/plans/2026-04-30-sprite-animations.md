# Sprite Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Idle, Thinking, and Speaking animations for Overseer sprites.

**Architecture:** A state machine in `SpritePanel` tracks activity. "Speaking" uses a mouth-toggling timer and DiceBear property overrides. "Thinking" and "Idle" use CSS keyframe animations.

**Tech Stack:** React, TypeScript, DiceBear API, CSS Keyframes.

---

### Task 1: Extend `renderAvatar` for Overrides

**Files:**
- Modify: `src/renderer/lib/render-avatar.ts`
- Test: `tests/renderer/render-avatar.test.tsx`

- [ ] **Step 1: Write test for overrides**
```typescript
import { renderAvatar } from '../src/renderer/lib/render-avatar'
import { Sprite } from '../src/renderer/store/sprites'

const testSprite: Sprite = {
  id: 'test',
  name: 'Test',
  style: 'bottts',
  seed: 'test',
  options: { mouth: 'smile01' },
  persona: 'test'
}

describe('renderAvatar overrides', () => {
  it('should apply mouth override', () => {
    const normal = renderAvatar(testSprite)
    const overridden = renderAvatar(testSprite, { mouth: 'bite' })
    expect(overridden).not.toBe(normal)
    expect(overridden).toContain('bite')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/renderer/render-avatar.test.tsx`
Expected: Compilation error (renderAvatar doesn't accept 2nd arg)

- [ ] **Step 3: Implement overrides in `renderAvatar`**
```typescript
import { createAvatar } from '@dicebear/core'
import { CURATED_STYLES } from './dicebear-styles'
import type { Sprite } from '../store/sprites'

export function renderAvatar(sprite: Sprite, overrides?: Record<string, unknown>): string {
  const styleDef = CURATED_STYLES.find(s => s.id === sprite.style) ?? CURATED_STYLES[0]
  
  const baseOptions = sprite.options ?? {}
  const mergedOptions = { ...baseOptions, ...overrides }

  const opts = Object.fromEntries(
    Object.entries(mergedOptions).map(([k, v]) => [k, typeof v === 'string' ? [v] : v])
  )
  
  return createAvatar(styleDef.collection, {
    seed: sprite.seed,
    ...opts,
  }).toString()
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/renderer/render-avatar.test.tsx`

- [ ] **Step 5: Commit**
```bash
git add src/renderer/lib/render-avatar.ts
git commit -m "feat: add overrides support to renderAvatar"
```

---

### Task 2: Add Global Animation Keyframes

**Files:**
- Modify: `src/renderer/index.html`

- [ ] **Step 1: Add keyframes to `<style>` block**
```html
<style>
  /* ... existing styles ... */
  @keyframes overseer-idle-breath {
    from { transform: translateY(0); }
    to { transform: translateY(3px); }
  }
  @keyframes overseer-thinking-wobble {
    0% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.02) rotate(-1deg); }
    75% { transform: scale(1.02) rotate(1deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes overseer-speaking-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  .overseer-sprite-idle { animation: overseer-idle-breath 3s ease-in-out infinite alternate; }
  .overseer-sprite-thinking { animation: overseer-thinking-wobble 0.6s ease-in-out infinite; }
  .overseer-sprite-speaking { animation: overseer-speaking-pulse 0.2s ease-in-out infinite; }
</style>
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/index.html
git commit -m "style: add sprite animation keyframes"
```

---

### Task 3: Implement `SpritePanel` Animation Logic

**Files:**
- Modify: `src/renderer/components/SpritePanel.tsx`

- [ ] **Step 1: Define mouth mapping constant**
```typescript
const MOUTH_MAP: Record<string, string> = {
  'bottts': 'bite',
  'pixel-art': 'happy13',
  'fun-emoji': 'shout',
  'avataaars': 'screamOpen',
  'micah': 'laughing',
  'personas': 'surprise',
}
```

- [ ] **Step 2: Implement state tracking and mouth toggle**
```typescript
// Inside SpritePanel component:
const [lastPtyTime, setLastPtyTime] = useState(0)
const [isMouthOpen, setIsMouthOpen] = useState(false)

// Listen for PTY activity
useEffect(() => {
  if (!sessionId) return
  const unsub = window.overseer.onCompanionData((id, data) => {
    // Note: We need to ensure we only track the active companion's data if possible,
    // or just any data for this session. The IPC currently sends (id, data).
    // For simplicity, we'll assume any companion data for this session counts as "Thinking".
    setLastPtyTime(Date.now())
  })
  return unsub
}, [sessionId])

// Mouth toggle timer for speaking
useEffect(() => {
  if (!speechText) {
    setIsMouthOpen(false)
    return
  }
  const interval = setInterval(() => {
    setIsMouthOpen(prev => !prev)
  }, 150)
  return () => clearInterval(interval)
}, [speechText])

// Derive animation state
const now = Date.now()
const isThinking = !speechText && (now - lastPtyTime < 2000)
const isSpeaking = !!speechText
const animationClass = isSpeaking ? 'overseer-sprite-speaking' : (isThinking ? 'overseer-sprite-thinking' : 'overseer-sprite-idle')

// Render with overrides
let avatarSvg = ''
if (sprite) {
  const overrides: Record<string, unknown> = {}
  if (isSpeaking && isMouthOpen) {
    overrides.mouth = MOUTH_MAP[sprite.style] || 'smile'
  }
  avatarSvg = renderAvatar(sprite, overrides)
}
```

- [ ] **Step 3: Update JSX to apply animation class**
```tsx
<div
  className={animationClass}
  style={{ width: '80px', height: '80px' }}
  dangerouslySetInnerHTML={{ __html: avatarSvg }}
/>
```

- [ ] **Step 4: Commit**
```bash
git add src/renderer/components/SpritePanel.tsx
git commit -m "feat: implement SpritePanel animation state machine"
```

---

### Task 4: Add Preview Mode to `SpriteStudio`

**Files:**
- Modify: `src/renderer/components/SpriteStudio.tsx`

- [ ] **Step 1: Add preview state control**
```typescript
const [previewState, setPreviewState] = useState<'idle' | 'thinking' | 'speaking'>('idle')
const [isMouthOpen, setIsMouthOpen] = useState(false)

// Mouth toggle for preview
useEffect(() => {
  if (previewState !== 'speaking') {
    setIsMouthOpen(false)
    return
  }
  const interval = setInterval(() => setIsMouthOpen(prev => !prev), 150)
  return () => clearInterval(interval)
}, [previewState])
```

- [ ] **Step 2: Update preview rendering**
```typescript
const overrides: Record<string, unknown> = {}
if (previewState === 'speaking' && isMouthOpen) {
  overrides.mouth = MOUTH_MAP[style] || 'smile'
}
const svg = renderAvatar({ style, seed, options, name: '', persona: '', id: '' }, overrides)

const animationClass = previewState === 'speaking' ? 'overseer-sprite-speaking' : (previewState === 'thinking' ? 'overseer-sprite-thinking' : 'overseer-sprite-idle')
```

- [ ] **Step 3: Add toggle buttons to UI**
Add a row of buttons to switch `previewState`.

- [ ] **Step 4: Commit**
```bash
git add src/renderer/components/SpriteStudio.tsx
git commit -m "feat: add animation preview to SpriteStudio"
```

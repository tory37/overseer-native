# Design Spec: Sprite Animations

Implementation of animated states (Idle, Thinking, Speaking) for Overseer sprites using a combination of DiceBear property swapping and CSS animations.

## Goals
- Make sprites feel "alive" and reactive to terminal activity.
- Support "Speaking" animation via mouth-toggling for all 6 curated DiceBear styles.
- Support "Thinking" and "Idle" animations via CSS.
- Ensure the Persona Studio allows previewing these states.

## Architecture

### 1. State Machine
A new state machine will manage the active animation state within the `SpritePanel` and `SpriteStudio` components.

| State | Trigger | Priority | Visual Effect |
|-------|---------|----------|---------------|
| **Speaking** | Active `speechText` (from `<speak>` tags) | 1 (Highest) | Toggling between open/closed mouth + pulse CSS |
| **Thinking** | Incoming PTY data (any activity) | 2 | Subtle wobble/pulse CSS |
| **Idle** | No PTY activity for > 2 seconds | 3 | Slow breathing vertical float CSS |

### 2. Speaking Animation (Mouth Toggling)
When the state is `Speaking`, a timer will toggle a boolean `isMouthOpen` every ~150ms. The `renderAvatar` function will be extended (or wrapped) to allow overriding specific options.

**Mouth Mapping Table:**
| Style | Open Mouth ID |
|-------|---------------|
| `bottts` | `bite` |
| `pixel-art` | `happy13` |
| `fun-emoji` | `shout` |
| `avataaars` | `screamOpen` |
| `micah` | `laughing` |
| `personas` | `surprise` |

### 3. CSS Animations (Global)
These animations apply to the SVG container regardless of the sprite style.

- **`overseer-idle`**: `translateY(0)` to `translateY(3px)` (3-4s duration, ease-in-out, infinite alternate).
- **`overseer-thinking`**: `scale(1.0)` to `scale(1.03)` + `rotate(-1deg)` to `rotate(1deg)` (0.5s duration, infinite).
- **`overseer-speaking`**: Subtle scale pulse (0.2s duration) synced with mouth toggle.

## Components & Changes

### `src/renderer/components/SpritePanel.tsx`
- Add `lastPtyActivity` state to track when data last arrived.
- Add `animationState` derived from `speechText` and `lastPtyActivity`.
- Implement `useEffect` for `onCompanionData` (or similar) to update activity timestamp.
- Implement the mouth-toggle timer.

### `src/renderer/lib/render-avatar.ts`
- Modify `renderAvatar` to accept an optional `overrides` parameter:
  ```typescript
  export function renderAvatar(sprite: Sprite, overrides?: Record<string, unknown>): string
  ```

### `src/renderer/components/SpriteStudio.tsx`
- Add a "Preview State" toggle (Idle / Thinking / Speaking) to allow users to see how their custom sprite looks while animated.

### CSS (Global or Component-level)
- Define `@keyframes` for `idle-breath` and `thinking-wobble`.

## Testing Strategy
- **Manual Verification:** Use the Persona Studio to cycle through states for each of the 6 styles.
- **Integration Test:** Simulate PTY data and verify the `SpritePanel` transitions to "Thinking".
- **Integration Test:** Simulate `<speak>` tags and verify "Speaking" state takes priority.

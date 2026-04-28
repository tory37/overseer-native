# Sprite Feature Design

**Date:** 2026-04-28  
**Status:** Approved  

## Summary

A character companion ("Sprite") that sits in the right sidebar and reacts to AI terminal output via speech bubbles. Each session is assigned a Sprite at creation time; the Sprite's persona is injected into the AI's system prompt at spawn. The feature is entirely optional and must not interfere with normal terminal UX.

---

## Architecture Overview

### Layers

**Main process**
- `src/main/sprite-parser.ts` — pure function `parseSpriteSpeech(chunk: string)` extracts `<speak>…</speak>` content from raw PTY data
- `src/main/pty-manager.ts` — calls `parseSpriteSpeech` in `onData`, emits `companion:sprite-speech` IPC event with `{ sessionId, text }` when speech is found; raw stream is untouched
- Agent spawn logic — prepends the Sprite's persona to the system prompt when the session has a `spriteId`

**Renderer**
- `src/renderer/store/sprites.ts` — Zustand store persisted to localStorage; holds Sprite definitions and active-session Sprite mapping
- `src/renderer/components/RightSidebar.tsx` — wraps the existing GitPanel and the new SpritePanel in a single right-column container
- `src/renderer/components/SpritePanel.tsx` — renders avatar, speech bubble, empty state; subscribes to `companion:sprite-speech`
- `src/renderer/components/SpriteStudio.tsx` — modal for creating and editing Sprites

**Preload / IPC**
- `src/preload/ipc.ts` — exposes `onSpriteSpeech(cb)` to the renderer

### Key constraint
Tags are **not** stripped from the PTY stream. They appear as plaintext in the xterm terminal. This is an accepted MVP tradeoff — stripping is a post-MVP option once the side-channel parsing is proven stable.

---

## Component Breakdown

### `sprites` Zustand store (`src/renderer/store/sprites.ts`)
```ts
interface Sprite {
  id: string           // uuid
  name: string
  style: string        // DiceBear collection key — MVP: 'bottts'
  seed: string         // DiceBear seed string
  persona: string      // freeform text injected as system prompt prefix
}

interface SpritesState {
  sprites: Sprite[]
  createSprite(s: Omit<Sprite, 'id'>): void
  updateSprite(id: string, patch: Partial<Omit<Sprite, 'id'>>): void
  deleteSprite(id: string): void
}
```
Persisted to localStorage via Zustand `persist` middleware, same pattern as the theme store.

### `Session` type
`spriteId: string | null` added to the session object. Set at session creation, never changed at runtime.

### `RightSidebar` (`src/renderer/components/RightSidebar.tsx`)
- Replaces the direct `<GitPanel>` render in `App.tsx`
- Stacks GitPanel on top, SpritePanel below
- Passes `activeSession` down to both panels

### `SpritePanel` (`src/renderer/components/SpritePanel.tsx`)
Props:
```ts
interface SpritePanelProps {
  sessionId: string | null
  spriteId: string | null
  animationState: 'idle' | 'talking' | 'thinking'  // no-op in MVP; prop exists for future extension
  visible: boolean
}
```
Behavior:
- No sprite assigned → renders "No Sprite assigned" empty state with a prompt to open the Studio
- Sprite assigned → renders DiceBear SVG avatar + speech bubble with last received `<speak>` text
- Subscribes to `window.overseer.onSpriteSpeech` filtered by `sessionId`
- Speech bubble clears after a configurable timeout (default 8s)

### `SpriteStudio` (`src/renderer/components/SpriteStudio.tsx`)
- Full-screen modal, keyboard-navigable
- Fields: Name, Avatar Style (MVP: `bottts` only), Seed (text input with live SVG preview), Persona (multiline textarea)
- Create / Edit / Delete actions
- Opened via `Ctrl+Shift+P` or from the empty state in SpritePanel

### `sprite-parser.ts` (`src/main/sprite-parser.ts`)
```ts
interface ParsedSpriteEvent {
  type: 'speech'
  text: string
}

function parseSpriteSpeech(chunk: string): ParsedSpriteEvent[]
```
- Pure function; no side effects; testable in isolation
- Returns array to support future tag types (`emotion`, `action`, etc.)
- Handles multi-chunk tag splits gracefully (stateless MVP: only matches complete tags in a single chunk)

---

## Data Flow

### Speech detection
```
PTY onData(chunk)
  → parseSpriteSpeech(chunk)          // main process, pure
  → if events found: emit IPC 'companion:sprite-speech' { sessionId, text }
  → raw chunk forwarded to xterm unchanged
```

### Renderer subscription
```
window.overseer.onSpriteSpeech(({ sessionId, text }) => {
  if (sessionId === activeSession.id) setSpeechText(text)
})
```

### Persona injection
```
createSession({ spriteId, ... })
  → look up sprite.persona from store
  → prepend to system prompt: `[${sprite.name}]\n${sprite.persona}\n---\n`
  → spawn PTY with modified prompt
```
Persona is bound at spawn time only — no runtime switching.

---

## Studio Modal

**Layout:** Full-screen overlay (same pattern as SettingsModal).

**Form fields:**
| Field | Type | Notes |
|-------|------|-------|
| Name | text input | Required |
| Avatar Style | dropdown | MVP: `bottts` only; more styles post-MVP |
| Seed | text input | Live SVG preview updates on change |
| Persona | textarea | Freeform; injected verbatim as system prompt prefix |

**Actions:**
- Save (create or update)
- Delete (with confirmation — confirm state auto-clears after 2s, same pattern as session kill)
- Cancel / close

**Keyboard navigation:** Tab through fields, Enter to save, Escape to cancel. Arrow keys on avatar style dropdown.

---

## Keybindings

| Action | Default | `KeybindingAction` key |
|--------|---------|------------------------|
| Toggle Sprite panel visibility | `Ctrl+Shift+S` | `toggleSpritePanel` |
| Open Sprite Studio | `Ctrl+Shift+P` | `openSpriteStudio` |

Both added to `KeybindingAction`, `DEFAULT_KEYBINDINGS`, and the shortcuts modal in the same PR. No runtime sprite-switching shortcut — runtime switching is not supported.

---

## Error Handling

All failure paths fail silently from the user's perspective but **must log to console** with a `[Sprite]` prefix and descriptive message. No toasts or error UI — the Sprite is a gimmick and must never interrupt the main workflow.

| Scenario | Behavior |
|----------|----------|
| DiceBear render fails | Log `[Sprite] Avatar render failed for sprite <id>: <error>`; show placeholder (empty box) |
| `parseSpriteSpeech` throws | Log `[Sprite] Speech parse error: <error>`; skip emission, PTY stream continues unaffected |
| IPC emission fails | Log `[Sprite] Failed to emit sprite-speech event for session <sessionId>: <error>` |
| Sprite not found for session | Log `[Sprite] Sprite <spriteId> not found in store for session <sessionId>`; render empty state |
| Persona injection fails | Log `[Sprite] Persona injection failed for session <sessionId>: <error>`; session spawns without persona (graceful degradation) |

---

## Testing

### Unit
- `parseSpriteSpeech`: complete tag in one chunk, no tag, multiple tags, malformed/unclosed tags, empty string
- Sprite store: create, update, delete, persistence round-trip

### Integration
- PTY `onData` hook: mock chunk with `<speak>` tag → verify IPC event emitted, verify raw chunk forwarded unchanged
- Persona injection: session with `spriteId` → verify system prompt contains persona prefix; session without `spriteId` → verify prompt unchanged

### Component / smoke
- `SpritePanel` renders empty state when `spriteId` is null
- `SpritePanel` renders avatar + speech bubble when speech received
- `SpriteStudio` opens, fills form, saves → sprite appears in store

---

## Post-MVP Roadmap

These are explicitly deferred. The code is structured to support all of them without a rewrite.

**Animations**
- `SpritePanel` already accepts `animationState` prop as a no-op
- Implement: `talking` → mouth animation during `<speak>` open/close; `thinking` → when terminal output is actively streaming; `idle` → looping background animation
- DiceBear SVGs don't animate natively — likely requires CSS keyframes on SVG paths or a sprite sheet approach

**Tag stripping from PTY output**
- Tags currently appear as plaintext in xterm (accepted MVP tradeoff)
- Future option: strip `<speak>…</speak>` from the rendered xterm stream after side-channel parsing is proven stable

**Additional avatar styles**
- `@dicebear/collection` ships many styles (`adventurer`, `avataaars`, `lorelei`, etc.)
- Add a style picker to the Studio — MVP hardcodes `bottts`

**Richer tag types**
- `parseSpriteSpeech` returns `ParsedSpriteEvent[]` — array is already typed for extensibility
- Future: `<emotion>happy</emotion>`, `<action>wave</action>` to drive animations

**Sprite import/export**
- Export a Sprite definition as JSON; import = "create from JSON" in Studio

**Keyboard shortcut for session-sprite assignment**
- Currently Sprite is bound only at session creation
- Future: shortcut to open a "reassign sprite" picker for the active session (persona re-injected on next restart or via an explicit re-inject command)

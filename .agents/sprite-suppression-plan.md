# Sprite Suppression — Implementation Plan

## Overview

Remove the Sprite system and the Overseer context-injection system entirely.
Sprite source files are **kept on disk but fully commented out** with an explanation of why they were removed.
The GitPanel in the right sidebar expands to full height once SpritePanel is gone.

---

## What "Overseer context-injection system" means

`agent-config.ts` hardcodes a `CORE_SCAFFOLDING` string ("You are an AI assistant running inside Overseer…") that gets prepended to every agent's system prompt. The `wrapper-templates.ts` bash scripts read `context.json` (persona, spriteName, instructions) and pass them to `claude`/`gemini` via `--system-prompt`. This is the system being removed.

---

## Tests First

### Tests to update (currently passing; will break once we change the source)

| File | What to change |
|------|----------------|
| `tests/main/agent-config.test.ts` | Remove all `toContain('You are an AI assistant running inside Overseer')` assertions; instructions now start empty and only contain user-provided content |
| `tests/renderer/App-shortcuts-toggle.test.tsx` | Remove the `Ctrl+Shift+P toggles SpriteStudio` test; remove `SpriteStudio` mock |
| `tests/renderer/KeyboardShortcutsModal.test.tsx` | Remove any assertions on the SPRITE group or `toggleSpritePanel`/`openSpriteStudio` actions |
| `tests/renderer/NewSessionDialog.test.tsx` | Remove any sprite-select field assertions |
| `tests/renderer/useKeyboardShortcuts.test.tsx` | Remove `onToggleSpritePanel` / `onOpenSpriteStudio` handler tests |

### Tests to delete (test sprite features that no longer exist)

| File | Reason |
|------|--------|
| `tests/main/sprite-parser.test.ts` | SpriteParser is suppressed |
| `tests/main/session-service-sprite.test.ts` | `updateSprite()` is removed from SessionService |
| `tests/renderer/SpritePanel.test.tsx` | SpritePanel is suppressed |
| `tests/renderer/SpriteStudio.test.tsx` | SpriteStudio is suppressed |
| `tests/renderer/SpriteStore.test.tsx` | Sprite store is suppressed |
| `tests/renderer/sprites-store.test.tsx` | Sprite store is suppressed |
| `tests/renderer/dicebear-styles.test.tsx` | Dicebear avatar rendering is sprite-only |
| `tests/renderer/render-avatar.test.tsx` | Avatar rendering is sprite-only |

---

## Implementation Steps

### Step 1 — Branch
```
git checkout -b feat/sprite-suppression
```

### Step 2 — Main process: agent-config injection removal

**`src/main/session-service/agent-config.ts`**
- Remove the `CORE_SCAFFOLDING` constant entirely.
- Initialize `instructions` as an empty string `''` instead of `CORE_SCAFFOLDING`.
- Keep the rest of the function (it still loads user-provided JSON/MD instructions from `~/.overseer`).

**`src/main/session-service/wrapper-templates.ts`**
- Remove `PERSONA`, `SPRITE_NAME`, `CONTEXT` variable reads from `context.json`.
- Remove the persona-injection logic (`BRIDGE`, `COMBINED` with persona).
- If `INSTRUCTIONS` is non-empty, still pass `--system-prompt "$INSTRUCTIONS"` so user-defined agent instructions keep working.
- Remove the gemini-specific persona injection path; keep the `--include-directories` approach only if INSTRUCTIONS exist.
- Rationale: keep user-provided instruction injection (legitimate power-user feature), drop Overseer-authored injection.

**`src/main/session-service/index.ts`**
- In `create()`: Remove `session.envVars['OVERSEER_SPRITE_PERSONA']` and `(session as any).spriteName` lines.
- In `ensureSessionEnvironment()`: Simplify `context.json` write to only include `{ instructions }` (no persona, spriteId, spriteName).
- Remove `updateSprite()` method entirely.

### Step 3 — Main process: sprite IPC removal

**`src/main/sprite-parser.ts`**
- Comment out the entire file content.
- Leave a top-level comment:
  ```
  // SPRITE SYSTEM SUPPRESSED
  // The sprite parser was removed because the Sprite system was too
  // architecturally fragile for the value it provided. See feat/sprite-suppression.
  ```

**`src/main/ipc-handlers.ts`**
- Remove `import { SpriteParser }` and `import { IPC.SPRITE_SPEECH }`.
- Remove `const spriteParsers = new Map<string, SpriteParser>()`.
- Remove the sprite-parsing block inside `service.onData(...)` (keep the PTY data forwarding).
- Remove `spriteParsers.delete(sessionId)` from the `SESSION_KILL` handler.
- Remove `SPRITE_READ` and `SPRITE_WRITE` `ipcMain.handle` registrations.
- Remove `service.updateSprite(...)` call inside the `SPRITE_WRITE` handler.

**`src/main/preload.ts`**
- Remove `onSpriteSpeech`, `readSprites`, `writeSprites` from the exposed API.

### Step 4 — IPC type definitions

**`src/renderer/types/ipc.ts`**
- Remove `spriteId` from the `Session` interface.
- Remove `spriteId`, `spriteName`, `persona` from `CreateSessionOptions`.
- Remove `toggleSpritePanel` and `openSpriteStudio` from `KeybindingAction` union.
- Remove those two from `DEFAULT_KEYBINDINGS` and `ACTION_LABELS`.
- Remove `SPRITE_SPEECH`, `SPRITE_READ`, `SPRITE_WRITE` from the `IPC` const object.

**`src/renderer/types/electron.d.ts`**
- Remove `onSpriteSpeech`, `readSprites`, `writeSprites` from the `Window.overseer` interface.

### Step 5 — Renderer: sprite store & components (comment out, keep files)

**`src/renderer/store/sprites.ts`**
- Comment out all code.
- Add top block:
  ```
  // SPRITE SYSTEM SUPPRESSED
  // The sprite store was removed because the Sprite system was too architecturally
  // fragile for the value it provided. The Sprite data model and default personas
  // are preserved here for potential future reimplementation. See feat/sprite-suppression.
  ```

**`src/renderer/components/SpritePanel.tsx`**
- Comment out all code.
- Add top block:
  ```
  // SPRITE SYSTEM SUPPRESSED
  // SpritePanel was the sidebar companion display — removed along with the full
  // Sprite system. Preserved for potential future reimplementation.
  // See feat/sprite-suppression.
  ```

**`src/renderer/components/SpriteStudio.tsx`**
- Comment out all code.
- Add top block with the same rationale comment.

### Step 6 — Renderer: UI wiring cleanup

**`src/renderer/components/RightSidebar.tsx`**
- Remove `SpritePanel` import.
- Remove `spritePanelVisible` and `onOpenStudio` props.
- Remove `<SpritePanel .../>` from JSX.
- `GitPanel` will naturally expand to full height since it is the only child in the flex column container.

**`src/renderer/components/NewSessionDialog.tsx`**
- Remove `import { useSpritesStore }` and `sprites` usage.
- Remove `selectedSpriteId` state.
- Remove the Sprite `<select>` field from the form.
- In `handleSubmit`, pass only `{ name, agentType, cwd }` to `onCreate` (no sprite fields).

**`src/renderer/hooks/useKeyboardShortcuts.ts`**
- Remove `onToggleSpritePanel` and `onOpenSpriteStudio` from `ShortcutHandlers` interface.
- Remove their dispatch cases in the `handleKeyDown` listener.

**`src/renderer/components/KeyboardShortcutsModal.tsx`**
- Remove the `{ title: 'SPRITE', actions: ['toggleSpritePanel', 'openSpriteStudio'] }` entry from `GROUPS`.

**`src/renderer/App.tsx`**
- Remove `import { SpriteStudio }` and its JSX render.
- Remove `import { useSpritesStore }` and `loadSprites()` call.
- Remove `showSpriteStudio`, `spriteStudioEditId`, `spritePanelVisible` state variables.
- Remove `onToggleSpritePanel` and `onOpenSpriteStudio` from the `useKeyboardShortcuts` call.
- Remove the `onOpenStudio` prop from `<RightSidebar>`.
- `<RightSidebar>` prop signature shrinks to just `activeSession`.

### Step 7 — Delete unused test files

Delete the 8 test files listed in the "Tests to delete" table above.

---

## Key Decisions

- **Files kept but commented out**: `sprite-parser.ts`, `SpritePanel.tsx`, `SpriteStudio.tsx`, `sprites.ts`. This preserves the data model and logic for potential future reimplementation without littering git history with large deletions.
- **User-provided agent instructions are kept**: The wrapper scripts still inject user-defined instructions from `~/.overseer/agents/*.json` and `~/.overseer/*.md`. Only the hardcoded Overseer scaffolding and sprite persona are stripped.
- **`spriteId` removed from Session/CreateSessionOptions**: No existing sessions reference a live sprite, so dropping the field is safe. Old session JSON files with a `spriteId` key will simply have an extra ignored field.
- **GitPanel full-height is free**: The right sidebar is a flex column; once `<SpritePanel>` is gone, `<GitPanel>` auto-expands.
- **No new dependencies or config needed.**

---

## Optional Improvements (not in scope for this session)

- Remove `lib/dicebear-styles.ts` and `lib/render-avatar.ts` (sprite rendering only) once confirmed nothing else imports them.
- Audit `~/.overseer/sprites.json` migration for existing users (can be handled lazily — the file is simply ignored).

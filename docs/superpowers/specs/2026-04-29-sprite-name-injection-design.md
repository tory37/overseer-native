# Design Spec: Sprite Name Injection

Inject the sprite's name into the AI's system prompt to ensure the AI knows its identity when a persona is active.

## Problem
Currently, the AI is given a persona but is not explicitly told its "name" as defined in the Sprite Studio. This leads to the AI potentially referring to itself by default names or generic terms instead of its assigned character name.

## Proposed Changes

### 1. Main Process: SessionService (`src/main/session-service/index.ts`)
- **Update `ensureSessionEnvironment`**: When writing `context.json`, include the `spriteName`. It will need to look up the sprite in the configuration or registry to get the current name.
- **Update `updateSprite`**: Add a `name` parameter to this method so it can update `context.json` with the new name when a sprite is modified in the Studio.

### 2. Main Process: IPC Handlers (`src/main/ipc-handlers.ts`)
- **Update `IPC.SPRITE_WRITE`**: When a sprite is saved, the handler iterates through active sessions. It should now pass both the `sprite.persona` and `sprite.name` to `service.updateSprite`.

### 3. Wrapper Templates (`src/main/session-service/wrapper-templates.ts`)
- **Extract Name**: Add logic to extract `NAME` from `context.json`.
- **Prepend to Persona**: Modify the prompt construction logic. If a name is present, prepend "Your name is [NAME]." to the persona description.

## Data Flow
1. **Creation**: `NewSessionDialog` passes `persona` and `spriteId`. `SessionService.create` stores these.
2. **Environment Setup**: `ensureSessionEnvironment` reads the sprite name (if `spriteId` exists) and writes `{ persona, instructions, spriteId, spriteName }` to `context.json`.
3. **Execution**: The wrapper script reads `context.json`, extracts `spriteName` and `persona`, and combines them into the `--system-prompt` or `-i` flag.
4. **Update**: When Sprite Studio saves a sprite, `IPC.SPRITE_WRITE` triggers `updateSprite` for all sessions using that sprite, refreshing `context.json` with the new name and persona.

## Success Criteria
- The system prompt injected into Claude/Gemini contains "Your name is [Sprite Name]." followed by the persona description.
- Renaming a sprite in the Studio and clicking "Save" immediately updates the name in `context.json` for active sessions.

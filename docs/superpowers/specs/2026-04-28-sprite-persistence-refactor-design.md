# Design Spec: Sprite Persistence & Config Refactor

This spec outlines the transition from `localStorage` persistence for sprites to a centralized, file-based persistence system in the `~/.overseer/` directory, while also fixing CLI injection bugs.

## Goals
- Fix sprite persistence bug by moving storage to `~/.overseer/sprites.json`.
- Refactor Main process persistence logic into a centralized `ConfigService`.
- Fix `gemini` CLI injection error ("unknown argument system prompt").

## Proposed Changes

### 1. Main Process: ConfigService
Create `src/main/services/config-service.ts` to provide a unified interface for all configuration files.

```typescript
export class ConfigService {
  private baseDir: string = path.join(os.homedir(), '.overseer');

  async read<T>(filename: string): Promise<T | null> {
    const p = path.join(this.baseDir, filename);
    // ... logic to read and parse JSON
  }

  async write<T>(filename: string, data: T): Promise<void> {
    const p = path.join(this.baseDir, filename);
    // ... logic to ensure directory and write JSON
  }
}
```

### 2. Main Process: IPC Handlers
Update `src/main/ipc-handlers.ts` to:
- Use `ConfigService` for Themes, Keybindings, and Sprites.
- Register `SPRITE_READ` and `SPRITE_WRITE` handlers.
- Remove redundant `readFromDisk` / `writeToDisk` helper functions.

### 3. Preload Script
Update `src/main/preload.ts` to expose the new sprite IPC methods to the renderer.
- `readSprites: () => ipcRenderer.invoke(IPC.SPRITE_READ)`
- `writeSprites: (sprites: SpriteSettings) => ipcRenderer.invoke(IPC.SPRITE_WRITE, sprites)`

### 4. Main Process: Session Service (Gemini Fix)
Update `src/main/session-service/index.ts` to use a valid flag for Gemini.
- Change injection to use `-i "system: [persona]"` for Gemini sessions.

### 4. Renderer Process: Sprite Store
Refactor `src/renderer/store/sprites.ts`:
- Remove Zustand `persist` middleware.
- Add `loadSprites()` method to fetch from IPC on startup.
- Call `window.overseer.writeSprites()` whenever sprites are modified.

## Data Schema (sprites.json)
```json
{
  "sprites": [
    {
      "id": "...",
      "name": "...",
      "style": "...",
      "seed": "...",
      "persona": "..."
    }
  ]
}
```

## Testing Strategy
- **Unit Tests:**
  - Verify `ConfigService` reads and writes correctly.
  - Verify `SpriteStore` loads and saves via IPC.
- **Manual Verification:**
  - Create a sprite, restart the app, and verify it persists.
  - Launch a Gemini session and verify no "unknown argument" error occurs and the persona is injected.

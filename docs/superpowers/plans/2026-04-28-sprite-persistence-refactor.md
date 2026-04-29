# Sprite Persistence & Config Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor persistence to use a centralized `ConfigService` for file-based storage in `~/.overseer/` and fix Gemini CLI injection bugs.

**Architecture:** 
- Centralize JSON persistence in `ConfigService` (Main process).
- Update IPC handlers to use `ConfigService` for Themes, Keybindings, and Sprites.
- Refactor `SpriteStore` (Renderer) to use IPC instead of `localStorage`.
- Correct Gemini CLI injection flag to use interactive prompt with context.

**Tech Stack:** TypeScript, Electron, Zustand, Node.js FS.

---

### Task 1: Create ConfigService

**Files:**
- Create: `src/main/services/config-service.ts`
- Test: `tests/main/config-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { ConfigService } from '../../src/main/services/config-service'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('ConfigService', () => {
  const testDir = path.join(os.tmpdir(), 'overseer-test-' + Date.now())
  const service = new ConfigService(testDir)

  afterAll(async () => {
    await fs.promises.rm(testDir, { recursive: true, force: true })
  })

  it('should write and read config files', async () => {
    const data = { foo: 'bar' }
    await service.write('test.json', data)
    const read = await service.read<{ foo: string }>('test.json')
    expect(read).toEqual(data)
  })

  it('should return null for non-existent files', async () => {
    const read = await service.read('missing.json')
    expect(read).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/main/config-service.test.ts`
Expected: FAIL (Module not found)

- [ ] **Step 3: Implement ConfigService**

```typescript
import fs from 'fs'
import path from 'path'
import os from 'os'

export class ConfigService {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
  }

  async read<T>(filename: string): Promise<T | null> {
    const p = path.join(this.baseDir, filename)
    try {
      const raw = await fs.promises.readFile(p, 'utf8')
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    const p = path.join(this.baseDir, filename)
    await fs.promises.mkdir(path.dirname(p), { recursive: true })
    await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf8')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/main/config-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/services/config-service.ts tests/main/config-service.test.ts
git commit -m "feat: add ConfigService for centralized persistence"
```

---

### Task 2: Refactor IPC Handlers and Preload

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/preload.ts`
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add Sprite IPC constants**

In `src/renderer/types/ipc.ts`:
```typescript
export const IPC = {
  // ... existing
  SPRITE_READ:       'sprite:read',
  SPRITE_WRITE:      'sprite:write',
} as const
```

- [ ] **Step 2: Update IPC Handlers to use ConfigService**

In `src/main/ipc-handlers.ts`:
- Instantiate `const configService = new ConfigService()`
- Replace `readThemeFromDisk`, `writeThemeToDisk`, `readKeybindingsFromDisk`, `writeKeybindingsToDisk` usage with `configService.read`/`write`.
- Add handlers for `SPRITE_READ` and `SPRITE_WRITE`.
- Remove the old standalone disk functions.

- [ ] **Step 3: Update Preload Script**

In `src/main/preload.ts`:
```typescript
// Add to contextBridge.exposeInMainWorld('overseer', { ... })
readSprites: () => ipcRenderer.invoke(IPC.SPRITE_READ),
writeSprites: (settings: any) => ipcRenderer.invoke(IPC.SPRITE_WRITE, settings),
```

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc-handlers.ts src/main/preload.ts src/renderer/types/ipc.ts
git commit -m "refactor: use ConfigService in IPC handlers and expose sprite IPC"
```

---

### Task 3: Refactor Sprite Store

**Files:**
- Modify: `src/renderer/store/sprites.ts`

- [ ] **Step 1: Remove Zustand Persist and Implement IPC Persistence**

```typescript
import { create } from 'zustand'

export interface Sprite {
  id: string
  name: string
  style: string
  seed: string
  persona: string
}

const DEFAULT_SPRITE: Sprite = {
  id: 'default-sprite',
  name: 'Overseer',
  style: 'bottts',
  seed: 'overseer',
  persona: 'You are the Overseer, a helpful AI assistant. You are witty, concise, and professional.',
}

interface SpritesState {
  sprites: Sprite[]
  createSprite: (s: Omit<Sprite, 'id'>) => Sprite
  updateSprite: (id: string, patch: Partial<Omit<Sprite, 'id'>>) => void
  deleteSprite: (id: string) => void
  loadSprites: () => Promise<void>
}

export const useSpritesStore = create<SpritesState>((set, get) => ({
  sprites: [DEFAULT_SPRITE],
  createSprite: (s) => {
    const sprite: Sprite = { ...s, id: crypto.randomUUID() }
    set(state => ({ sprites: [...state.sprites, sprite] }))
    window.overseer.writeSprites({ sprites: get().sprites })
    return sprite
  },
  updateSprite: (id, patch) => {
    set(state => ({
      sprites: state.sprites.map(s => s.id === id ? { ...s, ...patch } : s),
    }))
    window.overseer.writeSprites({ sprites: get().sprites })
  },
  deleteSprite: (id) => {
    set(state => ({ sprites: state.sprites.filter(s => s.id !== id) }))
    window.overseer.writeSprites({ sprites: get().sprites })
  },
  loadSprites: async () => {
    const settings = await window.overseer.readSprites()
    const sprites = settings?.sprites || [DEFAULT_SPRITE]
    if (!sprites.find((s: any) => s.id === DEFAULT_SPRITE.id)) {
      sprites.unshift(DEFAULT_SPRITE)
    }
    set({ sprites })
  }
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/store/sprites.ts
git commit -m "refactor: move SpriteStore to IPC persistence"
```

---

### Task 4: Fix Gemini CLI Injection

**Files:**
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Update injection logic for Gemini**

```typescript
// Find spawnPty method
const cmd = session.agentType === 'claude'
  ? `claude --system-prompt "${escaped}"`
  : `gemini -i "system: ${escaped}"` // Changed from --system-prompt
```

- [ ] **Step 2: Commit**

```bash
git add src/main/session-service/index.ts
git commit -m "fix: correct Gemini CLI system prompt injection flag"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Initialize stores in App entry point**

In `src/renderer/main.tsx` or `App.tsx`, ensure `loadSprites()` is called on mount.

- [ ] **Step 2: Run build and tests**

Run: `npm run build && npm test`

- [ ] **Step 3: Manual check**
1. Open app.
2. Create a custom sprite.
3. Close and reopen app.
4. Verify sprite still exists in `~/.overseer/sprites.json` and in UI.
5. Create a Gemini session.
6. Verify no "unknown argument" error in logs.

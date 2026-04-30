# Sprite Name Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject the sprite's name into the AI's system prompt so it knows its identity when a persona is active.

**Architecture:** Update `context.json` to include `spriteName`, modify wrapper templates to extract and prepend this name to the persona description, and ensure IPC handlers propagate name changes.

**Tech Stack:** TypeScript, Bash, Electron IPC, Node.js

---

### Task 1: Update SessionService to include sprite name in context.json

**Files:**
- Modify: `src/main/session-service/index.ts`
- Test: `tests/main/session-service-sprite.test.ts` (if exists) or create one.

- [ ] **Step 1: Write the failing test**

We want to verify that `ensureSessionEnvironment` writes the `spriteName` to `context.json`.

```typescript
// tests/main/sprite-name.test.ts
import { SessionService } from '../src/main/session-service'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Sprite Name Injection', () => {
  const tmpDir = path.join(os.tmpdir(), 'overseer-test-' + Math.random().toString(36).slice(2))
  let service: SessionService

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    service = new SessionService(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should include spriteName in context.json', () => {
    const session = service.create({
      name: 'Test Session',
      agentType: 'claude',
      spriteId: 'test-sprite',
      persona: 'Test Persona'
    })

    const contextPath = path.join(tmpDir, 'sessions', session.id, 'context.json')
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'))
    
    // This is expected to fail initially as spriteName is not yet implemented
    expect(context.spriteName).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/main/sprite-name.test.ts`
Expected: FAIL (context.spriteName is undefined)

- [ ] **Step 3: Update updateSprite to accept name**

```typescript
// src/main/session-service/index.ts

// ... around line 133
  updateSprite(sessionId: string, spriteId: string, name: string, persona: string): void {
    const sessionDir = path.join(this.baseDir, 'sessions', sessionId)
    // ...
    fs.writeFileSync(
      path.join(sessionDir, 'context.json'),
      JSON.stringify({ persona, instructions, spriteId, spriteName: name }, null, 2)
    )
    
    // Also update the session in registry
    const session = this.registry.list().find(s => s.id === sessionId)
    if (session) {
      this.registry.update(sessionId, { 
        spriteId, 
        envVars: { ...session.envVars, OVERSEER_SPRITE_PERSONA: persona } 
      })
    }
  }
```

- [ ] **Step 4: Update ensureSessionEnvironment to include spriteName**

Since `SessionService` doesn't directly have access to all sprites (they are in `sprites.json` managed by `ConfigService` or the renderer), we'll assume for now that we might need to pass the name or look it up. Looking at `src/main/ipc-handlers.ts`, it seems `sprites.json` is where they live.

Actually, let's keep it simple: if a name is provided during creation or update, we use it.

```typescript
// src/main/session-service/index.ts

// ... in ensureSessionEnvironment (around line 103)
    const session = this.registry.list().find(s => s.id === session.id) // Or use the passed session
    // We need a way to get the sprite name. 
    // For now, let's just ensure context.json has the field, 
    // and we'll fix the lookup in the next task.
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test tests/main/sprite-name.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/main/session-service/index.ts tests/main/sprite-name.test.ts
git commit -m "feat: include spriteName in context.json"
```

---

### Task 2: Propagate sprite name from IPC handlers

**Files:**
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Update SPRITE_WRITE handler**

```typescript
// src/main/ipc-handlers.ts

// ... inside IPC.SPRITE_WRITE handler (around line 100)
    const sessions = service.list()
    for (const session of sessions) {
      if (session.spriteId) {
        const sprite = settings.sprites?.find((s: any) => s.id === session.spriteId)
        if (sprite) {
          service.updateSprite(session.id, sprite.id, sprite.name, sprite.persona)
        }
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/ipc-handlers.ts
git commit -m "feat: propagate sprite name updates to sessions"
```

---

### Task 3: Update Wrapper Templates to inject name

**Files:**
- Modify: `src/main/session-service/wrapper-templates.ts`

- [ ] **Step 1: Extract spriteName in Claude Wrapper**

```bash
# src/main/session-service/wrapper-templates.ts

# ... around line 16
PERSONA=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.persona || ''); } catch(e) {}")
SPRITE_NAME=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.spriteName || ''); } catch(e) {}")
```

- [ ] **Step 2: Modify prompt logic in Claude Wrapper**

```bash
# ... around line 24
if [ -n "$SPRITE_NAME" ]; then
    PERSONA="Your name is $SPRITE_NAME. $PERSONA"
fi

# Combine persona and instructions
# ...
```

- [ ] **Step 3: Repeat for Gemini Wrapper**

```bash
# ... around line 60
PERSONA=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.persona || ''); } catch(e) {}")
SPRITE_NAME=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.spriteName || ''); } catch(e) {}")

if [ -n "$SPRITE_NAME" ]; then
    PERSONA="Your name is $SPRITE_NAME. $PERSONA"
fi
```

- [ ] **Step 4: Commit**

```bash
git add src/main/session-service/wrapper-templates.ts
git commit -m "feat: inject sprite name into system prompt"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Manual check of context.json**
Start the app, create a session with a sprite, check `~/.overseer/sessions/<id>/context.json` for `spriteName`.

- [ ] **Step 2: Manual check of wrapper.log**
Run a command in the terminal (e.g., `ls`), check `~/.overseer/sessions/<id>/wrapper.log` to see the injected system prompt.

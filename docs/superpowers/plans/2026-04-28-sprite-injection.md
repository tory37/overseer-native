# Sprite Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable persistent, session-level persona injection for AI agents by overriding them via a `PATH` proxy.

**Architecture:** Use session-specific `bin` directories containing wrapper scripts that inject context from a `context.json` file. Prepend this `bin` directory to the shell's `PATH`.

**Tech Stack:** Node.js/TypeScript (Main process), Bash (Wrappers), Python3 (JSON parsing in wrappers).

---

### Task 1: Session Directory & Context Management

**Files:**
- Modify: `src/main/session-service/index.ts`
- Test: `tests/main/session-service-sprite.test.ts`

- [ ] **Step 1: Create a test for session directory and context creation**
```typescript
// tests/main/session-service-sprite.test.ts
import { SessionService } from '../../src/main/session-service'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('SessionService Sprite Injection', () => {
  let service: SessionService
  const sessionBaseDir = path.join(os.homedir(), '.overseer', 'sessions')

  beforeEach(() => {
    service = new SessionService()
  })

  it('creates session directory and context.json', () => {
    const session = service.create({
      name: 'Test Session',
      agentType: 'claude',
      spriteId: 'test-sprite',
      persona: 'Test Persona'
    })
    const sessionDir = path.join(sessionBaseDir, session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)
    expect(fs.existsSync(path.join(sessionDir, 'context.json'))).toBe(true)
    const context = JSON.parse(fs.readFileSync(path.join(sessionDir, 'context.json'), 'utf8'))
    expect(context.persona).toBe('Test Persona')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/main/session-service-sprite.test.ts`
Expected: FAIL (directory/file not created)

- [ ] **Step 3: Implement session directory and context creation in `SessionService`**
Update `src/main/session-service/index.ts`:
```typescript
// ... inside create() method
const sessionDir = path.join(os.homedir(), '.overseer', 'sessions', id)
fs.mkdirSync(path.join(sessionDir, 'bin'), { recursive: true })
fs.writeFileSync(
  path.join(sessionDir, 'context.json'),
  JSON.stringify({ persona: options.persona, spriteId: options.spriteId }, null, 2)
)
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/main/session-service-sprite.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/session-service/index.ts tests/main/session-service-sprite.test.ts
git commit -m "feat: create session directory and context.json"
```

---

### Task 2: Wrapper Script Generation

**Files:**
- Modify: `src/main/session-service/index.ts`
- Create: `src/main/session-service/wrapper-templates.ts`

- [ ] **Step 1: Define wrapper templates**
Create `src/main/session-service/wrapper-templates.ts`:
```typescript
export const CLAUDE_WRAPPER = \`#!/bin/bash
# Find the real 'claude' by skipping the overseer bin in the PATH
REAL_CLAUDE=\$(PATH=\$(echo "\$PATH" | sed -e "s|\$OVERSEER_SESSION_DIR/bin:||g") which claude)
if [ -z "\$REAL_CLAUDE" ]; then
    echo "Error: 'claude' not found in PATH" >&2
    exit 1
fi
PERSONA=\$(python3 -c "import json, os; d=json.load(open(os.path.join(os.environ['OVERSEER_SESSION_DIR'], 'context.json'))); print(d.get('persona', ''))")
exec "\$REAL_CLAUDE" --system-prompt "\$PERSONA" "\$@"
\`

export const GEMINI_WRAPPER = \`#!/bin/bash
REAL_GEMINI=\$(PATH=\$(echo "\$PATH" | sed -e "s|\$OVERSEER_SESSION_DIR/bin:||g") which gemini)
if [ -z "\$REAL_GEMINI" ]; then
    echo "Error: 'gemini' not found in PATH" >&2
    exit 1
fi
PERSONA=\$(python3 -c "import json, os; d=json.load(open(os.path.join(os.environ['OVERSEER_SESSION_DIR'], 'context.json'))); print(d.get('persona', ''))")
exec "\$REAL_GEMINI" -i "system: \$PERSONA" "\$@"
\`
```

- [ ] **Step 2: Update `SessionService` to write wrappers**
Modify `src/main/session-service/index.ts`:
```typescript
import { CLAUDE_WRAPPER, GEMINI_WRAPPER } from './wrapper-templates'

// ... inside create() method, after creating bin/ dir
fs.writeFileSync(path.join(sessionDir, 'bin', 'claude'), CLAUDE_WRAPPER, { mode: 0o755 })
fs.writeFileSync(path.join(sessionDir, 'bin', 'gemini'), GEMINI_WRAPPER, { mode: 0o755 })
```

- [ ] **Step 3: Update test to verify wrappers exist and are executable**
```typescript
it('creates wrapper scripts with correct permissions', () => {
  const session = service.create({ name: 'Test', agentType: 'shell' })
  const binDir = path.join(os.homedir(), '.overseer', 'sessions', session.id, 'bin')
  expect(fs.existsSync(path.join(binDir, 'claude'))).toBe(true)
  const stats = fs.statSync(path.join(binDir, 'claude'))
  expect(stats.mode & 0o111).toBeTruthy() // executable
})
```

- [ ] **Step 4: Run test and verify pass**
Run: `npm test tests/main/session-service-sprite.test.ts`

- [ ] **Step 5: Commit**
```bash
git add src/main/session-service/index.ts src/main/session-service/wrapper-templates.ts tests/main/session-service-sprite.test.ts
git commit -m "feat: generate wrapper scripts for claude and gemini"
```

---

### Task 3: PTY Environment Injection

**Files:**
- Modify: `src/main/session-service/index.ts`
- Modify: `src/main/session-service/pty-manager.ts`

- [ ] **Step 1: Update `Session` type and `SessionService` to include session dir**
Modify `src/main/session-service/index.ts`:
```typescript
// ... inside create() method
const sessionDir = path.join(os.homedir(), '.overseer', 'sessions', id)
const binDir = path.join(sessionDir, 'bin')

session.envVars['OVERSEER_SESSION_DIR'] = sessionDir
session.envVars['PATH'] = \`\${binDir}:\${process.env.PATH}\`
```

- [ ] **Step 2: Remove old persona injection logic**
Modify `src/main/session-service/index.ts` to remove the `setTimeout` block in `spawnPty` that was writing commands directly to the terminal.

- [ ] **Step 3: Verify environment variables in test**
```typescript
it('sets OVERSEER_SESSION_DIR and updates PATH', () => {
  const session = service.create({ name: 'Test', agentType: 'claude' })
  expect(session.envVars['OVERSEER_SESSION_DIR']).toContain(session.id)
  expect(session.envVars['PATH']).toContain(session.id)
  expect(session.envVars['PATH']).toContain('/bin:')
})
```

- [ ] **Step 4: Run test and verify pass**
Run: `npm test tests/main/session-service-sprite.test.ts`

- [ ] **Step 5: Commit**
```bash
git add src/main/session-service/index.ts tests/main/session-service-sprite.test.ts
git commit -m "feat: inject session dir and path into PTY environment"
```

---

### Task 4: Live Context Updates

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Add update method to `SessionService`**
Modify `src/main/session-service/index.ts`:
```typescript
updateSprite(sessionId: string, spriteId: string, persona: string): void {
  const sessionDir = path.join(os.homedir(), '.overseer', 'sessions', sessionId)
  if (fs.existsSync(sessionDir)) {
    fs.writeFileSync(
      path.join(sessionDir, 'context.json'),
      JSON.stringify({ persona, spriteId }, null, 2)
    )
  }
}
```

- [ ] **Step 2: Trigger update from IPC handler**
Modify `src/main/ipc-handlers.ts`:
In the `IPC.SPRITE_WRITE` handler, we should probably check which sessions are using the updated sprite and call `service.updateSprite`. Or add a specific IPC for session-sprite updates.

- [ ] **Step 3: Test live update**
```typescript
it('updates context.json live', () => {
  const session = service.create({ name: 'Test', agentType: 'claude', persona: 'Old' })
  service.updateSprite(session.id, 'sprite-1', 'New Persona')
  const context = JSON.parse(fs.readFileSync(path.join(sessionBaseDir, session.id, 'context.json'), 'utf8'))
  expect(context.persona).toBe('New Persona')
})
```

- [ ] **Step 4: Run test and verify pass**
Run: `npm test tests/main/session-service-sprite.test.ts`

- [ ] **Step 5: Commit**
```bash
git add src/main/session-service/index.ts src/main/ipc-handlers.ts tests/main/session-service-sprite.test.ts
git commit -m "feat: support live updates to session context"
```

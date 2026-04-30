# Session Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent orphaned session directories and clean up test sessions.

**Architecture:** Normalize all paths in `SessionService` to respect the `baseDir`, add an `isTest` flag to sessions, and implement automated cleanup logic on kill and on application startup (purge and orphan sweep).

**Tech Stack:** TypeScript, Node.js (fs, path, crypto), Electron (ipcMain).

---

### Task 1: Update IPC Types

**Files:**
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add isTest to Session and CreateSessionOptions**

```typescript
export interface Session {
  id: string
  name: string
  agentType: 'claude' | 'gemini' | 'cursor' | 'shell'
  cwd: string
  envVars: Record<string, string>
  scrollbackPath: string
  spriteId: string | null
  isTest?: boolean // Added
}

export interface CreateSessionOptions {
  name: string
  agentType: Session['agentType']
  cwd?: string
  spriteId?: string | null
  persona?: string
  isTest?: boolean // Added
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/types/ipc.ts
git commit -m "refactor: add isTest flag to Session and CreateSessionOptions"
```

### Task 2: Path Normalization in SessionService

**Files:**
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Fix os.homedir() usage**
Ensure all paths use `this.baseDir` instead of hardcoded `os.homedir()`.

```typescript
// src/main/session-service/index.ts

  create(options: CreateSessionOptions): Session {
    const id = randomUUID()
    const envVars = readAgentEnvVars(options.agentType)
    
    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd || os.homedir(),
      envVars,
      scrollbackPath: path.join(this.baseDir, 'sessions', id, 'scrollback.log'), // Use this.baseDir
      spriteId: options.spriteId ?? null,
      isTest: options.isTest || false, // Set isTest
    }
    // ...
  }

  private ensureSessionEnvironment(session: Session): Record<string, string> {
    const sessionDir = path.join(this.baseDir, 'sessions', session.id) // Use this.baseDir
    // ...
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/session-service/index.ts
git commit -m "fix: normalize SessionService paths to use baseDir"
```

### Task 3: Directory Cleanup on Kill

**Files:**
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Update kill() to remove directory**

```typescript
  kill(sessionId: string): void {
    this.ptyManager.kill(sessionId)
    this.registry.remove(sessionId)
    
    const sessionDir = path.join(this.baseDir, 'sessions', sessionId)
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true })
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/session-service/index.ts
git commit -m "feat: delete session directory on kill()"
```

### Task 4: Startup Purge and Orphan Sweep

**Files:**
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Implement purge and sweep methods**

```typescript
  private purgeTestSessions(): void {
    const testSessions = this.registry.list().filter(s => s.isTest)
    for (const session of testSessions) {
      this.kill(session.id)
    }
  }

  private sweepOrphanedDirectories(): void {
    const sessionsDir = path.join(this.baseDir, 'sessions')
    if (!fs.existsSync(sessionsDir)) return
    
    const registeredIds = new Set(this.registry.list().map(s => s.id))
    const items = fs.readdirSync(sessionsDir)
    
    for (const item of items) {
      const fullPath = path.join(sessionsDir, item)
      if (fs.statSync(fullPath).isDirectory() && !registeredIds.has(item)) {
        // Only delete if it looks like a UUID to avoid registry.json or other files
        if (item.match(/^[0-9a-f-]{36}$/i)) {
          fs.rmSync(fullPath, { recursive: true, force: true })
        }
      }
    }
  }
```

- [ ] **Step 2: Call methods in constructor**

```typescript
  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
    this.registry = new SessionRegistry(path.join(this.baseDir, 'sessions'))
    this.ptyManager = new PtyManager()
    
    this.purgeTestSessions()
    this.sweepOrphanedDirectories()
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/main/session-service/index.ts
git commit -m "feat: implement startup purge and orphan sweep"
```

### Task 5: Fix Existing Tests

**Files:**
- Modify: `tests/main/session-service-sprite.test.ts`

- [ ] **Step 1: Update test to use temp dir and isTest**

```typescript
const tmpBaseDir = path.join(os.tmpdir(), 'overseer-test-sprite-' + process.pid)

describe('SessionService Sprite Injection', () => {
  let service: SessionService

  beforeEach(() => {
    fs.mkdirSync(tmpBaseDir, { recursive: true })
    service = new SessionService(tmpBaseDir)
    jest.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpBaseDir, { recursive: true, force: true })
  })
  
  // Update path expectations in tests to use tmpBaseDir
  // Mark create() calls with isTest: true
```

- [ ] **Step 2: Run tests and verify**

Run: `npm test tests/main/session-service-sprite.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/main/session-service-sprite.test.ts
git commit -m "test: isolate session-service-sprite tests and use isTest flag"
```

### Task 6: Verification Test for Cleanup

**Files:**
- Create: `tests/main/session-cleanup.test.ts`

- [ ] **Step 1: Write cleanup verification test**

```typescript
import { SessionService } from '../../src/main/session-service'
import fs from 'fs'
import path from 'path'
import os from 'os'

const tmpDir = path.join(os.tmpdir(), 'overseer-cleanup-test-' + process.pid)

describe('Session Cleanup', () => {
  beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
  afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

  it('deletes directory on kill', () => {
    const service = new SessionService(tmpDir)
    const session = service.create({ name: 'Test', agentType: 'shell' })
    const sessionDir = path.join(tmpDir, 'sessions', session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)
    
    service.kill(session.id)
    expect(fs.existsSync(sessionDir)).toBe(false)
  })

  it('purges isTest sessions on startup', () => {
    const service1 = new SessionService(tmpDir)
    const session = service1.create({ name: 'Test', agentType: 'shell', isTest: true })
    const sessionDir = path.join(tmpDir, 'sessions', session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)

    // Re-init service
    const service2 = new SessionService(tmpDir)
    expect(fs.existsSync(sessionDir)).toBe(false)
    expect(service2.list()).toHaveLength(0)
  })

  it('sweeps orphaned directories on startup', () => {
    const sessionsDir = path.join(tmpDir, 'sessions')
    fs.mkdirSync(sessionsDir, { recursive: true })
    
    const orphanId = '11111111-2222-3333-4444-555555555555'
    const orphanDir = path.join(sessionsDir, orphanId)
    fs.mkdirSync(orphanDir)
    expect(fs.existsSync(orphanDir)).toBe(true)

    const service = new SessionService(tmpDir)
    expect(fs.existsSync(orphanDir)).toBe(false)
  })
})
```

- [ ] **Step 2: Run verification test**

Run: `npm test tests/main/session-cleanup.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/main/session-cleanup.test.ts
git commit -m "test: add verification for session cleanup, purge, and sweep"
```

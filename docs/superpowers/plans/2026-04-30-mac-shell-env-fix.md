# Mac Shell Environment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Overseer terminals correctly load the full shell environment on macOS.

**Architecture:** Improve `loadShellEnv` to sync all variables from a login shell, update PTY managers to use login shells (`-l`), and ensure `ZDOTDIR` in Zsh sessions sources the user's original config files.

**Tech Stack:** Node.js, Electron, `node-pty`, Zsh.

---

### Task 1: Improve `loadShellEnv` and Add Tests

**Files:**
- Modify: `src/main/services/shell-env.ts`
- Create: `tests/main/shell-env.test.ts`

- [ ] **Step 1: Create unit tests for `loadShellEnv`**
Create `tests/main/shell-env.test.ts`. We will mock `child_process.execSync` to verify environment syncing and parsing.

```typescript
import { loadShellEnv } from '../../src/main/services/shell-env'
import { execSync } from 'child_process'
import os from 'os'

jest.mock('child_process')
jest.mock('os')

describe('loadShellEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    jest.clearAllMocks()
    ;(os.platform as jest.Mock).mockReturnValue('darwin')
    ;(os.userInfo as jest.Mock).mockReturnValue({ shell: '/bin/zsh' })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('syncs environment variables from shell output', () => {
    ;(execSync as jest.Mock).mockReturnValue('PATH=/usr/local/bin:/usr/bin\nCUSTOM_VAR=hello=world\nNODE_ENV=production\n')
    
    loadShellEnv()
    
    expect(process.env.PATH).toBe('/usr/local/bin:/usr/bin')
    expect(process.env.CUSTOM_VAR).toBe('hello=world')
    // Should NOT sync NODE_ENV as it is in the blacklist
    expect(process.env.NODE_ENV).toBeUndefined()
  })

  test('defaults to /bin/zsh on Mac if SHELL is missing', () => {
    delete process.env.SHELL
    ;(execSync as jest.Mock).mockReturnValue('PATH=/usr/bin\n')
    
    loadShellEnv()
    
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('/bin/zsh -l -c'), expect.any(Object))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm run test -- tests/main/shell-env.test.ts`
Expected: FAIL (blacklist not implemented, parsing might be different)

- [ ] **Step 3: Implement improved `loadShellEnv`**
Modify `src/main/services/shell-env.ts`.

```typescript
import { execSync } from 'child_process'
import os from 'os'

const BLACKLIST = [
  'NODE_ENV',
  'ELECTRON_RUN_AS_NODE',
  'ELECTRON_NO_ASAR',
  'ELECTRON_ENABLE_LOGGING',
  'ELECTRON_ENABLE_STACK_DUMPING',
  'OVERSEER_VERSION',
  'OVERSEER_IS_DEV'
]

/**
 * Loads the user's shell environment (PATH, etc.) into the current process.
 * This is crucial in production where the app might be launched without 
 * the shell's login environment.
 */
export function loadShellEnv() {
  if (process.platform === 'win32') return

  try {
    let shell = process.env.SHELL
    if (!shell) {
      try {
        shell = os.userInfo().shell
      } catch {
        shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash'
      }
    }

    // Run a login shell and print the environment
    const rawEnv = execSync(`${shell} -l -c 'env'`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    })

    const lines = rawEnv.split('\n')
    for (const line of lines) {
      const index = line.indexOf('=')
      if (index > 0) {
        const key = line.slice(0, index)
        const value = line.slice(index + 1)
        
        if (!BLACKLIST.includes(key)) {
          process.env[key] = value
        }
      }
    }
  } catch (error) {
    console.error('Failed to load shell environment:', error)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm run test -- tests/main/shell-env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/services/shell-env.ts tests/main/shell-env.test.ts
git commit -m "feat: improve shell-env syncing with broad variable support and better shell detection"
```

---

### Task 2: Use Login Shells for PTYs

**Files:**
- Modify: `src/main/session-service/pty-manager.ts`
- Modify: `src/main/companion-pty-manager.ts`

- [ ] **Step 1: Update `PtyManager` to use login flag**
Modify `src/main/session-service/pty-manager.ts`. Update the `spawn` method.

```typescript
  spawn(session: Session, env: Record<string, string>, onData: DataCallback, onError?: (err: string) => void): void {
    const shell = process.env.SHELL || '/bin/bash'
    const args = process.platform !== 'win32' ? ['-l'] : []
    try {
      const ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: session.cwd,
        env: env,
      })
      // ...
```

- [ ] **Step 2: Update `CompanionPtyManager` to use login flag**
Modify `src/main/companion-pty-manager.ts`. Update the `spawn` method.

```typescript
  spawn(cwd: string, onData: DataCallback, onExit: ExitCallback): string {
    const shell = process.env.SHELL || '/bin/bash'
    const args = process.platform !== 'win32' ? ['-l'] : []
    const id = randomUUID()

    const proc = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>,
    })
    // ...
```

- [ ] **Step 3: Run existing PTY tests**
Run: `npm run test -- tests/main/pty-manager.test.ts tests/main/companion-pty-manager.test.ts`
Expected: PASS (they should still work with login shells, though output might slightly change)

- [ ] **Step 4: Commit**
```bash
git add src/main/session-service/pty-manager.ts src/main/companion-pty-manager.ts
git commit -m "feat: spawn PTYs as login shells on non-Windows platforms"
```

---

### Task 3: Enhance `ZDOTDIR` Logic in `SessionService`

**Files:**
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Update `ensureSessionEnvironment` for Zsh**
Modify `src/main/session-service/index.ts`. Update the Zsh handling block in `ensureSessionEnvironment`.

```typescript
    // Special handling for Zsh to prevent ~/.zshrc from overriding our PATH
    if (process.env.SHELL?.includes('zsh')) {
      env['ZDOTDIR'] = sessionDir
      
      const home = os.homedir()
      const files = ['.zshenv', '.zprofile', '.zshrc', '.zlogin']
      
      for (const file of files) {
        const dotFile = path.join(sessionDir, file)
        const originalFile = path.join(home, file)
        
        let content = ''
        if (fs.existsSync(originalFile)) {
          content += `source "${originalFile}"\n`
        }
        
        if (file === '.zshrc') {
          // Re-apply our PATH at the very end of zsh initialization
          content += `export PATH="${binDir}:$PATH"\n`
        }
        
        if (content) {
          fs.writeFileSync(dotFile, content)
        }
      }
    }
```

- [ ] **Step 2: Run session service tests**
Run: `npm run test -- tests/main/registry.test.ts` (or relevant session service tests)
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/main/session-service/index.ts
git commit -m "fix: ensure ZDOTDIR sources original user configs for all Zsh stages"
```

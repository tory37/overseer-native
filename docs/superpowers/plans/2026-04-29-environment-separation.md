# Environment Separation and Development Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate development data (~/.overseer-dev) from production data (~/.overseer) and add developer tools (Status Badge, Open Folder, Clear & Restart).

**Architecture:** Detect environment in Main process, configure services with separate base directories, and expose status/actions via Preload/IPC to a unified Header/Settings UI.

**Tech Stack:** Electron, React, TypeScript, Node.js (fs, path, os).

---

### Task 1: Update ConfigService for Custom Base Directory

**Files:**
- Modify: `src/main/services/config-service.ts`
- Test: `tests/main/config-service.test.ts`

- [ ] **Step 1: Write the failing test**
Update the test to verify that `ConfigService` uses the provided base directory.

```typescript
// tests/main/config-service.test.ts
import { ConfigService } from '../../src/main/services/config-service'
import path from 'path'
import fs from 'fs'
import os from 'os'

describe('ConfigService Custom Dir', () => {
  const customDir = path.join(os.tmpdir(), 'overseer-test-custom')
  
  afterEach(async () => {
    try { await fs.promises.rm(customDir, { recursive: true, force: true }) } catch {}
  })

  it('should use the provided custom base directory', async () => {
    const service = new ConfigService(customDir)
    await service.write('test.json', { foo: 'bar' })
    const exists = fs.existsSync(path.join(customDir, 'test.json'))
    expect(exists).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/main/config-service.test.ts`
Expected: FAIL (if the logic isn't already there or is broken)

- [ ] **Step 3: Update implementation**
The current `ConfigService` already accepts `baseDir` in constructor, but let's ensure it's used correctly and exported.

```typescript
// src/main/services/config-service.ts
import fs from 'fs'
import path from 'path'
import os from 'os'

export class ConfigService {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
  }

  // ... rest of the file stays same
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/main/config-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/services/config-service.ts tests/main/config-service.test.ts
git commit -m "feat: ensure ConfigService supports custom base directory"
```

---

### Task 2: Environment Detection and Service Initialization in Main

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/main/session-service/index.ts`

- [ ] **Step 1: Update SessionService constructor**
Modify `SessionService` to accept an optional `baseDir`.

```typescript
// src/main/session-service/index.ts
export class SessionService {
  private config: ConfigService
  // ...
  constructor(baseDir?: string) {
    this.config = new ConfigService(baseDir)
    // ...
  }
}
```

- [ ] **Step 2: Update Main entry point to detect environment**
Detect `NODE_ENV` and set the `baseDir`.

```typescript
// src/main/index.ts
import os from 'os'
// ...
const isDev = process.env.NODE_ENV === 'development'
const baseDir = isDev 
  ? path.join(os.homedir(), '.overseer-dev')
  : path.join(os.homedir(), '.overseer')

const sessionService = new SessionService(baseDir)
const syncService = new SyncService() // Note: SyncService might also need baseDir update
```

- [ ] **Step 3: Update SyncService to support custom baseDir (if needed)**
Check `src/main/services/sync-service.ts`. If it uses `ConfigService`, update it similarly to `SessionService`.

- [ ] **Step 4: Commit**
```bash
git add src/main/index.ts src/main/session-service/index.ts src/main/services/sync-service.ts
git commit -m "feat: initialize services with environment-specific data paths"
```

---

### Task 3: IPC Handlers for Dev Tools

**Files:**
- Modify: `src/renderer/types/ipc.ts`
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/preload.ts`

- [ ] **Step 1: Add new IPC constants**
```typescript
// src/renderer/types/ipc.ts
export enum IPC {
  // ...
  DEV_OPEN_DATA_FOLDER = 'dev:open-data-folder',
  DEV_CLEAR_AND_RESTART = 'dev:clear-and-restart',
}
```

- [ ] **Step 2: Implement IPC handlers in Main**
Implement the logic to open folder and clear/restart.

```typescript
// src/main/ipc-handlers.ts
import { shell, app } from 'electron'
import fs from 'fs'

export function registerIpcHandlers(sessionService: SessionService, syncService: SyncService, getWindow: () => BrowserWindow | null, baseDir: string) {
  // ...
  ipcMain.handle(IPC.DEV_OPEN_DATA_FOLDER, async () => {
    await shell.openPath(baseDir)
  })

  ipcMain.handle(IPC.DEV_CLEAR_AND_RESTART, async () => {
    if (process.env.NODE_ENV !== 'development') return
    await fs.promises.rm(baseDir, { recursive: true, force: true })
    app.relaunch()
    app.exit()
  })
}
```

- [ ] **Step 3: Update Preload to expose new methods and app info**
Expose `isDev`, `appVersion`, and the new actions.

```typescript
// src/main/preload.ts
contextBridge.exposeInMainWorld('overseer', {
  // ...
  isDev: process.env.NODE_ENV === 'development',
  appVersion: require('../../package.json').version,
  openDataFolder: () => ipcRenderer.invoke(IPC.DEV_OPEN_DATA_FOLDER),
  clearAndRestart: () => ipcRenderer.invoke(IPC.DEV_CLEAR_AND_RESTART),
})
```

- [ ] **Step 4: Commit**
```bash
git add src/renderer/types/ipc.ts src/main/ipc-handlers.ts src/main/preload.ts
git commit -m "feat: add IPC handlers and preload exposure for dev tools"
```

---

### Task 4: UI Status Badge in Header

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Implement Status Badge**
Add the badge next to the Settings icon.

```tsx
// src/renderer/App.tsx
// ... inside return of App component, near Settings button
<div style={{ 
  marginLeft: 'auto', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px',
  marginRight: '10px'
}}>
  <span style={{ 
    fontSize: '11px', 
    fontWeight: 'bold', 
    padding: '3px 8px', 
    borderRadius: '4px',
    backgroundColor: (window as any).overseer.isDev ? 'rgba(255, 165, 0, 0.2)' : 'rgba(128, 128, 128, 0.1)',
    color: (window as any).overseer.isDev ? 'orange' : 'var(--text-muted)',
    border: `1px solid ${(window as any).overseer.isDev ? 'orange' : 'transparent'}`
  }}>
    {(window as any).overseer.isDev ? 'DEV MODE' : `PRODUCTION v${(window as any).overseer.appVersion}`}
  </span>
  <button onClick={() => setShowSettings(true)} ... />
</div>
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/App.tsx
git commit -m "feat: add environment status badge to header"
```

---

### Task 5: Dev Tools in Settings Modal

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`

- [ ] **Step 1: Add buttons to SettingsModal**
Add "Open Data Folder" and "Clear & Restart" (dev only).

```tsx
// src/renderer/components/SettingsModal.tsx
export function SettingsModal({ onClose, keybindings, onSaveKeybindings }: Props) {
  const { isDev, openDataFolder, clearAndRestart } = (window as any).overseer

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* ... existing content ... */}
        
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-main)', paddingTop: '20px' }}>
          <h3>Data Management</h3>
          <button 
            onClick={() => openDataFolder()}
            style={{ padding: '8px 12px', cursor: 'pointer', background: 'var(--bg-tab)', border: '1px solid var(--border-main)', color: 'var(--text-main)', borderRadius: '4px' }}
          >
            Open Data Folder
          </button>
          
          {isDev && (
            <button 
              onClick={() => { if(confirm('Clear ALL data and restart?')) clearAndRestart() }}
              style={{ marginLeft: '10px', padding: '8px 12px', cursor: 'pointer', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: 'red', borderRadius: '4px' }}
            >
              Clear & Restart (Dev Only)
            </button>
          )}
        </div>
        
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/components/SettingsModal.tsx
git commit -m "feat: add dev tools to SettingsModal"
```

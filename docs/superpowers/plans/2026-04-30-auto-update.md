# Auto Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a robust auto-update system using `electron-updater` with a subtle UI banner and manual check capabilities.

**Architecture:** A `UpdateService` in the main process manages the `electron-updater` lifecycle, communicating status changes to the renderer via IPC. A sticky `UpdateBanner` component notifies the user of available updates and progress.

**Tech Stack:** `electron-updater`, Electron IPC, React (TypeScript), CSS.

---

### Task 1: Setup Dependencies and Types

**Files:**
- Modify: `package.json`
- Modify: `src/renderer/types/ipc.ts`

- [ ] **Step 1: Add electron-updater to dependencies**
Run: `npm install electron-updater --save`

- [ ] **Step 2: Add Update IPC constants and types**
Add new IPC channels and update status types to `src/renderer/types/ipc.ts`.

```typescript
// Add to IPC object
export const IPC = {
  // ... existing
  UPDATE_CHECK:      'update:check',
  UPDATE_INSTALL:    'update:install',
  UPDATE_STATUS:     'update:status',
} as const

export type UpdateStatus = 
  | { type: 'idle' }
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string }
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json src/renderer/types/ipc.ts
git commit -m "chore: add electron-updater and update ipc types"
```

### Task 2: Create UpdateService (Main Process)

**Files:**
- Create: `src/main/services/update-service.ts`
- Create: `tests/main/update-service.test.ts`

- [ ] **Step 1: Write mock tests for UpdateService**
```typescript
import { UpdateService } from '../../src/main/services/update-service'
import { autoUpdater } from 'electron-updater'
import { IPC } from '../../src/renderer/types/ipc'

jest.mock('electron-updater', () => ({
  autoUpdater: {
    on: jest.fn(),
    checkForUpdates: jest.fn(),
    quitAndInstall: jest.fn(),
  }
}))

describe('UpdateService', () => {
  it('should register listeners on init', () => {
    const send = jest.fn()
    const service = new UpdateService(() => ({ webContents: { send } } as any))
    expect(autoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function))
    expect(autoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function))
  })
})
```

- [ ] **Step 2: Implement UpdateService**
```typescript
import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IPC, UpdateStatus } from '../../renderer/types/ipc'

export class UpdateService {
  private status: UpdateStatus = { type: 'idle' }

  constructor(private getWindow: () => BrowserWindow | null) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => this.setStatus({ type: 'checking' }))
    autoUpdater.on('update-available', (info) => this.setStatus({ type: 'available', version: info.version }))
    autoUpdater.on('download-progress', (progress) => this.setStatus({ type: 'downloading', percent: progress.percent }))
    autoUpdater.on('update-downloaded', (info) => this.setStatus({ type: 'downloaded', version: info.version }))
    autoUpdater.on('error', (err) => this.setStatus({ type: 'error', message: err.message }))
  }

  private setStatus(status: UpdateStatus) {
    this.status = status
    this.getWindow()?.webContents.send(IPC.UPDATE_STATUS, status)
  }

  init() {
    setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
    autoUpdater.checkForUpdates()
  }

  async manualCheck() {
    return autoUpdater.checkForUpdates()
  }

  install() {
    autoUpdater.quitAndInstall()
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add src/main/services/update-service.ts tests/main/update-service.test.ts
git commit -m "feat: add UpdateService and tests"
```

### Task 4: Implement UpdateBanner UI Component

**Files:**
- Create: `src/renderer/components/UpdateBanner.tsx`
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: Create UpdateBanner component**
```tsx
import React, { useEffect, useState } from 'react'
import { UpdateStatus } from '../types/ipc'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ type: 'idle' })

  useEffect(() => {
    return window.overseer.updateStatus((s) => setStatus(s))
  }, [])

  if (status.type === 'idle' || status.type === 'checking' || status.type === 'error') return null

  return (
    <div style={{ background: 'var(--accent)', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
      <span>
        {status.type === 'available' && `New version ${status.version} available. Downloading...`}
        {status.type === 'downloading' && `Downloading update: ${Math.round(status.percent)}%`}
        {status.type === 'downloaded' && `Version ${status.version} ready to install.`}
      </span>
      {status.type === 'downloaded' && (
        <button 
          onClick={() => window.overseer.updateInstall()}
          style={{ background: '#fff', color: 'var(--accent)', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
        >
          Restart to Update
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add to App.tsx**
Import and place `<UpdateBanner />` at the very top of the layout.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/components/UpdateBanner.tsx src/renderer/App.tsx
git commit -m "feat: add UpdateBanner UI component"
```

### Task 5: Add "Check for Updates" to Settings

**Files:**
- Modify: `src/renderer/components/SettingsModal.tsx`

- [ ] **Step 1: Add "Check for Updates" button**
```tsx
// Inside SettingsModal.tsx, add to a new section
const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ type: 'idle' })

useEffect(() => {
  return window.overseer.updateStatus(setUpdateStatus)
}, [])

const handleCheckUpdates = async () => {
  await window.overseer.updateCheck()
}

// In the UI:
<div style={{ marginTop: 24 }}>
  <h3 style={sectionHeading}>Updates</h3>
  <div style={divider}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={handleCheckUpdates}
        style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
      >
        Check for Updates
      </button>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {updateStatus.type === 'checking' && 'Checking...'}
        {updateStatus.type === 'idle' && 'App is up to date.'}
        {updateStatus.type === 'error' && `Error: ${updateStatus.message}`}
      </span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/components/SettingsModal.tsx
git commit -m "feat: add update check button to settings"
```

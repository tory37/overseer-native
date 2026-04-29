# Overseer — .overseer Git Sync Design Spec
**Date:** 2026-04-28

---

## Overview

This spec covers the automatic synchronization of Overseer settings (`~/.overseer`) to a remote Git repository. The goal is to provide a "guided setup" within the app that initializes a Git repository in the settings directory and automatically commits/pushes changes whenever the user modifies themes, keybindings, or agent configurations.

---

## Background

The `~/.overseer` directory contains:
- `keybindings.json` (Sync-worthy)
- `theme-settings.json` (Sync-worthy)
- `agents/*.json` (Sync-worthy)
- `sessions/` (Transient/Machine-local - EXCLUDE)
- `sync-state.json` (Transient - EXCLUDE)

---

## Architecture

### 1. Main Process: `SettingsSyncService`

A new service in the main process responsible for Git operations within `~/.overseer`.

**Responsibilities:**
- `getSettingsSyncStatus()`: Checks if `~/.overseer/.git` exists and returns the current remote URL.
- `setupSettingsSync(remoteUrl: string)`:
    1. Runs `git init` in `~/.overseer`.
    2. Writes a `.gitignore` file (ignoring `sessions/` and `sync-state.json`).
    3. Adds the provided remote URL.
    4. Performs initial `git add .`, `git commit -m "initial settings backup"`, and `git push -u origin main`.
- `syncOnSave()`: A debounced function that runs `git add . && git commit -m "update settings" && git push`.

**Trigger:**
Whenever `IPC.KEYBINDINGS_WRITE`, `IPC.THEME_WRITE`, or (future) Agent config edits occur, the main process calls `SettingsSyncService.syncOnSave()`.

---

## IPC Channels

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `settings:sync-status` | renderer → main (invoke) | — | Returns `{ isConfigured: boolean, remoteUrl?: string }` |
| `settings:sync-setup` | renderer → main (invoke) | `{ remoteUrl: string }` | Performs initialization and first push |
| `settings:sync-push` | renderer → main (invoke) | — | Manual trigger for a push (optional) |

---

## UI: SettingsModal Updates

### New Section: "Backup & Sync"

**State 1: Not Configured**
- Text: "Settings are stored locally on this machine."
- Button: **[Configure Backup]**
- Clicking opens a small sub-modal or inline form:
    - Input: "Remote Git URL"
    - Button: **[Initialize & Push]** (shows spinner during setup)

**State 2: Configured**
- Text: "Syncing to `github.com/user/settings`"
- Status: "Last synced: 2 minutes ago"
- Button: **[Sync Now]** (for manual pull/push)
- Button: **[Disconnect]** (stops auto-syncing, keeps local `.git`)

---

## Error Handling

- **Git CLI Missing:** `setupSettingsSync` checks for `git` availability. If missing, shows error: "Git CLI not found. Please install git to use this feature."
- **Auth Failures:** If `git push` fails (e.g., SSH keys not set up), the app captures the stderr and displays it in the UI.
- **Merge Conflicts:** If a push fails due to being behind, the app can offer a "Pull & Rebase" option (v2). For v1, it simply reports the error.

---

## .gitignore Content

```ignore
# Ignore transient session data and logs
sessions/
sync-state.json

# Ignore OS files
.DS_Store
Thumbs.db
```

---

## Success Criteria

1. Changing a keybinding in Overseer results in a new commit/push in the remote repository.
2. A new user can set up the sync by providing only a Git URL.
3. Machine-local data (scrollback logs) is never committed.

# Overseer — Sync & Settings Design Spec
**Date:** 2026-04-27

---

## Overview

This spec covers the sync subsystem and settings UI for Overseer. The goal is to surface the state of shared AI rules and skills across agents, detect when local files have drifted from the last-synced state, and let the user trigger a sync — all without rewriting the existing `ai-sync` script.

This is additive to the core session/terminal spec (`2026-04-27-overseer-design.md`).

---

## Background

`~/.local/bin/ai-sync` is an existing bash script that:
1. Compiles `~/.ai-context/rules/*.md` into `~/.claude/CLAUDE.md`
2. Appends `@filepath` references into Gemini's config
3. Rsyncs skills from the Gemini extension directory into `~/.ai-context/skills/`
4. Optionally cloud-syncs via rclone

Overseer does not currently invoke this script. Nothing does — it is run manually. The goal is to make Overseer aware of sync state and trigger `ai-sync` automatically and on demand.

**Central stores:**
- Rules: `~/.ai-context/rules/` (`compression.md`, `global.md`, and any user additions)
- Skills: `~/.ai-context/skills/` (full superpowers library)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ Renderer Process                                     │
│                                                      │
│  Header: [☰ sessions] [tabs...] [⚙ settings]        │
│                                                      │
│  SettingsModal (overlay, shown on gear click)        │
│  └── SyncSection                                     │
│       - Last synced: <timestamp>                     │
│       - N rules / M skills drifted                   │
│       - List of drifted filenames                    │
│       - [Sync Now] button                            │
└────────────────────┬─────────────────────────────────┘
                     │ IPC
┌────────────────────▼─────────────────────────────────┐
│ Main Process                                         │
│                                                      │
│  SyncService                                         │
│  - Reads ~/.overseer/sync-state.json (last timestamp)│
│  - Diffs mtimes of rules/ and skills/ files vs stamp │
│  - getDriftStatus() → { rules: string[], skills: string[] } │
│  - runSync() → shells out to ~/.local/bin/ai-sync    │
│             → updates sync-state.json on success     │
└──────────────────────────────────────────────────────┘
```

---

## SyncService (Main Process)

**File:** `src/main/services/sync-service.ts`

**State file:** `~/.overseer/sync-state.json`
```json
{ "lastSyncedAt": "2026-04-27T14:30:00.000Z" }
```

**Drift detection:**
- Read `lastSyncedAt` from state file (or treat as epoch 0 if missing)
- Walk `~/.ai-context/rules/` and `~/.ai-context/skills/` (non-recursive, `*.md` files)
- For each file, compare `mtime` to `lastSyncedAt`
- Return lists of rule filenames and skill filenames that are newer

**`getDriftStatus()`** returns:
```ts
{
  lastSyncedAt: string | null,
  rules: string[],   // filenames with mtime > lastSyncedAt
  skills: string[],  // filenames with mtime > lastSyncedAt
}
```

**`runSync()`**:
1. Shell out: `~/.local/bin/ai-sync` (capture stdout + stderr)
2. On exit code 0: write current timestamp to `sync-state.json`, return `{ ok: true, output: string }`
3. On non-zero exit: return `{ ok: false, output: string }` (do not update timestamp)

**Auto-sync on session start:** `SyncService.runSync()` is called in the background when a new session is created (fire-and-forget — does not block PTY spawn).

---

## IPC Channels

| Channel | Direction | Payload |
|---------|-----------|---------|
| `sync:status` | renderer → main (invoke) | — |
| `sync:status` reply | main → renderer | `DriftStatus` |
| `sync:run` | renderer → main (invoke) | — |
| `sync:run` reply | main → renderer | `{ ok: boolean, output: string }` |

---

## UI

**Header change:** Add a `⚙` icon button to the right side of the header bar. Clicking opens `SettingsModal`. State: `showSettings: boolean` in `App.tsx`.

**`SettingsModal`** (`src/renderer/components/SettingsModal.tsx`):
- Full-screen overlay (same pattern as `NewSessionDialog`)
- Title: "Settings"
- Single section for v1: **Sync**

**Sync section layout:**
```
Sync
─────────────────────────────────────────
Last synced: 2 hours ago  (or "Never")
Rules:  3 changed (global.md, compression.md, new-rule.md)
Skills: 0 changed

[Sync Now]
─────────────────────────────────────────
```

- On mount: requests `sync:status`, displays result
- "Sync Now" button: calls `sync:run`, shows spinner, then refreshes status
- If sync fails: show error output inline (scrollable, monospace, red border)
- "Never" shown if `lastSyncedAt` is null
- File list is collapsed if empty ("0 changed")

---

## Agent Config Cleanup

The existing agent config files contain entries that are either incorrect or no longer needed under this design:

**`~/.overseer/agents/claude.json`** — remove `ANTHROPIC_API_KEY` (Claude CLI self-auths) and `CLAUDE_CONFIG_DIR` (was pointing to the default, had no effect):
```json
{ "env": {} }
```

**`~/.overseer/agents/gemini.json`** — remove `GOOGLE_API_KEY` (Gemini CLI self-auths). `GEMINI_CONFIG_DIR` and `GEMINI_SYSTEM_PROMPT_FILE` env var names are unverified against the Gemini CLI; remove them:
```json
{ "env": {} }
```

---

## Error Handling

- `ai-sync` not found or not executable: `runSync()` returns `{ ok: false, output: "ai-sync not found at ~/.local/bin/ai-sync" }`, shown inline in the modal.
- `~/.ai-context/rules/` or `~/.ai-context/skills/` missing: treat as zero drifted files; do not crash.
- `sync-state.json` missing or malformed: treat `lastSyncedAt` as null; sync still works.
- Sync failure: timestamp not updated, error displayed, user can retry.

---

## Out of Scope (v1)

- File watcher (inotify/FSEvents) for real-time drift updates — poll on modal open is sufficient
- Editing rules or skills from within Overseer
- Viewing skill content in the UI
- Per-agent sync (all agents share the same central stores)
- Cloud sync status (rclone step of ai-sync runs silently)

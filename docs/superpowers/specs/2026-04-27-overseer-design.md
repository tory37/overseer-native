# Overseer — Design Spec
**Date:** 2026-04-27

---

## Overview

Overseer is a standalone Electron desktop app that acts as a central hub for running multiple AI CLI sessions (Claude, Gemini, Cursor Agent, or any shell) in native terminal panels. Each session gets a real PTY — not a web-emulated fake — so the terminal experience is indistinguishable from a real terminal. Overseer adds a layer of shared config injection and per-session tool panels on top.

The app lives outside any individual project. It manages contexts, not codebases.

---

## Architecture

**Option B: Electron + Session Service Module**

```
┌─────────────────────────────────────────────────────────┐
│ Renderer Process (React + xterm.js)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Tab Bar  │  │ Terminal │  │   Tool Panel          │  │
│  │ (sessions│  │ (xterm.js│  │   (Git: active CWD)  │  │
│  │  list)   │  │ per tab) │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└───────────────────────────────┬─────────────────────────┘
                                │ IPC (contextBridge)
┌───────────────────────────────▼─────────────────────────┐
│ Main Process                                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Session Service Module                          │    │
│  │  - PTY lifecycle (node-pty)                     │    │
│  │  - Env var injection at spawn                   │    │
│  │  - Scrollback serialization (~/.overseer/sessions)│   │
│  │  - Session registry (in-memory + disk)          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Why this structure:** Session management is a self-contained module with a clean API boundary. The renderer never touches PTYs directly — it calls into the session service via IPC. This boundary means the session service can be extracted to an external daemon (tmux-style persistence) later without rewriting the renderer.

---

## Session Model

Each session is a named, persistent unit. A session stores:

```
{
  id: string,           // uuid, stable across restarts
  name: string,         // user-defined label (e.g. "claude-main")
  agentType: string,    // "claude" | "gemini" | "cursor" | "shell"
  cwd: string,          // working directory at spawn time
  envVars: object,      // captured from agent config at session creation
  scrollbackPath: string // ~/.overseer/sessions/<id>.log
}
```

`envVars` is captured from `~/.overseer/agents/<agentType>.json` at session creation time and stored in the registry. On every subsequent PTY spawn (including app reopen), the stored values are used — not re-read from the agent file. This makes sessions reproducible and isolated from config changes until the user explicitly chooses to refresh a session.

Sessions are persisted to `~/.overseer/sessions/registry.json`. Scrollback output is written to `~/.overseer/sessions/<id>.log` as raw terminal output (including escape sequences). On reopen, the scrollback file is replayed into xterm.js as history, then the shell is respawned with the same env injection.

---

## Config Injection

`~/.overseer/` is the shared config directory. It already exists and contains:

```
~/.overseer/
  agents/       # agent config files (one per agent type)
  bin/          # executables on PATH
  skills/       # superpowers skills shared across agents
  worktrees/    # git worktrees
  sessions/     # created by Overseer: registry.json + scrollback logs
```

At PTY spawn, Overseer reads the agent config from `~/.overseer/agents/<agentType>.json` and constructs an env var block. This block is merged into the child process environment before the PTY is created. The user sees a normal terminal that happens to have the right context pre-loaded — no special launcher, no stdin injection.

Agent config files specify which env vars to set (e.g., `ANTHROPIC_API_KEY`, `CLAUDE_CONFIG_DIR`, skill paths, etc.). The exact schema is defined per agent type.

---

## Terminal Rendering

Each session tab renders one xterm.js `Terminal` instance in the renderer process. When a tab is not active, its xterm.js instance is hidden (CSS `display: none`) but kept alive — no teardown, no state loss. Switching tabs is instant.

Data flow per active session:
- PTY stdout → IPC → xterm.js `terminal.write()`
- xterm.js user input → IPC → PTY stdin

Scrollback is also written to disk as PTY stdout arrives, so the log file is always current.

---

## Tool Panel: Git

The tool panel sits beside the terminal and changes based on the active session. For v1, one tool: **Git**.

The Git tool operates on the active session's `cwd`. It exposes four actions:

| Action | Command |
|--------|---------|
| Status | `git status` |
| Commit | Prompts for message, runs `git add -A && git commit -m "..."` |
| Push   | `git push` |
| Pull   | `git pull` |

Output from these commands is displayed inline in the tool panel, not piped into the terminal session. The tool panel calls `child_process.exec` in the main process via IPC — it does not interact with the active PTY.

The CWD for git commands comes from the session's stored `cwd`. For v1, this is set at session creation and not updated dynamically (detecting `cd` changes is a future enhancement).

---

## Session Lifecycle

**Create:** User clicks "New Session", picks agent type and CWD, optionally names it. Overseer writes a session record to the registry, spawns the PTY with injected env vars, and opens a new tab.

**Switch:** Tab click — active xterm.js instance is hidden, new one shown. PTY remains running in the background.

**Close tab:** Hides the tab from the UI. PTY continues running (sessions are persistent). All sessions (including closed tabs) are visible in a session list/drawer so the user can reopen them as a tab. A separate "Kill session" action terminates the PTY and permanently removes the session.

**App reopen:** Registry is loaded. Each recorded session replays its scrollback log into xterm.js as history, then respawns the shell with the same env injection. AI CLI conversation state is owned by the AI CLI itself (e.g., Claude Code's own session files) — Overseer does not manage it.

---

## Error Handling

- PTY spawn failure (bad CWD, missing binary): surface error inline in the new tab, keep the session record so the user can fix config and retry.
- Scrollback write failure: log to console, continue. Missing scrollback = no history on reopen, but session is otherwise functional.
- Git command failure: display stderr in the tool panel. No crash.
- IPC errors: renderer shows a disconnected state; user can restart the app.

---

## What This Is Not

- Not a project editor. Overseer has no file tree, no editor pane.
- Not a tmux replacement (for v1). Sessions die with the app process; architecture supports extracting to a daemon later.
- Not an AI orchestrator. Overseer injects config and provides a shell — AI CLIs manage their own conversation state.

---

## Out of Scope (v1)

- Multi-window support
- Terminal splitting within a tab
- Dynamic CWD tracking (`cd` detection)
- External daemon / true background persistence
- Non-git tool panels (file browser, MCP viewer, etc.)
- Agent auto-launch (Overseer opens a shell with env injected; user launches the CLI manually or via shell alias)

# Plan: Remove Agent Context Injection System

## What This Is

The "agent injection system" intercepts CLI agent invocations (claude, gemini) by:
1. Creating a per-session `bin/` directory containing wrapper shell scripts
2. Prepending that `bin/` dir to `PATH` so wrappers shadow real CLIs
3. Writing a `context.json` per session with instructions
4. Wrappers read `context.json` and pass a `--system-prompt` (Claude) or `GEMINI.md` file injection to the real binary
5. Handling Zsh `ZDOTDIR` override to ensure PATH injection survives `.zshrc`

This was also coupled to `agent-config.ts` which read `~/.overseer/agents/<type>.json` and `~/.overseer/<TYPE>.md` to build `instructions` and `env` fields for each session.

## Files to DELETE

| File | Reason |
|------|--------|
| `src/main/session-service/agent-config.ts` | Reads JSON/Markdown configs to build instructions/env — the entire thing is the injection system |
| `src/main/session-service/wrapper-templates.ts` | The wrapper bash scripts that do the actual injection |
| `tests/main/agent-config.test.ts` | Tests for the deleted module |

## Files to MODIFY

### `src/renderer/types/ipc.ts`
- Remove `envVars: Record<string, string>` from `Session` interface (was only populated by `readAgentConfig`)
- Remove `instructions?: string` from `Session` interface (was only populated by `readAgentConfig`)

### `src/main/session-service/index.ts`
- Remove imports: `readAgentConfig`, `CLAUDE_WRAPPER`, `GEMINI_WRAPPER`
- In `create()`: Remove `readAgentConfig` call; remove `envVars` and `instructions` from Session object
- Delete `ensureSessionEnvironment()` method entirely (all it did was set up wrappers, context.json, PATH, and ZDOTDIR)
- In `spawnPty()`: pass `process.env as Record<string, string>` directly instead of calling `ensureSessionEnvironment`
- In `restoreAll()`: Remove `readAgentConfig` logic (the only thing it did was refresh instructions)

### Test fixture updates (remove `envVars: {}` since field is gone from Session type)
- `tests/renderer/TabBar.test.tsx`
- `tests/renderer/useCompanion.test.tsx`
- `tests/renderer/SessionDrawer.test.tsx`
- `tests/renderer/App-shortcuts-toggle.test.tsx`
- `tests/main/registry.test.ts`
- `tests/main/pty-manager.test.ts`

### `src/main/session-service/AGENTS.md`
- Update the "Key Components" list to remove references to `agent-config.ts` and `wrapper-templates.ts`

## What Is Kept

- `agentType` on `Session` — still used in the UI (SessionDrawer shows it, NewSessionDialog sets it)
- The `envVars`-free env merge in `spawnPty` — sessions will simply inherit the parent process env

## Rationale

The wrapper interception approach was brittle (depends on PATH order, Zsh ZDOTDIR hacks, node inline scripts in bash). It's been superseded and is no longer needed. Removing it simplifies the PTY spawn path significantly.

## No Optional Improvements

This is a clean deletion. No weak points are introduced; the code only gets simpler.

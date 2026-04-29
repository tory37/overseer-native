# Design Doc: Sprite Injection (Dynamic PATH Proxy)

## Status: Approved

## Overview
Enable persistent, session-level "sprite" (persona) and instruction injection for AI agents (`claude`, `gemini`, etc.) running within Overseer terminal sessions. This ensures that any time an agent is invoked manually by the user or by the system, it inherits the current session's context.

## Goals
- **Static yet Terminal-Level:** Injected context should live through opening/closing any agent in a single session.
- **Dynamic Updates:** Updating a sprite in the UI should immediately affect the next agent invocation in the terminal.
- **Shell Agnostic:** Works across `bash`, `zsh`, and other common shells.
- **Transparent:** The user shouldn't need to change how they call agents.

## Architecture

### 1. File System Layout
All session-specific data resides in `~/.overseer/sessions/<session_id>/`:
- `bin/`: Contains executable wrapper scripts for agents.
- `context.json`: A JSON file containing `persona`, `instructions`, and other metadata.
- `scrollback.log`: (Existing) Session history.

### 2. The PATH Proxy Mechanism
When a session is created:
- Overseer generates wrapper scripts for supported agents in the session's `bin/` directory.
- The PTY's `PATH` environment variable is modified to prepend the session's `bin/` directory.
- `OVERSEER_SESSION_DIR` is set to point to the session's root directory.

### 3. Wrapper Implementation
Wrappers are shell scripts that:
1. Locate the "real" binary by temporarily removing the proxy `bin/` from `PATH` and using `which`.
2. Extract context from `$OVERSEER_SESSION_DIR/context.json`.
3. Prepend/append the appropriate flags (e.g., `--system-prompt` for Claude) to the original command arguments.
4. `exec` the real binary.

#### Example Claude Wrapper:
```bash
#!/bin/bash
REAL_CLAUDE=$(PATH=$(echo "$PATH" | sed -e "s|$OVERSEER_SESSION_DIR/bin:||g") which claude)
PERSONA=$(python3 -c "import json, os; d=json.load(open(os.path.join(os.environ['OVERSEER_SESSION_DIR'], 'context.json'))); print(d.get('persona', ''))")
exec "$REAL_CLAUDE" --system-prompt "$PERSONA" "$@"
```

## Data Flow
1. **UI:** User selects/updates a Sprite for a session.
2. **Main Process:** `SessionService` writes the Sprite details into `~/.overseer/sessions/<id>/context.json`.
3. **Terminal:** User types `claude fix this bug`.
4. **Shell:** Finds the proxy `bin/claude` first because it's at the front of `PATH`.
5. **Proxy:** Reads `context.json`, builds the system prompt, and runs the real `claude`.

## Supported Agents
Initial support will include:
- `claude` (Claude Code)
- `gemini` (Gemini CLI)

## Error Handling
- If `context.json` is missing or malformed, wrappers should fall back to executing the real binary without injection.
- If the "real" binary isn't found, the wrapper should exit with an error similar to what the shell would have provided.

## Dependencies
- `python3` (for JSON parsing in wrappers, as it's highly portable on developer machines).
- `sed` (standard Unix utility).

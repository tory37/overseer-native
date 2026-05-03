# Session Service Architecture

This directory (`src/main/session-service/`) handles the core terminal PTY management and session lifecycle. It represents the boundary between the frontend React UI and the underlying OS shell.

## Key Components

- **`index.ts` (SessionService):** The public interface for session management. Orchestrates creation, deletion, test session purging, and orphaned directory sweeping.
- **`registry.ts` (SessionRegistry):** Persists session metadata to disk in the user's `.overseer` directory.
- **`pty-manager.ts` (PtyManager):** Manages `node-pty` processes, spawning shells, and mapping PTY instances to session IDs.
- **`scrollback.ts` (ScrollbackManager):** Buffers shell output to retain history before the UI connects or for state restoration.
- **`agent-config.ts` & `wrapper-templates.ts`:** Handles configurations for AI agents running within the terminal and injects wrapper scripts (e.g., Claude, Gemini) to intercept specific output.

## Rules & Conventions

- **Strict Isolation:** Do not expose `node-pty` directly to the renderer. All interactions must be serialized and passed through strict IPC channels.
- **Lifecycle Management:** Ensure that spawned PTY processes are properly killed when a session is deleted to avoid zombie processes.
- **File System Safety:** Be careful with file system operations (like purging test sessions) to ensure we do not accidentally delete unrelated files in `.overseer/sessions`.

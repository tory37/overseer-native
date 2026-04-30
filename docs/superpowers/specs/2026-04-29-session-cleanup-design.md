# Design Spec: Comprehensive Session Management & Cleanup

## Problem
The `overseer` application is leaving orphaned session directories on disk. This is caused by:
1. `SessionService` ignoring the `baseDir` constructor argument, leading tests to pollute `~/.overseer`.
2. `SessionService.kill()` only removing sessions from the registry and PTY manager, but not from disk.
3. Tests creating sessions that are never cleaned up.

## Goals
- Prevent tests and AI-driven sessions from polluting the user's main session directory.
- Ensure session directories are deleted when a session is killed.
- Automatically clean up "test" sessions and orphaned directories on application startup.

## Architecture & Implementation

### 1. Data Model Changes
Update `src/renderer/types/ipc.ts`:
- Add `isTest: boolean` to `Session` interface.
- Add `isTest?: boolean` to `CreateSessionOptions` interface.

### 2. SessionService Enhancements
Update `src/main/session-service/index.ts`:
- **Path Normalization:** Ensure `this.baseDir` is used for all session-related paths (scrollback, session dir, context.json, etc.).
- **Kill Cleanup:** Modify `kill(sessionId)` to use `fs.rmSync(sessionDir, { recursive: true, force: true })`.
- **Startup Purge (`purgeTestSessions`):**
    - Iterate through the registry.
    - If a session has `isTest: true`, call `kill(session.id)`.
- **Orphan Sweep (`sweepOrphanedDirectories`):**
    - List all items in `this.baseDir/sessions/`.
    - If an item is a directory, matches a UUID pattern, and is NOT in the registry, delete it.
- **Initialization:** Call both purge and sweep in the constructor.

### 3. Test Suite Fixes
Update `tests/main/session-service-sprite.test.ts` (and any others):
- Use `path.join(os.tmpdir(), 'overseer-test-...')` for `SessionService` constructor.
- Mark sessions created during tests with `isTest: true`.

### 4. Git Service / Sync Service
- Verify if `SyncService` or other services need similar path normalization (they should already be using `baseDir` via `ConfigService` but I will double check).

## Success Criteria
- All tests pass.
- Running tests does not create any new directories in `~/.overseer/sessions`.
- Calling `kill()` on a session removes its directory from disk.
- Restarting the app cleans up any sessions marked `isTest` and any orphaned directories.

## Risk Assessment
- **Accidental Deletion:** The orphan sweep must be careful only to delete directories that look like UUIDs and are definitely not registered. It should avoid `registry.json` and other config files.
- **Race Conditions:** `fs.rmSync` should handle cases where directories are already gone.

# Spec: Mac Shell Environment Fix

**Goal:** Ensure that Overseer terminals (main and companion) correctly load the user's full shell environment on macOS, specifically fixing issues where tools like `aws`, `brew`, and others are not found.

## Proposed Changes

### 1. Improve `shell-env.ts`
- **Shell Detection:** Use `os.userInfo().shell` as a fallback if `process.env.SHELL` is missing. On macOS, if both are missing, default to `/bin/zsh`.
- **Environment Sync:** Instead of only syncing a few variables, sync all environment variables captured from the login shell, except for a blacklist of internal Electron/App variables (e.g., `NODE_ENV`, `ELECTRON_RUN_AS_NODE`).
- **Parsing:** Use a more robust line parser that handles `=` in values correctly.

### 2. Enable Login Shells for PTYs
- **PTY Spawning:** Update `PtyManager.spawn` and `CompanionPtyManager.spawn` to include the `-l` (login) flag when spawning shells on non-Windows platforms.
- This ensures that login-specific configuration files (like `~/.zprofile` and `~/.bash_profile`) are sourced by the shell itself.

### 3. Enhance `ZDOTDIR` Logic in `SessionService`
- **Configuration Wrapping:** When `ZDOTDIR` is used for Zsh sessions, we must ensure that all standard Zsh initialization files are still sourced from the user's home directory.
- We will create wrapper files in the session's `ZDOTDIR` for:
    - `.zshenv`: Sources `~/.zshenv`
    - `.zprofile`: Sources `~/.zprofile`
    - `.zshrc`: Sources `~/.zshrc`, then appends our internal `bin` directory to `PATH`.
    - `.zlogin`: Sources `~/.zlogin`

## Architecture Impact
- **Main Process:** `loadShellEnv` will more accurately reflect the user's environment, improving services that rely on external tools (like Git).
- **PTY Management:** Terminals will behave more like standard system terminals.
- **Zsh Initialization:** The `ZDOTDIR` hack becomes more transparent and less likely to break user-specific configurations.

## Testing Strategy
- **Unit Tests:** Add tests for `loadShellEnv` (mocking `execSync` output) to verify robust parsing and syncing.
- **Integration Tests:** Verify that `PtyManager` correctly passes the `-l` flag on Unix-like systems.
- **Manual Verification:** (On Mac) Verify that `aws` and other Homebrew-installed tools are available in both main and companion terminals.

## Alternatives Considered
- **No ZDOTDIR:** Simpler but risks the user's `~/.zshrc` prepending paths that shadow our `claude`/`gemini` wrappers. The "wrapped ZDOTDIR" approach is safer.
- **Selective Sync:** Hard to maintain a whitelist of all possible tool-manager variables (nvm, rbenv, asdf, brew, etc.). Sync-all is the industry standard for this problem.

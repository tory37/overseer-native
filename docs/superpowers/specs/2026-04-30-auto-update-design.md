# Spec: Auto Update Feature

## Goal
Implement a robust, user-friendly auto-update system for Overseer on Mac and Linux using `electron-updater`.

## Dependencies
- **`electron-updater`**: Will be added to `dependencies` to handle the update lifecycle.

## Architecture

### Main Process
- **`UpdateService` (`src/main/services/update-service.ts`)**:
    - Wraps `electron-updater`.
    - Configuration: Points to GitHub repo `tory37/overseer-native` (configured via `package.json` build settings).
    - **Methods**:
        - `init()`: Sets up listeners, starts background timer (1 hour interval).
        - `checkForUpdates()`: Manually triggers a check.
        - `installUpdate()`: Calls `quitAndInstall()`.
    - **Events**: Listens for `update-available`, `download-progress`, `update-downloaded`, and `error`.
- **IPC Handlers (`src/main/ipc-handlers.ts`)**:
    - `update:check`: Invokes `UpdateService.checkForUpdates()`.
    - `update:install`: Invokes `UpdateService.installUpdate()`.
    - `update:status` (Event): Emitted to Renderer via `webContents.send` whenever status changes.

### Renderer Process
- **`UpdateBanner` Component (`src/renderer/components/UpdateBanner.tsx`)**:
    - Sits at the top of `App.tsx`.
    - **Styling**: Uses absolute/sticky positioning to ensure it doesn't shift the entire UI layout jarringly when it appears, or pushes content down smoothly.
    - **States**:
        - `hidden`: No update or error.
        - `available`: "Update available. Downloading..." with a progress bar.
        - `downloaded`: "Update ready to install. [Restart Now]".
- **`SettingsModal` Integration**:
    - Adds a "System" section.
    - "Check for Updates" button that triggers `update:check`.
    - Shows "Checking...", "Up to date", or "Error" feedback.

## User Experience

1. **Background Check**: App checks every hour.
2. **Notification**: A subtle banner appears at the top if an update is found.
3. **Download**: Progress is shown in the banner.
4. **Action**: Once downloaded, the banner changes to a "Restart to Update" button.
5. **Manual Check**: Users can always trigger a check from Settings.

## Platform Support
- **Mac**: DMG/Zip updates via GitHub Releases.
- **Linux**: AppImage updates via GitHub Releases.

## Testing
- **Mocks**: Use `jest` to mock `electron-updater` in `UpdateService` tests.
- **Dev Mode Simulation**: Add a hidden dev-only IPC or environment variable to trigger the "Update Available" UI state for testing the banner and progress bar components.

## Success Criteria
- [ ] App correctly identifies when a new version is available on GitHub.
- [ ] Banner appears and accurately shows download progress.
- [ ] Clicking "Restart to Update" successfully closes the app and installs the update.
- [ ] Manual check in Settings works as expected.

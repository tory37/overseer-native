# Design: Environment Separation and Development Tools

## Goal
Separate development data from production data and provide tools for developers to manage this data and identify the current environment.

## Architecture & Data Separation
The application will detect the environment using `process.env.NODE_ENV`.

### Data Paths
- **Development:** `~/.overseer-dev`
- **Production:** `~/.overseer`

### Implementation Details (Main Process)
- `ConfigService` will be updated to accept a custom `baseDir`.
- `src/main/index.ts` will determine the `baseDir` based on `NODE_ENV`.
- `SessionService` and `SyncService` (and any other service using `ConfigService`) will be initialized with the correct `baseDir`.

## IPC and Preload
New properties and methods will be exposed via `contextBridge` in `src/main/preload.ts`:

- `isDev`: `boolean`
- `appVersion`: `string` (from `package.json`)
- `openDataFolder()`: `Promise<void>` - Opens the current data directory in the system file manager.
- `clearAndRestart()`: `Promise<void>` - (Dev only) Deletes the `~/.overseer-dev` directory and restarts the Electron application.

## UI Components (Renderer)

### Header Status Badge
A new component or addition to `App.tsx` (in the header section) that displays:
- **Dev Mode:** `[ DEV MODE ]` (Styled to be prominent, e.g., using a warning color).
- **Production:** `[ PRODUCTION v<version> ]` (Styled to be subtle/muted).
Location: Left of the Settings (⚙) icon.

### Developer Tools in UI
- **Open Data Folder:** A button in `SettingsModal.tsx` accessible to all users.
- **Clear & Restart:** A button in `SettingsModal.tsx`, visible **only** when `isDev` is true.

## Testing Strategy
1. **Manual Verification:**
    - Run in dev (`npm run dev:renderer` + `electron .` or `npm start` which builds and runs).
    - Check if data is saved to `~/.overseer-dev`.
    - Verify "DEV MODE" badge visibility.
    - Test "Open Data Folder" and "Clear & Restart" buttons.
2. **Automated Tests:**
    - Unit tests for `ConfigService` to ensure it respects the `baseDir`.
    - Mock IPC handlers to test UI logic in `SettingsModal`.

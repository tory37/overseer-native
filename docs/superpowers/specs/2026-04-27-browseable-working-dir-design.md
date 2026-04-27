# Browseable Working Directory in New Session Dialog

## Summary

Replace the plain text input for "Working Directory" in `NewSessionDialog` with a text input + Browse button combo. Clicking Browse opens the OS-native directory picker. Typed paths are validated live with a debounce. The field is optional; empty means no cwd override.

## IPC Layer

Two new channels, added to `ipc-handlers.ts`, `preload.ts`, and `electron.d.ts`:

| Channel | Main-process implementation | Returns |
|---|---|---|
| `dialog:open-directory` | `dialog.showOpenDialog({ properties: ['openDirectory'], defaultPath })` | `string \| null` (null = cancelled) |
| `fs:is-directory` | `fs.stat(path)` → check `isDirectory()` | `boolean` |

`defaultPath` for the open dialog is the current `cwd` value if non-empty, otherwise `os.homedir()`.

## UI Changes (`NewSessionDialog.tsx`)

- The Working Directory row becomes a flex row: text input (flex-grow) + "Browse" button.
- Clicking Browse calls `window.overseer.openDirectory(cwd || homedir)`. If a path is returned it replaces `cwd`.
- `cwd` field is **optional** — empty is valid, the Create button is never blocked by this field alone.

### Validation state

```
cwdValid: true | false | null
  null  = not checked (empty or freshly loaded)
  true  = path confirmed as directory
  false = path not found or not a directory
```

A `useEffect` watches `cwd`:
1. Sets `cwdValid = null` immediately (clears stale result).
2. If `cwd` is empty, stops here (no IPC call, no error shown).
3. After 400ms debounce, calls `window.overseer.isDirectory(cwd)` and sets `cwdValid`.
4. Debounce timer is cancelled on unmount.

### Visual feedback

- `cwdValid === false` → red border on input + `"Directory not found"` error line beneath
- `cwdValid === true` → normal border
- `cwdValid === null` → normal border, no error

## Edge Cases

- **Browse cancelled** — no change to `cwd`, no validation state change.
- **Field cleared** — `cwdValid` resets to `null`, no error shown.
- **Unmount mid-debounce** — timer cleared in `useEffect` cleanup to avoid setState on unmounted component.

## Files Affected

- `src/main/ipc-handlers.ts` — add 2 IPC handlers
- `src/main/preload.ts` — expose 2 new channels
- `src/renderer/types/electron.d.ts` — add 2 method signatures to `window.overseer`
- `src/renderer/components/NewSessionDialog.tsx` — Browse button, validation state, visual feedback

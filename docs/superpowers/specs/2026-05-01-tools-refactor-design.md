# Tools Refactor — Design Spec
**Date:** 2026-05-01
**Status:** Approved

---

## Overview

Refactor the Overseer right sidebar from a hardcoded panel into a dynamic plugin container that loads user-built tool components from a configured directory. A companion template project gives tool authors a structured starting point with a built-in dev harness.

---

## Architecture

### Plugin Loading

Overseer adds a `pluginsDir` config key (e.g., `~/.overseer/tools/`).

**Main process** (startup + config change):
1. Scans `pluginsDir` for subdirectories containing `plugin.json`
2. Reads and validates each manifest
3. Resolves each tool's `entry` path to an absolute path relative to its plugin directory
4. Sends the resolved tool list to the renderer via IPC (`overseer.getPlugins()`)
4. Does not load or execute tool code — discovery only

**Renderer:**
1. Receives the manifest list via IPC
2. Dynamically imports each tool's entry point at runtime:
   ```ts
   const mod = await import(/* @vite-ignore */ `file://${tool.entry}`)
   // mod.default is a React component accepting ToolContext
   ```
3. Renders tools in the plugin container with a `ToolContext` prop

### ToolContext Interface

The entire API surface between Overseer and user tools:

```ts
interface ToolContext {
  version: 1
  cwd: string        // active session's working directory
  sessionId: string  // active session ID
}
```

- `version` field enables future non-breaking additions
- Tools that need OS access (git, filesystem) implement their own IPC or shell calls
- Tools do NOT receive access to Overseer's internal `window.overseer` bridge
- The `ToolContext` type definition is copied into the companion template — tools are fully decoupled from Overseer at build time

---

## Sidebar Layout

```
RightSidebar (column, 260px wide)
├── ToolContainer (flex: 1, overflow hidden)
│   ├── TabBar — icon + label tabs for switching active tool
│   └── ActiveToolPanel — renders the selected tool component
└── SpritePanel (built-in feature, fixed height when visible, collapsed when not)
```

**SpritePanel** is rendered directly by `RightSidebar`, outside the plugin system entirely. It is unaffected by plugin loading, errors, or navigation state.

**Tab navigation (v1):**
- Up to 6 tools: icon + short label tabs
- Tab switching is local state in `ToolContainer`

**Tool sizing note (for developers):**
The tool panel's available height varies — the Sprite companion panel can be toggled by the user. Design for variable height. Use `flex: 1` and `overflow: auto` rather than fixed-pixel heights. Do not assume a minimum height.

---

## Plugin Manifest Format

Each plugin is a directory containing:

```
my-plugin/
├── plugin.json     # entry paths are relative to this directory
├── git.js          # built tool entry points
└── ...
```

`plugin.json` schema:
```json
{
  "name": "My Overseer Tools",
  "version": "1.0.0",
  "tools": [
    {
      "id": "git",
      "name": "Git",
      "icon": "git-branch",
      "entry": "git.js"
    }
  ]
}
```

---

## Reference Implementation: GitPanel Plugin

The existing `GitPanel` component is demoted from a built-in to a first-party plugin. It lives in the companion template repo as the canonical reference implementation demonstrating:
- Correct `ToolContext` consumption
- Self-contained IPC (no `window.overseer` dependency)
- Handling variable panel height

---

## Companion Template Project

A GitHub template repository that tool authors clone.

### Structure

```
overseer-tools-template/
├── plugin.json                  # manifest
├── package.json                 # react, typescript, vite as devDeps
├── vite.config.ts               # lib mode, one entry per tool
├── src/
│   ├── types.ts                 # ToolContext interface (copied from Overseer)
│   └── git/
│       └── index.tsx            # reference GitPanel plugin
├── dist/                        # build output — point Overseer's pluginsDir here
│   ├── plugin.json
│   └── git.js
└── README.md
```

### Build

```bash
vite build   # outputs to dist/
```

User sets Overseer's `pluginsDir` config to their `dist/` directory.

### Dev Harness

`vite dev` spins up a minimal Electron-less React shell that renders the `RightSidebar` layout with a mock `ToolContext`:

```ts
const mockContext: ToolContext = {
  version: 1,
  cwd: '/mock/project',
  sessionId: 'dev',
}
```

Tool authors get hot-reload and can develop/test their tool in context without running Overseer.

---

## Error Handling

| Failure | Behavior |
|---|---|
| `pluginsDir` missing or unreadable | Warning logged, sidebar shows empty state with config hint |
| Malformed `plugin.json` | That plugin skipped with console error, others load normally |
| Tool component throws at render | React Error Boundary per tool shows inline error card, rest of sidebar unaffected |

---

## Out of Scope (v1)

See `docs/ideas/_tools_refactor_v2.json` for deferred items.

- Tool keybinding injection
- Tab overflow + pin/favorites system (> 6 tools)
- NPM package distribution for plugins

---

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Loading mechanism | ESM dynamic `import()` | Fits Vite naturally, lightweight, trivial context injection |
| Plugin format | Manifest-driven directories | Supports multi-tool plugins, clean metadata home, scales past file-per-tool |
| Context bridge | `ToolContext { version, cwd, sessionId }` | Minimal — tools need session context, not app state |
| GitPanel | Demoted to reference plugin | Validates the plugin system with a real tool, removes hardcoded coupling |
| SpritePanel | Built-in, outside plugin container | Not a tool — a companion feature. Unrelated to plugin lifecycle |
| Tab navigation | Icon + label, ≤ 6 for v1 | Sufficient for v1; overflow deferred until there are tools to overflow |
| Tool sizing | `flex: 1`, variable height by design | SpritePanel visibility changes available height |
| Error isolation | React Error Boundary per tool | Prevents one bad tool from taking down the sidebar |
| Dev harness | Vite shell in companion template | Enables hot-reload development without running Overseer |

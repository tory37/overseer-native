# Plugin Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the right sidebar from a hardcoded GitPanel into a dynamic plugin container that discovers and loads user-built ESM tool components from `~/.overseer/plugins/`, with a companion template project providing a reference GitPanel implementation.

**Architecture:** The main process scans `~/.overseer/plugins/` for subdirectories containing `plugin.json`, resolves absolute entry paths, and serves the manifest list via IPC (`PLUGINS_GET`). The renderer calls `usePlugins()` which fetches the list then dynamically `import()`s each tool's built JS bundle. Tools receive a `ToolContext` prop (`{ version, cwd, sessionId }`) and handle their own OS interactions. `SpritePanel` remains a built-in outside the plugin container. The existing `GitPanel` is demoted to the first-party reference plugin in the companion template.

**Tech Stack:** Electron 30, React 18.3, TypeScript 6, Vite 8, Jest (tests in `tests/main/` and `tests/renderer/`)

**Worktree:** `/home/toryhebert/src/overseer-plugin-sidebar` (branch `feat/plugin-sidebar`)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/renderer/types/ipc.ts` | Modify | Add `PluginTool` type + `IPC.PLUGINS_GET` constant |
| `src/renderer/types/electron.d.ts` | Modify | Add `getPlugins` to `Window.overseer` |
| `src/main/plugin-discovery.ts` | Create | Scan pluginsDir, parse manifests, resolve absolute paths |
| `src/main/ipc-handlers.ts` | Modify | Register `PLUGINS_GET` handler |
| `src/main/preload.ts` | Modify | Expose `getPlugins` via contextBridge |
| `src/renderer/components/ToolErrorBoundary.tsx` | Create | React Error Boundary — isolates per-tool render failures |
| `src/renderer/hooks/usePlugins.ts` | Create | IPC fetch + dynamic ESM import of tool components |
| `src/renderer/components/ToolContainer.tsx` | Create | Tab bar + active tool panel |
| `src/renderer/components/RightSidebar.tsx` | Modify | Replace `GitPanel` with `ToolContainer` |
| `tools-template/` | Create | Companion template project with reference GitPanel plugin + dev harness |
| `tests/main/plugin-discovery.test.ts` | Create | Unit tests for plugin discovery |
| `tests/renderer/ToolErrorBoundary.test.tsx` | Create | Unit tests for error boundary |
| `tests/renderer/usePlugins.test.tsx` | Create | Unit tests for usePlugins hook |
| `tests/renderer/ToolContainer.test.tsx` | Create | Unit tests for ToolContainer |

---

### Task 1: Add Types and IPC Constants

**Files:**
- Modify: `src/renderer/types/ipc.ts`
- Modify: `src/renderer/types/electron.d.ts`

- [ ] **Step 1: Add PluginTool type to ipc.ts**

In `src/renderer/types/ipc.ts`, add this type after the `UpdateStatus` type (before the `Keybindings` line):

```ts
export interface PluginTool {
  id: string         // unique identifier within the plugin
  name: string       // display name shown in the tab bar
  icon: string       // icon name (reserved for future use)
  entry: string      // absolute path to the built JS entry point (resolved by main process)
  pluginName: string // name from plugin.json — used for error messages
}
```

- [ ] **Step 2: Add PLUGINS_GET to the IPC constant object**

In `src/renderer/types/ipc.ts`, add to the `IPC` object (after `UPDATE_INSTALL`):

```ts
  PLUGINS_GET: 'plugins:get',
```

- [ ] **Step 3: Update electron.d.ts to include getPlugins**

In `src/renderer/types/electron.d.ts`, update the import line to add `PluginTool`:

```ts
import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult, Keybindings, ThemeSettings, UpdateStatus, PluginTool } from './ipc'
```

Then add to the `overseer` interface, after `clearAndRestart`:

```ts
      getPlugins: () => Promise<PluginTool[]>
```

- [ ] **Step 4: Verify TypeScript is satisfied**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/renderer/types/ipc.ts src/renderer/types/electron.d.ts
git commit -m "feat: add PluginTool type and PLUGINS_GET IPC constant"
```

---

### Task 2: Plugin Discovery (Main Process)

**Files:**
- Create: `src/main/plugin-discovery.ts`
- Create: `tests/main/plugin-discovery.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/main/plugin-discovery.test.ts`:

```ts
import fs from 'fs'
import path from 'path'
import os from 'os'
import { discoverPlugins } from '../../src/main/plugin-discovery'

describe('discoverPlugins', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'overseer-plugins-test-'))
  })

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true })
  })

  test('returns empty array when plugins directory does not exist', async () => {
    const result = await discoverPlugins('/nonexistent/path/that/cannot/exist')
    expect(result).toEqual([])
  })

  test('returns empty array when plugins directory is empty', async () => {
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })

  test('skips subdirectories without plugin.json', async () => {
    await fs.promises.mkdir(path.join(tmpDir, 'no-manifest'))
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })

  test('skips subdirectories with malformed plugin.json and logs error', async () => {
    const pluginDir = path.join(tmpDir, 'bad-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(path.join(pluginDir, 'plugin.json'), 'not valid json {{')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  test('skips plugin.json with missing required fields', async () => {
    const pluginDir = path.join(tmpDir, 'incomplete-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({ name: 'Missing tools field' })
    )
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
    consoleSpy.mockRestore()
  })

  test('loads a valid plugin and resolves entry to absolute path', async () => {
    const pluginDir = path.join(tmpDir, 'my-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'My Plugin',
        version: '1.0.0',
        tools: [{ id: 'git', name: 'Git', icon: 'git-branch', entry: 'git.js' }],
      })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'git',
      name: 'Git',
      icon: 'git-branch',
      entry: path.join(pluginDir, 'git.js'),
      pluginName: 'My Plugin',
    })
  })

  test('loads multiple tools from a single plugin', async () => {
    const pluginDir = path.join(tmpDir, 'multi-tool-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'Multi',
        version: '1.0.0',
        tools: [
          { id: 'tool-a', name: 'Tool A', icon: 'a', entry: 'a.js' },
          { id: 'tool-b', name: 'Tool B', icon: 'b', entry: 'b.js' },
        ],
      })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('tool-a')
    expect(result[1].id).toBe('tool-b')
    expect(result[0].entry).toBe(path.join(pluginDir, 'a.js'))
  })

  test('loads tools from multiple plugin directories', async () => {
    for (const name of ['plugin-alpha', 'plugin-beta']) {
      const pluginDir = path.join(tmpDir, name)
      await fs.promises.mkdir(pluginDir)
      await fs.promises.writeFile(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name,
          version: '1.0.0',
          tools: [{ id: name, name, icon: 'x', entry: 'index.js' }],
        })
      )
    }
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(2)
  })

  test('ignores files at the top level of pluginsDir (only reads subdirectories)', async () => {
    await fs.promises.writeFile(
      path.join(tmpDir, 'plugin.json'),
      JSON.stringify({ name: 'root-level', version: '1.0.0', tools: [] })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/main/plugin-discovery.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '../../src/main/plugin-discovery'`

- [ ] **Step 3: Implement plugin-discovery.ts**

Create `src/main/plugin-discovery.ts`:

```ts
import fs from 'fs'
import path from 'path'
import type { PluginTool } from '../renderer/types/ipc'

interface RawToolEntry {
  id: string
  name: string
  icon: string
  entry: string
}

interface RawManifest {
  name: string
  version: string
  tools: RawToolEntry[]
}

function isValidManifest(obj: unknown): obj is RawManifest {
  if (!obj || typeof obj !== 'object') return false
  const m = obj as Record<string, unknown>
  return (
    typeof m.name === 'string' &&
    typeof m.version === 'string' &&
    Array.isArray(m.tools)
  )
}

export async function discoverPlugins(pluginsDir: string): Promise<PluginTool[]> {
  let entries: fs.Dirent[]
  try {
    entries = await fs.promises.readdir(pluginsDir, { withFileTypes: true })
  } catch {
    return []
  }

  const results: PluginTool[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const pluginDir = path.join(pluginsDir, entry.name)
    const manifestPath = path.join(pluginDir, 'plugin.json')

    let manifest: RawManifest
    try {
      const raw = await fs.promises.readFile(manifestPath, 'utf8')
      const parsed: unknown = JSON.parse(raw)
      if (!isValidManifest(parsed)) {
        console.error(`[plugins] Invalid manifest in ${pluginDir} — missing name, version, or tools`)
        continue
      }
      manifest = parsed
    } catch {
      console.error(`[plugins] Could not read or parse manifest in ${pluginDir}`)
      continue
    }

    for (const tool of manifest.tools) {
      results.push({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        entry: path.resolve(pluginDir, tool.entry),
        pluginName: manifest.name,
      })
    }
  }

  return results
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/main/plugin-discovery.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — 8 tests passing

- [ ] **Step 5: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/main/plugin-discovery.ts tests/main/plugin-discovery.test.ts
git commit -m "feat: add plugin discovery — scans pluginsDir, validates manifests, resolves paths"
```

---

### Task 3: IPC Handler + Preload Bridge

**Files:**
- Modify: `src/main/ipc-handlers.ts`
- Modify: `src/main/preload.ts`

- [ ] **Step 1: Add import and handler to ipc-handlers.ts**

In `src/main/ipc-handlers.ts`, add to the imports at the top:

```ts
import { discoverPlugins } from './plugin-discovery'
```

Note: `os` and `path` are already imported. Confirm `os` is present; if not add it:
```ts
import os from 'os'
```

Inside `registerIpcHandlers`, add after the `const configService = new ConfigService(baseDir)` line:

```ts
  const defaultPluginsDir = path.join(os.homedir(), '.overseer', 'plugins')
```

Then add the IPC handler near the other `configService.read` handlers (around line 92):

```ts
  ipcMain.handle(IPC.PLUGINS_GET, async () => {
    const config = await configService.read<{ pluginsDir?: string }>('app-config.json')
    const pluginsDir = config?.pluginsDir ?? defaultPluginsDir
    return discoverPlugins(pluginsDir)
  })
```

- [ ] **Step 2: Expose getPlugins in preload.ts**

In `src/main/preload.ts`, update the import to include `PluginTool`:

```ts
import type { Session, CreateSessionOptions, GitCommandResult, DriftStatus, SyncResult, Keybindings, ThemeSettings, UpdateStatus, PluginTool } from '../renderer/types/ipc'
```

Add to the `contextBridge.exposeInMainWorld('overseer', { ... })` object (after `clearAndRestart`):

```ts
  getPlugins: (): Promise<PluginTool[]> =>
    ipcRenderer.invoke(IPC.PLUGINS_GET),
```

- [ ] **Step 3: Verify TypeScript — no errors**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/main/ipc-handlers.ts src/main/preload.ts
git commit -m "feat: register PLUGINS_GET IPC handler and expose getPlugins via preload"
```

---

### Task 4: ToolErrorBoundary Component

**Files:**
- Create: `src/renderer/components/ToolErrorBoundary.tsx`
- Create: `tests/renderer/ToolErrorBoundary.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/ToolErrorBoundary.test.tsx`:

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToolErrorBoundary } from '../../src/renderer/components/ToolErrorBoundary'

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Tool render failed')
  return <div>Tool loaded fine</div>
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('renders children when no error occurs', () => {
  render(
    <ToolErrorBoundary toolName="Git">
      <ThrowingComponent shouldThrow={false} />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('Tool loaded fine')).toBeInTheDocument()
})

test('renders error card with tool name and message when child throws', () => {
  render(
    <ToolErrorBoundary toolName="Git">
      <ThrowingComponent shouldThrow={true} />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('Git failed to load')).toBeInTheDocument()
  expect(screen.getByText('Tool render failed')).toBeInTheDocument()
})

test('renders error card without message when error has no message', () => {
  const BadComponent = () => { throw new Error() }
  render(
    <ToolErrorBoundary toolName="MyTool">
      <BadComponent />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('MyTool failed to load')).toBeInTheDocument()
})

test('does not affect sibling components outside the boundary', () => {
  render(
    <div>
      <ToolErrorBoundary toolName="Bad">
        <ThrowingComponent shouldThrow={true} />
      </ToolErrorBoundary>
      <div>Sibling is fine</div>
    </div>
  )
  expect(screen.getByText('Bad failed to load')).toBeInTheDocument()
  expect(screen.getByText('Sibling is fine')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/ToolErrorBoundary.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '../../src/renderer/components/ToolErrorBoundary'`

- [ ] **Step 3: Implement ToolErrorBoundary.tsx**

Create `src/renderer/components/ToolErrorBoundary.tsx`:

```tsx
import React from 'react'

interface Props {
  toolName: string
  children: React.ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class ToolErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || '' }
  }

  componentDidCatch(error: Error) {
    console.error(`[ToolErrorBoundary] ${this.props.toolName} threw:`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '12px',
          margin: '8px',
          background: 'var(--bg-main)',
          border: '1px solid #f44747',
          borderRadius: '4px',
          color: '#f44747',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {this.props.toolName} failed to load
          </div>
          {this.state.errorMessage && (
            <div style={{ opacity: 0.8 }}>{this.state.errorMessage}</div>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/ToolErrorBoundary.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/renderer/components/ToolErrorBoundary.tsx tests/renderer/ToolErrorBoundary.test.tsx
git commit -m "feat: add ToolErrorBoundary to isolate per-tool render failures"
```

---

### Task 5: usePlugins Hook

**Files:**
- Create: `src/renderer/hooks/usePlugins.ts`
- Create: `tests/renderer/usePlugins.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/usePlugins.test.tsx`:

```tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePlugins } from '../../src/renderer/hooks/usePlugins'
import type { PluginTool } from '../../src/renderer/types/ipc'

const mockTool: PluginTool = {
  id: 'git',
  name: 'Git',
  icon: 'git-branch',
  entry: '/fake/path/git.js',
  pluginName: 'Git Plugin',
}

const TestComponent = () => {
  const { tools, loading } = usePlugins()
  if (loading) return <div>loading</div>
  return (
    <ul>
      {tools.map(t => (
        <li key={t.id}>{t.name}: {t.component ? 'loaded' : 'failed'}</li>
      ))}
    </ul>
  )
}

beforeEach(() => {
  Object.defineProperty(window, 'overseer', {
    value: { getPlugins: jest.fn().mockResolvedValue([mockTool]) },
    writable: true,
    configurable: true,
  })
})

test('starts in loading state', () => {
  render(<TestComponent />)
  expect(screen.getByText('loading')).toBeInTheDocument()
})

test('calls getPlugins on mount', async () => {
  render(<TestComponent />)
  await waitFor(() => expect(window.overseer.getPlugins).toHaveBeenCalledTimes(1))
})

test('resolves to empty list when getPlugins returns empty array', async () => {
  ;(window.overseer.getPlugins as jest.Mock).mockResolvedValue([])
  render(<TestComponent />)
  await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('marks tool as failed when dynamic import throws', async () => {
  // The entry path does not exist — import() will reject
  render(<TestComponent />)
  await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  expect(screen.getByText('Git: failed')).toBeInTheDocument()
})

test('does not update state after unmount (no setState after cancel)', async () => {
  const { unmount } = render(<TestComponent />)
  unmount()
  // No thrown "can't perform state update on unmounted component" — just verify no crash
  await new Promise(r => setTimeout(r, 50))
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/usePlugins.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '../../src/renderer/hooks/usePlugins'`

- [ ] **Step 3: Implement usePlugins.ts**

Create `src/renderer/hooks/usePlugins.ts`:

```ts
import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import type { PluginTool } from '../types/ipc'

export interface ToolContext {
  version: 1
  cwd: string
  sessionId: string
}

export interface LoadedTool extends PluginTool {
  component: ComponentType<{ context: ToolContext }> | null
  loadError: string | null
}

export function usePlugins(): { tools: LoadedTool[]; loading: boolean } {
  const [tools, setTools] = useState<LoadedTool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      let manifests: PluginTool[]
      try {
        manifests = await window.overseer.getPlugins()
      } catch (err) {
        console.error('[usePlugins] Failed to fetch plugin list:', err)
        manifests = []
      }

      const loaded = await Promise.all(
        manifests.map(async (tool): Promise<LoadedTool> => {
          try {
            // @vite-ignore suppresses the dynamic import warning in Vite builds
            const mod = await import(/* @vite-ignore */ `file://${tool.entry}`)
            const component = (mod.default as ComponentType<{ context: ToolContext }>) ?? null
            return { ...tool, component, loadError: null }
          } catch (err) {
            console.error(`[usePlugins] Failed to load tool "${tool.id}" from ${tool.entry}:`, err)
            return { ...tool, component: null, loadError: String(err) }
          }
        })
      )

      if (!cancelled) {
        setTools(loaded)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { tools, loading }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/usePlugins.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/renderer/hooks/usePlugins.ts tests/renderer/usePlugins.test.tsx
git commit -m "feat: add usePlugins hook — IPC discovery and dynamic ESM import with cancellation"
```

---

### Task 6: ToolContainer Component

**Files:**
- Create: `src/renderer/components/ToolContainer.tsx`
- Create: `tests/renderer/ToolContainer.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/ToolContainer.test.tsx`:

```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToolContainer } from '../../src/renderer/components/ToolContainer'
import type { ToolContext, LoadedTool } from '../../src/renderer/hooks/usePlugins'

// Mock usePlugins so tests control what tools are available
jest.mock('../../src/renderer/hooks/usePlugins', () => ({
  ...jest.requireActual('../../src/renderer/hooks/usePlugins'),
  usePlugins: jest.fn(),
}))
import { usePlugins } from '../../src/renderer/hooks/usePlugins'

const mockContext: ToolContext = { version: 1, cwd: '/test/project', sessionId: 'sess-1' }

const makeTool = (id: string, name: string): LoadedTool => ({
  id,
  name,
  icon: 'x',
  entry: `/fake/${id}.js`,
  pluginName: 'Test Plugin',
  component: ({ context }: { context: ToolContext }) => <div>{name} content — {context.cwd}</div>,
  loadError: null,
})

const makeFailedTool = (id: string, name: string): LoadedTool => ({
  id,
  name,
  icon: 'x',
  entry: `/fake/${id}.js`,
  pluginName: 'Test Plugin',
  component: null,
  loadError: 'Module not found',
})

test('shows loading state while plugins are loading', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({ tools: [], loading: true })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('Loading tools...')).toBeInTheDocument()
})

test('shows empty state when no plugins found', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({ tools: [], loading: false })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/No tools found/)).toBeInTheDocument()
})

test('renders a tab button for each tool', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('Git')).toBeInTheDocument()
  expect(screen.getByText('Notes')).toBeInTheDocument()
})

test('renders first tool content by default', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/Git content/)).toBeInTheDocument()
  expect(screen.queryByText(/Notes content/)).not.toBeInTheDocument()
})

test('switches active tool when tab clicked', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  fireEvent.click(screen.getByText('Notes'))
  expect(screen.getByText(/Notes content/)).toBeInTheDocument()
  expect(screen.queryByText(/Git content/)).not.toBeInTheDocument()
})

test('passes context to the active tool component', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/\/test\/project/)).toBeInTheDocument()
})

test('shows inline error card for tools that failed to import', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeFailedTool('bad', 'BadTool')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('BadTool failed to load')).toBeInTheDocument()
  expect(screen.getByText('Module not found')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/ToolContainer.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '../../src/renderer/components/ToolContainer'`

- [ ] **Step 3: Implement ToolContainer.tsx**

Create `src/renderer/components/ToolContainer.tsx`:

```tsx
import React, { useState } from 'react'
import { usePlugins } from '../hooks/usePlugins'
import { ToolErrorBoundary } from './ToolErrorBoundary'
import type { ToolContext } from '../hooks/usePlugins'

interface Props {
  context: ToolContext
}

export function ToolContainer({ context }: Props) {
  const { tools, loading } = usePlugins()
  const [activeId, setActiveId] = useState<string | null>(null)

  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '12px',
      }}>
        Loading tools...
      </div>
    )
  }

  if (tools.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '11px', padding: '16px', textAlign: 'center',
        lineHeight: 1.5,
      }}>
        No tools found. Add plugins to ~/.overseer/plugins/
      </div>
    )
  }

  const currentId = activeId ?? tools[0].id
  const activeTool = tools.find(t => t.id === currentId) ?? tools[0]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tools.map(tool => {
          const isActive = tool.id === currentId
          return (
            <button
              key={tool.id}
              onClick={() => setActiveId(tool.id)}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tool.name}
            </button>
          )
        })}
      </div>

      {/* Active tool panel */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {activeTool.component ? (
          <ToolErrorBoundary toolName={activeTool.name}>
            <activeTool.component context={context} />
          </ToolErrorBoundary>
        ) : (
          <div style={{
            padding: '12px', margin: '8px',
            background: 'var(--bg-main)',
            border: '1px solid #f44747',
            borderRadius: '4px',
            color: '#f44747',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {activeTool.name} failed to load
            </div>
            {activeTool.loadError && (
              <div style={{ opacity: 0.8 }}>{activeTool.loadError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest tests/renderer/ToolContainer.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS — 7 tests passing

- [ ] **Step 5: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/renderer/components/ToolContainer.tsx tests/renderer/ToolContainer.test.tsx
git commit -m "feat: add ToolContainer with tab navigation and inline error cards"
```

---

### Task 7: Refactor RightSidebar

**Files:**
- Modify: `src/renderer/components/RightSidebar.tsx`

- [ ] **Step 1: Replace GitPanel with ToolContainer**

Replace the entire content of `src/renderer/components/RightSidebar.tsx`:

```tsx
import React from 'react'
import { ToolContainer } from './ToolContainer'
import { SpritePanel } from './SpritePanel'
import type { Session } from '../types/ipc'
import type { ToolContext } from '../hooks/usePlugins'

interface Props {
  activeSession: Session | undefined
  spritePanelVisible: boolean
  onOpenStudio: () => void
}

export function RightSidebar({ activeSession, spritePanelVisible, onOpenStudio }: Props) {
  if (!activeSession) return null

  const context: ToolContext = {
    version: 1,
    cwd: activeSession.cwd,
    sessionId: activeSession.id,
  }

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ToolContainer context={context} />
      <SpritePanel
        sessionId={activeSession.id}
        spriteId={activeSession.spriteId ?? null}
        animationState="idle"
        visible={spritePanelVisible}
        onOpenStudio={onOpenStudio}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest --no-coverage 2>&1 | tail -20
```

Expected: all tests pass. `GitPanel.test.tsx` still passes — `GitPanel.tsx` still exists, it's just not wired into the sidebar.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx tsc --noEmit 2>&1
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add src/renderer/components/RightSidebar.tsx
git commit -m "feat: wire ToolContainer into RightSidebar, demote GitPanel from built-in"
```

---

### Task 8: Companion Template Project

**Files:**
- Create: `tools-template/plugin.json`
- Create: `tools-template/package.json`
- Create: `tools-template/vite.config.ts`
- Create: `tools-template/src/types.ts`
- Create: `tools-template/src/git/index.tsx`
- Create: `tools-template/src/DevHarness.tsx`
- Create: `tools-template/src/harness-main.tsx`
- Create: `tools-template/index.html`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /home/toryhebert/src/overseer-plugin-sidebar/tools-template/src/git
```

- [ ] **Step 2: Create tools-template/src/types.ts**

```ts
// ToolContext is the complete API surface between Overseer and your tool.
// This file is intentionally self-contained — do not import from Overseer.
export interface ToolContext {
  version: 1
  cwd: string        // absolute path to the active session's working directory
  sessionId: string  // active session ID (opaque string)
}
```

- [ ] **Step 3: Create tools-template/src/git/index.tsx — reference GitPanel plugin**

```tsx
import React, { useState } from 'react'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { ToolContext } from '../types'

const execAsync = promisify(exec)

type GitAction = 'Status' | 'Commit' | 'Push' | 'Pull'

interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

async function runGit(cwd: string, args: string[]): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(`git ${args.join(' ')}`, { cwd })
    return { stdout, stderr, exitCode: 0 }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number }
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? String(err), exitCode: e.code ?? 1 }
  }
}

export default function GitPanel({ context }: { context: ToolContext }) {
  const [output, setOutput] = useState<CommandResult | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async (action: GitAction) => {
    setLoading(true)
    setOutput(null)

    let result: CommandResult
    if (action === 'Commit') {
      const message = window.prompt('Commit message:')
      if (!message) { setLoading(false); return }
      result = await runGit(context.cwd, ['commit', '-m', message])
    } else if (action === 'Status') {
      result = await runGit(context.cwd, ['status'])
    } else if (action === 'Push') {
      result = await runGit(context.cwd, ['push'])
    } else {
      result = await runGit(context.cwd, ['pull'])
    }

    setOutput(result)
    setLoading(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px' }}>
      <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Git
      </div>
      <div style={{ fontSize: '11px', color: '#888', wordBreak: 'break-all' }}>
        {context.cwd}
      </div>
      {(['Status', 'Commit', 'Push', 'Pull'] as GitAction[]).map(action => (
        <button
          key={action}
          onClick={() => run(action)}
          disabled={loading}
          style={{
            background: '#0e639c', color: '#fff', border: 'none',
            borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {action}
        </button>
      ))}
      {output && (
        <div style={{
          flex: 1, background: '#1e1e1e',
          color: output.exitCode === 0 ? '#4ec9b0' : '#f44747',
          fontFamily: 'monospace', fontSize: '12px', padding: '8px',
          borderRadius: '4px', overflowY: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {output.stdout || output.stderr || '(no output)'}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create tools-template/src/DevHarness.tsx**

```tsx
import React, { useState } from 'react'
import type { ToolContext } from './types'

interface ToolDef {
  name: string
  Component: React.ComponentType<{ context: ToolContext }>
}

interface Props {
  tools: ToolDef[]
}

export function DevHarness({ tools }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cwd, setCwd] = useState(typeof process !== 'undefined' ? process.cwd() : '/')

  const context: ToolContext = { version: 1, cwd, sessionId: 'dev-harness' }
  const active = tools[activeIndex]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#1e1e1e', color: '#ccc' }}>
      {/* Sidebar frame — mirrors Overseer's 260px right sidebar */}
      <div style={{ width: '260px', background: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {tools.map((t, i) => (
            <button key={t.name} onClick={() => setActiveIndex(i)} style={{
              padding: '6px 10px', fontSize: '11px', cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: i === activeIndex ? '2px solid #0e639c' : '2px solid transparent',
              color: i === activeIndex ? '#0e639c' : '#888',
              fontWeight: i === activeIndex ? 600 : 400,
            }}>
              {t.name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {active && <active.Component context={context} />}
        </div>
      </div>

      {/* Control panel — set context values for testing */}
      <div style={{ padding: '20px', flex: 1 }}>
        <h3 style={{ marginTop: 0, color: '#ccc' }}>Dev Harness Controls</h3>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#888' }}>
          cwd (working directory)
        </label>
        <input
          value={cwd}
          onChange={e => setCwd(e.target.value)}
          style={{
            width: '100%', padding: '6px', background: '#333', border: '1px solid #555',
            color: '#ccc', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '11px', color: '#555', marginTop: '8px' }}>
          sessionId: {context.sessionId}
        </p>
        <p style={{ fontSize: '11px', color: '#555' }}>
          Note: tool panel height varies in Overseer when the Sprite companion panel is toggled.
          Design with <code>flex: 1</code> and <code>overflow: auto</code>.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create tools-template/src/harness-main.tsx**

```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevHarness } from './DevHarness'
import GitPanel from './git/index'

const tools = [
  { name: 'Git', Component: GitPanel },
]

createRoot(document.getElementById('root')!).render(<DevHarness tools={tools} />)
```

- [ ] **Step 6: Create tools-template/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Overseer Tools Dev Harness</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/harness-main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create tools-template/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // vite dev — runs the dev harness as a full browser app
    return { plugins: [react()] }
  }

  // vite build — library mode: one entry per tool, outputs to dist/
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: { git: path.resolve(__dirname, 'src/git/index.tsx') },
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: { entryFileNames: '[name].js' },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
```

- [ ] **Step 8: Create tools-template/package.json**

```json
{
  "name": "overseer-tools-template",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 9: Create tools-template/plugin.json**

```json
{
  "name": "Overseer Git Tools",
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

- [ ] **Step 10: Build the template to verify it compiles**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar/tools-template && npm install && npm run build 2>&1 | tail -15
```

Expected: `dist/git.js` produced, no errors

- [ ] **Step 11: Commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add tools-template/
git commit -m "feat: add companion template project with reference GitPanel plugin and dev harness"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run the complete test suite**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx jest --no-coverage 2>&1 | tail -20
```

Expected: all tests pass

- [ ] **Step 2: Full TypeScript check**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && npx tsc --noEmit 2>&1
```

Expected: no output (zero errors)

- [ ] **Step 3: Smoke-test the plugin loading chain**

```bash
mkdir -p ~/.overseer/plugins/git-plugin
cp /home/toryhebert/src/overseer-plugin-sidebar/tools-template/dist/git.js ~/.overseer/plugins/git-plugin/
cp /home/toryhebert/src/overseer-plugin-sidebar/tools-template/plugin.json ~/.overseer/plugins/git-plugin/
```

Then run Overseer in dev mode and confirm:
- The right sidebar shows a "Git" tab
- The Git tool renders and runs git commands
- Toggling the Sprite panel resizes the tool area without breaking layout

- [ ] **Step 4: Final commit**

```bash
cd /home/toryhebert/src/overseer-plugin-sidebar && git add -A
git status  # verify nothing unexpected
git commit -m "chore: final verification — plugin sidebar feature complete"
```

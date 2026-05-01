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

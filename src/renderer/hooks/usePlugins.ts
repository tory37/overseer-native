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

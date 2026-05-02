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

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

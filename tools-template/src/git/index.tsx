import React, { useState } from 'react'
import type { ToolContext } from '../types'

// window.overseer is exposed by Overseer's preload via contextBridge.
// Plugins run in the renderer with contextIsolation:true / nodeIntegration:false,
// so IPC is the only path to Node.js / git — never child_process directly.
declare const window: Window & {
  overseer: {
    gitStatus: (cwd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>
    gitCommit: (cwd: string, message: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>
    gitPush: (cwd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>
    gitPull: (cwd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>
  }
}

type GitAction = 'Status' | 'Commit' | 'Push' | 'Pull'

interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
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
      result = await window.overseer.gitCommit(context.cwd, message)
    } else if (action === 'Status') {
      result = await window.overseer.gitStatus(context.cwd)
    } else if (action === 'Push') {
      result = await window.overseer.gitPush(context.cwd)
    } else {
      result = await window.overseer.gitPull(context.cwd)
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

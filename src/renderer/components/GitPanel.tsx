import React, { useState } from 'react'
import type { GitCommandResult } from '../types/ipc'

interface Props {
  cwd: string
}

type GitAction = 'Status' | 'Commit' | 'Push' | 'Pull'

export function GitPanel({ cwd }: Props) {
  const [output, setOutput] = useState<GitCommandResult | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async (action: GitAction) => {
    setLoading(true)
    setOutput(null)
    let result: GitCommandResult

    if (action === 'Commit') {
      const message = window.prompt('Commit message:')
      if (!message) { setLoading(false); return }
      result = await window.overseer.gitCommit(cwd, message)
    } else if (action === 'Status') {
      result = await window.overseer.gitStatus(cwd)
    } else if (action === 'Push') {
      result = await window.overseer.gitPush(cwd)
    } else {
      result = await window.overseer.gitPull(cwd)
    }

    setOutput(result)
    setLoading(false)
  }

  const panelStyle: React.CSSProperties = {
    flex: 1, background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column',
    padding: '12px', gap: '8px',
  }
  const btnStyle: React.CSSProperties = {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px',
    padding: '6px 0', cursor: 'pointer', fontWeight: 600,
  }
  const outputStyle: React.CSSProperties = {
    flex: 1, background: 'var(--bg-main)', color: output?.exitCode === 0 ? '#4ec9b0' : '#f44747',
    fontFamily: 'monospace', fontSize: '12px', padding: '8px', borderRadius: '4px',
    overflowY: 'auto', whiteSpace: 'pre-wrap',
  }

  return (
    <div style={panelStyle}>
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Git</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{cwd}</div>
      {(['Status', 'Commit', 'Push', 'Pull'] as GitAction[]).map(action => (
        <button key={action} style={btnStyle} onClick={() => run(action)} disabled={loading}>
          {action}
        </button>
      ))}
      {output && (
        <div style={outputStyle}>
          {output.stdout || output.stderr || '(no output)'}
        </div>
      )}
    </div>
  )
}

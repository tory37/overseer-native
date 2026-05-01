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

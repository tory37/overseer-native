import * as pty from 'node-pty'
import { ScrollbackManager } from './scrollback'
import type { Session } from '../../renderer/types/ipc'

type DataCallback = (data: string) => void

export class PtyManager {
  private ptys = new Map<string, pty.IPty>()
  private scrollbacks = new Map<string, ScrollbackManager>()

  spawn(session: Session, env: Record<string, string>, onData: DataCallback, onError?: (err: string) => void): void {
    const shell = process.env.SHELL || '/bin/bash'
    const args = process.platform !== 'win32' ? ['-l'] : []
    try {
      const ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: session.cwd,
        env: env,
      })

      const scrollback = new ScrollbackManager(session.scrollbackPath)
      this.ptys.set(session.id, ptyProcess)
      this.scrollbacks.set(session.id, scrollback)

      ptyProcess.onData((data) => {
        scrollback.append(Buffer.from(data))
        onData(data)
      })

      ptyProcess.onExit(() => {
        this.ptys.delete(session.id)
        this.scrollbacks.delete(session.id)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      onError?.(`PTY spawn failed: ${message}`)
    }
  }

  write(sessionId: string, data: string): void {
    this.ptys.get(sessionId)?.write(data)
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.ptys.get(sessionId)?.resize(cols, rows)
  }

  kill(sessionId: string): void {
    try { this.ptys.get(sessionId)?.kill() } catch { /* process already exited */ }
    this.ptys.delete(sessionId)
    this.scrollbacks.delete(sessionId)
  }

  has(sessionId: string): boolean {
    return this.ptys.has(sessionId)
  }
}

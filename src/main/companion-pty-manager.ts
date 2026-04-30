import * as pty from 'node-pty'
import { randomUUID } from 'crypto'

type DataCallback = (id: string, data: string) => void
type ExitCallback = (id: string) => void

export class CompanionPtyManager {
  private ptys = new Map<string, pty.IPty>()

  spawn(cwd: string, onData: DataCallback, onExit: ExitCallback): string {
    const shell = process.env.SHELL || '/bin/bash'
    const args = process.platform !== 'win32' ? ['-l'] : []
    const id = randomUUID()

    const proc = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>,
    })

    proc.onData((data) => onData(id, data))
    proc.onExit(() => {
      this.ptys.delete(id)
      onExit(id)
    })

    this.ptys.set(id, proc)
    return id
  }

  write(companionId: string, data: string): void {
    this.ptys.get(companionId)?.write(data)
  }

  resize(companionId: string, cols: number, rows: number): void {
    this.ptys.get(companionId)?.resize(cols, rows)
  }

  kill(companionId: string): void {
    const proc = this.ptys.get(companionId)
    if (proc) {
      try { proc.kill() } catch { /* already exited */ }
      this.ptys.delete(companionId)
    }
  }

  has(companionId: string): boolean {
    return this.ptys.has(companionId)
  }
}

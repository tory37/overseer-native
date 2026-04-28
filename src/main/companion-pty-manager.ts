import * as pty from 'node-pty'
import { randomUUID } from 'crypto'

type DataCallback = (data: string) => void
type ExitCallback = () => void

export class CompanionPtyManager {
  private ptyProcess: pty.IPty | null = null
  private currentId: string | null = null

  spawn(onData: DataCallback, onExit: ExitCallback): string {
    if (this.ptyProcess) {
      try { this.ptyProcess.kill() } catch { /* already exited */ }
      this.ptyProcess = null
      this.currentId = null
    }

    const shell = process.env.SHELL || '/bin/bash'
    const id = randomUUID()

    const proc = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || '/',
      env: process.env as Record<string, string>,
    })

    this.ptyProcess = proc
    this.currentId = id

    proc.onData((data) => {
      if (this.currentId === id) onData(data)
    })

    proc.onExit(() => {
      if (this.currentId === id) {
        this.ptyProcess = null
        this.currentId = null
        onExit()
      }
    })

    return id
  }

  write(companionId: string, data: string): void {
    if (this.currentId === companionId) this.ptyProcess?.write(data)
  }

  resize(companionId: string, cols: number, rows: number): void {
    if (this.currentId === companionId) this.ptyProcess?.resize(cols, rows)
  }

  kill(companionId: string): void {
    if (this.currentId !== companionId) return
    try { this.ptyProcess?.kill() } catch { /* already exited */ }
    this.ptyProcess = null
    this.currentId = null
  }

  has(companionId: string): boolean {
    return this.currentId === companionId
  }
}

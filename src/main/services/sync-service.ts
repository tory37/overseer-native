import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { DriftStatus, SyncResult } from '../../renderer/types/ipc'

const execAsync = promisify(exec)

interface SyncServicePaths {
  stateFile?: string
  aiSync?: string
  rulesDir?: string
  skillsDir?: string
}

export class SyncService {
  private stateFile: string
  private aiSync: string
  private rulesDir: string
  private skillsDir: string

  constructor(paths: SyncServicePaths = {}) {
    const home = os.homedir()
    this.stateFile = paths.stateFile ?? path.join(home, '.overseer', 'sync-state.json')
    this.aiSync    = paths.aiSync    ?? path.join(home, '.local', 'bin', 'ai-sync')
    this.rulesDir  = paths.rulesDir  ?? path.join(home, '.ai-context', 'rules')
    this.skillsDir = paths.skillsDir ?? path.join(home, '.ai-context', 'skills')
  }

  private getLastSyncedAt(): Date | null {
    try {
      const raw = fs.readFileSync(this.stateFile, 'utf-8')
      const parsed = JSON.parse(raw)
      if (typeof parsed.lastSyncedAt === 'string') return new Date(parsed.lastSyncedAt)
    } catch {
      // missing or malformed
    }
    return null
  }

  private writeSyncedAt(date: Date): void {
    fs.writeFileSync(this.stateFile, JSON.stringify({ lastSyncedAt: date.toISOString() }), 'utf-8')
  }

  private driftedFiles(dir: string, since: Date | null): string[] {
    try {
      return fs.readdirSync(dir).filter(name => {
        if (!name.endsWith('.md')) return false
        const mtime = fs.statSync(path.join(dir, name)).mtime
        return since === null || mtime > since
      })
    } catch {
      return []
    }
  }

  getDriftStatus(): DriftStatus {
    const lastSyncedAt = this.getLastSyncedAt()
    return {
      lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
      rules:  this.driftedFiles(this.rulesDir,  lastSyncedAt),
      skills: this.driftedFiles(this.skillsDir, lastSyncedAt),
    }
  }

  async runSync(): Promise<SyncResult> {
    try {
      fs.accessSync(this.aiSync, fs.constants.X_OK)
    } catch {
      return { ok: false, output: `ai-sync not found at ${this.aiSync}` }
    }
    try {
      const { stdout, stderr } = await execAsync(this.aiSync)
      this.writeSyncedAt(new Date())
      return { ok: true, output: stdout + stderr }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      const output = ((e.stdout ?? '') + (e.stderr ?? '')) || (e.message ?? 'Unknown error')
      return { ok: false, output }
    }
  }
}

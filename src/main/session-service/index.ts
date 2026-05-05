import { randomUUID } from 'crypto'
import { SessionRegistry } from './registry'
import { PtyManager } from './pty-manager'
import { ScrollbackManager } from './scrollback'
import type { Session, CreateSessionOptions } from '../../renderer/types/ipc'
import os from 'os'
import path from 'path'
import fs from 'fs'

type DataCallback = (sessionId: string, data: string) => void
type ErrorCallback = (sessionId: string, err: string) => void

export class SessionService {
  private registry: SessionRegistry
  private ptyManager: PtyManager
  private onDataCallback: DataCallback | null = null
  private onErrorCallback: ErrorCallback | null = null
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
    this.registry = new SessionRegistry(path.join(this.baseDir, 'sessions'))
    this.ptyManager = new PtyManager()

    this.purgeTestSessions()
    this.sweepOrphanedDirectories()
  }

  private purgeTestSessions(): void {
    const testSessions = this.registry.list().filter(s => s.isTest)
    for (const session of testSessions) {
      this.kill(session.id)
    }
  }

  private sweepOrphanedDirectories(): void {
    const sessionsDir = path.join(this.baseDir, 'sessions')
    if (!fs.existsSync(sessionsDir)) return

    const registeredIds = new Set(this.registry.list().map(s => s.id))
    const items = fs.readdirSync(sessionsDir)

    for (const item of items) {
      const fullPath = path.join(sessionsDir, item)
      if (fs.statSync(fullPath).isDirectory() && !registeredIds.has(item)) {
        // Only delete if it looks like a UUID to avoid registry.json or other files
        if (item.match(/^[0-9a-f-]{36}$/i)) {
          fs.rmSync(fullPath, { recursive: true, force: true })
        }
      }
    }
  }

  onData(cb: DataCallback): void {
    this.onDataCallback = cb
  }

  onError(cb: ErrorCallback): void {
    this.onErrorCallback = cb
  }

  list(): Session[] {
    return this.registry.list()
  }

  create(options: CreateSessionOptions): Session {
    const id = randomUUID()

    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd || os.homedir(),
      scrollbackPath: path.join(this.baseDir, 'sessions', id, 'scrollback.log'),
      isTest: options.isTest || false,
    }

    fs.mkdirSync(path.dirname(session.scrollbackPath), { recursive: true })
    this.registry.add(session)
    this.spawnPty(session)
    return session
  }

  updateSession(sessionId: string, partial: Partial<Session>): void {
    this.registry.update(sessionId, partial)
  }

  getScrollback(sessionId: string): Buffer | null {
    const session = this.registry.list().find(s => s.id === sessionId)
    if (!session) return null
    return new ScrollbackManager(session.scrollbackPath).read()
  }

  writeToSession(sessionId: string, data: string): void {
    this.ptyManager.write(sessionId, data)
  }

  resizeSession(sessionId: string, cols: number, rows: number): void {
    this.ptyManager.resize(sessionId, cols, rows)
  }

  kill(sessionId: string): void {
    this.ptyManager.kill(sessionId)
    this.registry.remove(sessionId)

    const sessionDir = path.join(this.baseDir, 'sessions', sessionId)
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true })
    }
  }

  restoreAll(): void {
    for (const session of this.registry.list()) {
      if (!this.ptyManager.has(session.id)) {
        this.spawnPty(session)
      }
    }
  }

  private spawnPty(session: Session): void {
    this.ptyManager.spawn(
      session,
      process.env as Record<string, string>,
      (data) => { this.onDataCallback?.(session.id, data) },
      (err) => { this.onErrorCallback?.(session.id, err) }
    )
  }
}

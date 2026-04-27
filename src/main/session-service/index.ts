import { v4 as uuidv4 } from 'uuid'
import { SessionRegistry } from './registry'
import { PtyManager } from './pty-manager'
import { ScrollbackManager } from './scrollback'
import { readAgentEnvVars } from './agent-config'
import type { Session, CreateSessionOptions } from '../../renderer/types/ipc'
import os from 'os'
import path from 'path'

type DataCallback = (sessionId: string, data: string) => void
type ErrorCallback = (sessionId: string, err: string) => void

export class SessionService {
  private registry: SessionRegistry
  private ptyManager: PtyManager
  private onDataCallback: DataCallback | null = null
  private onErrorCallback: ErrorCallback | null = null

  constructor() {
    this.registry = new SessionRegistry()
    this.ptyManager = new PtyManager()
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
    const id = uuidv4()
    const envVars = readAgentEnvVars(options.agentType)
    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd,
      envVars,
      scrollbackPath: path.join(os.homedir(), '.overseer', 'sessions', `${id}.log`),
    }
    this.registry.add(session)
    this.spawnPty(session)
    return session
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
      (data) => { this.onDataCallback?.(session.id, data) },
      (err) => { this.onErrorCallback?.(session.id, err) }
    )
  }
}

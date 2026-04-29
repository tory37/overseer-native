import { randomUUID } from 'crypto'
import { SessionRegistry } from './registry'
import { PtyManager } from './pty-manager'
import { ScrollbackManager } from './scrollback'
import { readAgentEnvVars } from './agent-config'
import { CLAUDE_WRAPPER, GEMINI_WRAPPER } from './wrapper-templates'
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
    const id = randomUUID()
    const envVars = readAgentEnvVars(options.agentType)
    if (options.persona) {
      envVars['OVERSEER_SPRITE_PERSONA'] = options.persona
    }

    const sessionDir = path.join(os.homedir(), '.overseer', 'sessions', id)
    const binDir = path.join(sessionDir, 'bin')
    fs.mkdirSync(binDir, { recursive: true })
    fs.writeFileSync(
      path.join(sessionDir, 'context.json'),
      JSON.stringify({ persona: options.persona, spriteId: options.spriteId }, null, 2)
    )

    // Write wrappers
    fs.writeFileSync(path.join(binDir, 'claude'), CLAUDE_WRAPPER, { mode: 0o755 })
    fs.writeFileSync(path.join(binDir, 'gemini'), GEMINI_WRAPPER, { mode: 0o755 })

    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd || os.homedir(),
      envVars,
      scrollbackPath: path.join(sessionDir, 'scrollback.log'),
      spriteId: options.spriteId ?? null,
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
    const persona = session.envVars['OVERSEER_SPRITE_PERSONA']
    if (persona && (session.agentType === 'claude' || session.agentType === 'gemini')) {
      const escaped = persona
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')

      const cmd = session.agentType === 'claude'
        ? `claude --system-prompt "${escaped}"`
        : `gemini -i "system: ${escaped}"`

      setTimeout(() => {
        try {
          console.log(`[Sprite] Injecting persona for session ${session.id} (${session.agentType})`)
          this.ptyManager.write(session.id, `${cmd}\r`)
        } catch (err) {
          console.error(`[Sprite] Persona injection failed for session ${session.id}:`, err)
        }
      }, 800)
    }
  }
}

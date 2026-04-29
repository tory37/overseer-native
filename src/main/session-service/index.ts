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
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
    this.registry = new SessionRegistry(path.join(this.baseDir, 'sessions'))
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
    
    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd || os.homedir(),
      envVars,
      scrollbackPath: path.join(os.homedir(), '.overseer', 'sessions', id, 'scrollback.log'),
      spriteId: options.spriteId ?? null,
    }

    if (options.persona) {
      session.envVars['OVERSEER_SPRITE_PERSONA'] = options.persona
    }

    this.registry.add(session)
    this.spawnPty(session)
    return session
  }

  private ensureSessionEnvironment(session: Session): Record<string, string> {
    const sessionDir = path.join(os.homedir(), '.overseer', 'sessions', session.id)
    const binDir = path.join(sessionDir, 'bin')
    
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true })
    }

    // Ensure context.json exists
    const contextPath = path.join(sessionDir, 'context.json')
    if (!fs.existsSync(contextPath)) {
      fs.writeFileSync(contextPath, JSON.stringify({ 
        persona: session.envVars['OVERSEER_SPRITE_PERSONA'] || '', 
        spriteId: session.spriteId 
      }, null, 2))
    }

    // Ensure wrappers exist
    fs.writeFileSync(path.join(binDir, 'claude'), CLAUDE_WRAPPER, { mode: 0o755 })
    fs.writeFileSync(path.join(binDir, 'gemini'), GEMINI_WRAPPER, { mode: 0o755 })

    const env = { ...process.env, ...session.envVars }
    env['OVERSEER_SESSION_DIR'] = sessionDir
    env['PATH'] = `${binDir}:${env['PATH'] || process.env.PATH}`

    // Special handling for Zsh to prevent ~/.zshrc from overriding our PATH
    if (process.env.SHELL?.includes('zsh')) {
      env['ZDOTDIR'] = sessionDir
      const zshrcPath = path.join(sessionDir, '.zshrc')
      const originalZshrc = path.join(os.homedir(), '.zshrc')
      
      let zshrcContent = ''
      if (fs.existsSync(originalZshrc)) {
        zshrcContent += `source "\${HOME}/.zshrc"\n`
      }
      // Re-apply our PATH at the very end of zsh initialization
      zshrcContent += `export PATH="\${OVERSEER_SESSION_DIR}/bin:\${PATH}"\n`
      fs.writeFileSync(zshrcPath, zshrcContent)
    }
    
    return env as Record<string, string>
  }

  updateSprite(sessionId: string, spriteId: string, persona: string): void {
    const sessionDir = path.join(this.baseDir, 'sessions', sessionId)
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true })
    }
    fs.writeFileSync(
      path.join(sessionDir, 'context.json'),
      JSON.stringify({ persona, spriteId }, null, 2)
    )
    
    // Also update the session in registry so it persists
    const session = this.registry.list().find(s => s.id === sessionId)
    if (session) {
      session.envVars['OVERSEER_SPRITE_PERSONA'] = persona
      session.spriteId = spriteId
      this.registry.save() // Need to make save public or add an update method
    }
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
    const env = this.ensureSessionEnvironment(session)
    this.ptyManager.spawn(
      session,
      env,
      (data) => { this.onDataCallback?.(session.id, data) },
      (err) => { this.onErrorCallback?.(session.id, err) }
    )
  }
}

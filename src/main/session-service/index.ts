import { randomUUID } from 'crypto'
import { SessionRegistry } from './registry'
import { PtyManager } from './pty-manager'
import { ScrollbackManager } from './scrollback'
import { readAgentConfig } from './agent-config'
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
    const config = readAgentConfig(options.agentType, this.baseDir)
    
    const session: Session = {
      id,
      name: options.name,
      agentType: options.agentType,
      cwd: options.cwd || os.homedir(),
      envVars: config.env,
      instructions: config.instructions,
      scrollbackPath: path.join(this.baseDir, 'sessions', id, 'scrollback.log'),
      spriteId: options.spriteId ?? null,
      isTest: options.isTest || false,
    }

    if (options.persona) {
      session.envVars['OVERSEER_SPRITE_PERSONA'] = options.persona
    }
    if (options.spriteName) {
      (session as any).spriteName = options.spriteName
    }

    this.registry.add(session)
    this.spawnPty(session)
    return session
  }

  private ensureSessionEnvironment(session: Session): Record<string, string> {
    const sessionDir = path.join(this.baseDir, 'sessions', session.id)
    const binDir = path.join(sessionDir, 'bin')
    
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true })
    }

    // Always update context.json with current session state
    const contextPath = path.join(sessionDir, 'context.json')
    
    // Try to get existing context to preserve spriteName if not in session object
    let spriteName = (session as any).spriteName || ''
    if (!spriteName && fs.existsSync(contextPath)) {
      try {
        const oldCtx = JSON.parse(fs.readFileSync(contextPath, 'utf8'))
        spriteName = oldCtx.spriteName || ''
      } catch (e) {}
    }

    fs.writeFileSync(contextPath, JSON.stringify({ 
      persona: session.envVars['OVERSEER_SPRITE_PERSONA'] || '', 
      instructions: session.instructions || '',
      spriteId: session.spriteId,
      spriteName
    }, null, 2))

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
        zshrcContent += `source "${originalZshrc}"\n`
      }
      // Re-apply our PATH at the very end of zsh initialization
      zshrcContent += `export PATH="${binDir}:$PATH"\n`
      fs.writeFileSync(zshrcPath, zshrcContent)
    }
    
    return env as Record<string, string>
  }

  updateSprite(sessionId: string, spriteId: string, name: string, persona: string): void {
    const sessionDir = path.join(this.baseDir, 'sessions', sessionId)
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true })
    }

    const session = this.registry.list().find(s => s.id === sessionId)
    const instructions = session?.instructions || ''

    fs.writeFileSync(
      path.join(sessionDir, 'context.json'),
      JSON.stringify({ persona, instructions, spriteId, spriteName: name }, null, 2)
    )

    // Also update the session in registry so it persists
    this.registry.update(sessionId, { spriteId, envVars: { ...this.registry.list().find(s => s.id === sessionId)?.envVars, OVERSEER_SPRITE_PERSONA: persona } })
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
      // Refresh instructions from config on restore
      const config = readAgentConfig(session.agentType, this.baseDir)
      if (config.instructions && !session.instructions) {
        session.instructions = config.instructions
        this.registry.update(session.id, { instructions: session.instructions })
      }

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


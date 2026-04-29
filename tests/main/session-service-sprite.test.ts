import { SessionService } from '../../src/main/session-service'
import { PtyManager } from '../../src/main/session-service/pty-manager'
import fs from 'fs'
import path from 'path'
import os from 'os'

jest.mock('../../src/main/session-service/pty-manager')

describe('SessionService Sprite Injection', () => {
  let service: SessionService
  const sessionBaseDir = path.join(os.homedir(), '.overseer', 'sessions')

  beforeEach(() => {
    service = new SessionService()
  })

  it('creates session directory and context.json', () => {
    const session = service.create({
      name: 'Test Session',
      agentType: 'claude',
      spriteId: 'test-sprite',
      persona: 'Test Persona'
    })
    const sessionDir = path.join(sessionBaseDir, session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)
    expect(fs.existsSync(path.join(sessionDir, 'context.json'))).toBe(true)
    const context = JSON.parse(fs.readFileSync(path.join(sessionDir, 'context.json'), 'utf8'))
    expect(context.persona).toBe('Test Persona')
  })

  it('creates wrapper scripts with correct permissions', () => {
    const session = service.create({ name: 'Test', agentType: 'shell' })
    const binDir = path.join(os.homedir(), '.overseer', 'sessions', session.id, 'bin')
    expect(fs.existsSync(path.join(binDir, 'claude'))).toBe(true)
    const stats = fs.statSync(path.join(binDir, 'claude'))
    expect(stats.mode & 0o111).toBeTruthy() // executable
  })

  it('sets OVERSEER_SESSION_DIR and updates PATH', () => {
    const session = service.create({ name: 'Test', agentType: 'claude' })
    expect(session.envVars['OVERSEER_SESSION_DIR']).toContain(session.id)
    expect(session.envVars['PATH']).toContain(session.id)
    expect(session.envVars['PATH']).toContain('/bin:')
  })
})

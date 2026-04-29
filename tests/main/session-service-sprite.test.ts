import { SessionService } from '../../src/main/session-service'
import { PtyManager } from '../../src/main/session-service/pty-manager'
import fs from 'fs'
import path from 'path'
import os from 'os'

jest.mock('../../src/main/session-service/pty-manager')

const tmpBaseDir = path.join(os.tmpdir(), 'overseer-test-sprite-' + process.pid)

describe('SessionService Sprite Injection', () => {
  let service: SessionService
  const sessionBaseDir = path.join(tmpBaseDir, 'sessions')

  beforeEach(() => {
    fs.mkdirSync(tmpBaseDir, { recursive: true })
    service = new SessionService(tmpBaseDir)
    jest.clearAllMocks()
  })

  afterEach(() => {
    fs.rmSync(tmpBaseDir, { recursive: true, force: true })
  })

  it('creates session directory and context.json', () => {
    const session = service.create({
      name: 'Test Session',
      agentType: 'claude',
      spriteId: 'test-sprite',
      persona: 'Test Persona',
      isTest: true
    })
    const sessionDir = path.join(sessionBaseDir, session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)
    expect(fs.existsSync(path.join(sessionDir, 'context.json'))).toBe(true)
    const context = JSON.parse(fs.readFileSync(path.join(sessionDir, 'context.json'), 'utf8'))
    expect(context.persona).toBe('Test Persona')
  })

  it('creates wrapper scripts with correct permissions', () => {
    const session = service.create({ name: 'Test', agentType: 'shell', isTest: true })
    const binDir = path.join(sessionBaseDir, session.id, 'bin')
    expect(fs.existsSync(path.join(binDir, 'claude'))).toBe(true)
    const stats = fs.statSync(path.join(binDir, 'claude'))
    expect(stats.mode & 0o111).toBeTruthy() // executable
  })

  it('sets OVERSEER_SESSION_DIR and updates PATH in spawned environment', () => {
    const spawnSpy = jest.spyOn(PtyManager.prototype, 'spawn')
    const session = service.create({ name: 'Test', agentType: 'claude', isTest: true })
    
    expect(spawnSpy).toHaveBeenCalled()
    const env = spawnSpy.mock.calls[0][1]
    expect(env['OVERSEER_SESSION_DIR']).toContain(session.id)
    expect(env['PATH']).toContain(session.id)
    expect(env['PATH']).toContain('/bin:')
  })

  it('updates context.json live', () => {
    const session = service.create({ name: 'Test', agentType: 'claude', persona: 'Old', isTest: true })
    service.updateSprite(session.id, 'sprite-1', 'New Persona')
    const context = JSON.parse(fs.readFileSync(path.join(sessionBaseDir, session.id, 'context.json'), 'utf8'))
    expect(context.persona).toBe('New Persona')
  })
})

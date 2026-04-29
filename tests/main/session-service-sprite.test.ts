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
})

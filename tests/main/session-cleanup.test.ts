import { SessionService } from '../../src/main/session-service'
import { PtyManager } from '../../src/main/session-service/pty-manager'
import fs from 'fs'
import path from 'path'
import os from 'os'

jest.mock('../../src/main/session-service/pty-manager')

const tmpDir = path.join(os.tmpdir(), 'overseer-cleanup-test-' + process.pid)

describe('Session Cleanup', () => {
  beforeEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
    fs.mkdirSync(tmpDir, { recursive: true })
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('deletes directory on kill', () => {
    const service = new SessionService(tmpDir)
    const session = service.create({ name: 'Test', agentType: 'shell' })
    const sessionDir = path.join(tmpDir, 'sessions', session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)
    
    service.kill(session.id)
    expect(fs.existsSync(sessionDir)).toBe(false)
    expect(PtyManager.prototype.kill).toHaveBeenCalledWith(session.id)
  })

  it('purges isTest sessions on startup', () => {
    const service1 = new SessionService(tmpDir)
    const session = service1.create({ name: 'Test', agentType: 'shell', isTest: true })
    const sessionDir = path.join(tmpDir, 'sessions', session.id)
    expect(fs.existsSync(sessionDir)).toBe(true)

    // Re-init service
    const service2 = new SessionService(tmpDir)
    expect(fs.existsSync(sessionDir)).toBe(false)
    expect(service2.list()).toHaveLength(0)
  })

  it('sweeps orphaned directories on startup', () => {
    const sessionsDir = path.join(tmpDir, 'sessions')
    fs.mkdirSync(sessionsDir, { recursive: true })
    
    const orphanId = '11111111-2222-3333-4444-555555555555'
    const orphanDir = path.join(sessionsDir, orphanId)
    fs.mkdirSync(orphanDir)
    expect(fs.existsSync(orphanDir)).toBe(true)

    // Also create some non-UUID directory that should NOT be deleted
    const nonUuidDir = path.join(sessionsDir, 'some-config')
    fs.mkdirSync(nonUuidDir)
    expect(fs.existsSync(nonUuidDir)).toBe(true)

    const service = new SessionService(tmpDir)
    expect(fs.existsSync(orphanDir)).toBe(false)
    expect(fs.existsSync(nonUuidDir)).toBe(true)
  })
})

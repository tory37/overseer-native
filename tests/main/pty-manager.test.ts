import { PtyManager } from '../../src/main/session-service/pty-manager'
import type { Session } from '../../src/renderer/types/ipc'
import os from 'os'
import path from 'path'
import fs from 'fs'

const tmpDir = path.join(os.tmpdir(), 'overseer-test-pty-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

function makeSession(id: string): Session {
  return {
    id,
    name: 'test',
    agentType: 'shell',
    cwd: os.tmpdir(),
    envVars: {},
    scrollbackPath: path.join(tmpDir, `${id}.log`),
    spriteId: null,
  }
}

test('spawns a PTY and receives stdout', (done) => {
  const mgr = new PtyManager()
  const session = makeSession('pty-test-1')
  const received: string[] = []

  mgr.spawn(session, process.env as Record<string, string>, (data) => {
    received.push(data)
    if (received.join('').includes('hello-overseer')) {
      mgr.kill(session.id)
      done()
    }
  })

  setTimeout(() => mgr.write(session.id, 'echo hello-overseer\r'), 100)
}, 5000)

test('kill removes the PTY from the manager', (done) => {
  const mgr = new PtyManager()
  const session = makeSession('pty-test-2')
  mgr.spawn(session, process.env as Record<string, string>, () => {})
  setTimeout(() => {
    mgr.kill(session.id)
    expect(mgr.has(session.id)).toBe(false)
    done()
  }, 200)
}, 5000)

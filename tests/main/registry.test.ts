import fs from 'fs'
import os from 'os'
import path from 'path'
import { SessionRegistry } from '../../src/main/session-service/registry'
import type { Session } from '../../src/renderer/types/ipc'

const tmpDir = path.join(os.tmpdir(), 'overseer-test-registry-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    name: 'test',
    agentType: 'shell',
    cwd: '/tmp',
    envVars: {},
    scrollbackPath: '/tmp/test-id.log',
    ...overrides,
  }
}

test('loads empty registry when file does not exist', () => {
  const reg = new SessionRegistry(tmpDir)
  expect(reg.list()).toEqual([])
})

test('adds and persists a session', () => {
  const reg = new SessionRegistry(tmpDir)
  const session = makeSession()
  reg.add(session)
  expect(reg.list()).toHaveLength(1)
  expect(reg.list()[0].id).toBe('test-id')

  const reg2 = new SessionRegistry(tmpDir)
  expect(reg2.list()).toHaveLength(1)
})

test('removes a session by id', () => {
  const reg = new SessionRegistry(tmpDir)
  reg.add(makeSession({ id: 'a' }))
  reg.add(makeSession({ id: 'b' }))
  reg.remove('a')
  expect(reg.list().map(s => s.id)).toEqual(['b'])

  const reg2 = new SessionRegistry(tmpDir)
  expect(reg2.list().map(s => s.id)).toEqual(['b'])
})

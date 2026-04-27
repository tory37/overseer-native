import fs from 'fs'
import os from 'os'
import path from 'path'
import { ScrollbackManager } from '../../src/main/session-service/scrollback'

const tmpDir = path.join(os.tmpdir(), 'overseer-test-scrollback-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

test('appends data to log file', () => {
  const logPath = path.join(tmpDir, 'test.log')
  const mgr = new ScrollbackManager(logPath)
  mgr.append(Buffer.from('hello '))
  mgr.append(Buffer.from('world'))
  const contents = fs.readFileSync(logPath)
  expect(contents.toString()).toBe('hello world')
})

test('read returns full contents as Buffer', () => {
  const logPath = path.join(tmpDir, 'test.log')
  fs.writeFileSync(logPath, 'saved output')
  const mgr = new ScrollbackManager(logPath)
  const buf = mgr.read()
  expect(buf?.toString()).toBe('saved output')
})

test('read returns null when log file does not exist', () => {
  const logPath = path.join(tmpDir, 'nonexistent.log')
  const mgr = new ScrollbackManager(logPath)
  expect(mgr.read()).toBeNull()
})

test('append is a no-op (logs warning) when write fails', () => {
  const logPath = path.join(tmpDir, 'test.log')
  const mgr = new ScrollbackManager(logPath)
  fs.chmodSync(tmpDir, 0o555)
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  expect(() => mgr.append(Buffer.from('data'))).not.toThrow()
  warnSpy.mockRestore()
  fs.chmodSync(tmpDir, 0o755)
})

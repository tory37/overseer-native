import os from 'os'
import path from 'path'
import fs from 'fs'
import { isDirectory } from '../../src/main/ipc-handlers'

const tmpDir = path.join(os.tmpdir(), 'overseer-ipchelpers-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

test('returns true for an existing directory', async () => {
  expect(await isDirectory(tmpDir)).toBe(true)
})

test('returns false for a nonexistent path', async () => {
  expect(await isDirectory(path.join(tmpDir, 'nope'))).toBe(false)
})

test('returns false for a file', async () => {
  const file = path.join(tmpDir, 'file.txt')
  fs.writeFileSync(file, 'x')
  expect(await isDirectory(file)).toBe(false)
})

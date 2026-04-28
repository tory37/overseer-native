import os from 'os'
import path from 'path'
import fs from 'fs'
import { isDirectory, readKeybindingsFromDisk, writeKeybindingsToDisk } from '../../src/main/ipc-handlers'
import { DEFAULT_KEYBINDINGS } from '../../src/renderer/types/ipc'
import type { Keybindings } from '../../src/renderer/types/ipc'

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

describe('readKeybindingsFromDisk', () => {
  test('returns null when file does not exist', async () => {
    expect(await readKeybindingsFromDisk(tmpDir)).toBeNull()
  })

  test('returns parsed keybindings when file exists', async () => {
    const overseerDir = path.join(tmpDir, '.overseer')
    fs.mkdirSync(overseerDir, { recursive: true })
    fs.writeFileSync(path.join(overseerDir, 'keybindings.json'), JSON.stringify(DEFAULT_KEYBINDINGS))
    const result = await readKeybindingsFromDisk(tmpDir)
    expect(result).toEqual(DEFAULT_KEYBINDINGS)
  })
})

describe('writeKeybindingsToDisk', () => {
  test('creates the directory and writes JSON', async () => {
    await writeKeybindingsToDisk(DEFAULT_KEYBINDINGS, tmpDir)
    const written = fs.readFileSync(path.join(tmpDir, '.overseer', 'keybindings.json'), 'utf8')
    expect(JSON.parse(written)).toEqual(DEFAULT_KEYBINDINGS)
  })

  test('overwrites an existing file', async () => {
    const overseerDir = path.join(tmpDir, '.overseer')
    fs.mkdirSync(overseerDir, { recursive: true })
    fs.writeFileSync(path.join(overseerDir, 'keybindings.json'), '{}')
    const custom: Keybindings = { ...DEFAULT_KEYBINDINGS, newSession: { code: 'KeyT', ctrl: true, shift: true, alt: false } }
    await writeKeybindingsToDisk(custom, tmpDir)
    const written = JSON.parse(fs.readFileSync(path.join(overseerDir, 'keybindings.json'), 'utf8'))
    expect(written.newSession.code).toBe('KeyT')
  })
})

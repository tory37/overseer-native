import fs from 'fs'
import os from 'os'
import path from 'path'
import { SyncService } from '../../src/main/services/sync-service'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overseer-sync-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeService(overrides: {
  stateFile?: string
  aiSync?: string
  rulesDir?: string
  skillsDir?: string
} = {}) {
  return new SyncService({
    stateFile: overrides.stateFile ?? path.join(tmpDir, 'sync-state.json'),
    aiSync: overrides.aiSync ?? path.join(tmpDir, 'no-such-script'),
    rulesDir: overrides.rulesDir ?? path.join(tmpDir, 'rules'),
    skillsDir: overrides.skillsDir ?? path.join(tmpDir, 'skills'),
  })
}

test('getDriftStatus returns null lastSyncedAt and empty arrays when nothing exists', () => {
  const svc = makeService()
  const status = svc.getDriftStatus()
  expect(status.lastSyncedAt).toBeNull()
  expect(status.rules).toEqual([])
  expect(status.skills).toEqual([])
})

test('getDriftStatus lists all .md files as drifted when never synced', () => {
  const rulesDir = path.join(tmpDir, 'rules')
  const skillsDir = path.join(tmpDir, 'skills')
  fs.mkdirSync(rulesDir)
  fs.mkdirSync(skillsDir)
  fs.writeFileSync(path.join(rulesDir, 'global.md'), '# global')
  fs.writeFileSync(path.join(rulesDir, 'not-md.txt'), 'ignored')
  fs.writeFileSync(path.join(skillsDir, 'brainstorming.md'), '# brainstorming')
  const svc = makeService({ rulesDir, skillsDir })
  const status = svc.getDriftStatus()
  expect(status.rules).toEqual(['global.md'])
  expect(status.skills).toEqual(['brainstorming.md'])
})

test('getDriftStatus returns empty lists when files predate lastSyncedAt', () => {
  const rulesDir = path.join(tmpDir, 'rules')
  fs.mkdirSync(rulesDir)
  fs.writeFileSync(path.join(rulesDir, 'global.md'), '# global')
  const stateFile = path.join(tmpDir, 'sync-state.json')
  fs.writeFileSync(stateFile, JSON.stringify({ lastSyncedAt: new Date(Date.now() + 60_000).toISOString() }))
  const svc = new SyncService({
    stateFile,
    rulesDir,
    skillsDir: path.join(tmpDir, 'skills'),
    aiSync: path.join(tmpDir, 'no-such-script'),
  })
  const status = svc.getDriftStatus()
  expect(status.rules).toEqual([])
})

test('getDriftStatus returns null lastSyncedAt for malformed state file', () => {
  const stateFile = path.join(tmpDir, 'sync-state.json')
  fs.writeFileSync(stateFile, 'not json')
  const svc = makeService({ stateFile })
  expect(svc.getDriftStatus().lastSyncedAt).toBeNull()
})

test('runSync returns ok:false when ai-sync not found', async () => {
  const svc = makeService({ aiSync: path.join(tmpDir, 'no-such-script') })
  const result = await svc.runSync()
  expect(result.ok).toBe(false)
  expect(result.output).toMatch(/not found/)
})

test('runSync returns ok:true and writes state file when script exits 0', async () => {
  const scriptPath = path.join(tmpDir, 'ai-sync')
  fs.writeFileSync(scriptPath, '#!/bin/sh\necho synced')
  fs.chmodSync(scriptPath, 0o755)
  const stateFile = path.join(tmpDir, 'sync-state.json')
  const svc = new SyncService({
    aiSync: scriptPath,
    stateFile,
    rulesDir: path.join(tmpDir, 'rules'),
    skillsDir: path.join(tmpDir, 'skills'),
  })
  const result = await svc.runSync()
  expect(result.ok).toBe(true)
  expect(result.output).toContain('synced')
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
  expect(typeof state.lastSyncedAt).toBe('string')
})

test('runSync returns ok:false and does not update state file when script exits non-zero', async () => {
  const scriptPath = path.join(tmpDir, 'ai-sync')
  fs.writeFileSync(scriptPath, '#!/bin/sh\necho failed >&2\nexit 1')
  fs.chmodSync(scriptPath, 0o755)
  const stateFile = path.join(tmpDir, 'sync-state.json')
  const svc = new SyncService({
    aiSync: scriptPath,
    stateFile,
    rulesDir: path.join(tmpDir, 'rules'),
    skillsDir: path.join(tmpDir, 'skills'),
  })
  const result = await svc.runSync()
  expect(result.ok).toBe(false)
  expect(fs.existsSync(stateFile)).toBe(false)
})

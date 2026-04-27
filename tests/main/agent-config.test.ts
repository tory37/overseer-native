import fs from 'fs'
import os from 'os'
import path from 'path'
import { readAgentEnvVars } from '../../src/main/session-service/agent-config'

const tmpDir = path.join(os.tmpdir(), 'overseer-test-agents-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

test('returns env vars from agent config file', () => {
  fs.writeFileSync(
    path.join(tmpDir, 'claude.json'),
    JSON.stringify({ env: { ANTHROPIC_API_KEY: 'test-key', CLAUDE_CONFIG_DIR: '/tmp/claude' } })
  )
  const result = readAgentEnvVars('claude', tmpDir)
  expect(result).toEqual({ ANTHROPIC_API_KEY: 'test-key', CLAUDE_CONFIG_DIR: '/tmp/claude' })
})

test('returns empty object when config file does not exist', () => {
  const result = readAgentEnvVars('shell', tmpDir)
  expect(result).toEqual({})
})

test('returns empty object when env key is missing from config', () => {
  fs.writeFileSync(path.join(tmpDir, 'gemini.json'), JSON.stringify({ someOtherKey: 'value' }))
  const result = readAgentEnvVars('gemini', tmpDir)
  expect(result).toEqual({})
})

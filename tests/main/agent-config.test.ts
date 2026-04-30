import fs from 'fs'
import os from 'os'
import path from 'path'
import { readAgentConfig } from '../../src/main/session-service/agent-config'

const tmpDir = path.join(os.tmpdir(), 'overseer-test-agents-' + process.pid)

beforeEach(() => fs.mkdirSync(tmpDir, { recursive: true }))
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

test('returns env vars and instructions from agent config file', () => {
  const agentsDir = path.join(tmpDir, 'agents')
  fs.mkdirSync(agentsDir, { recursive: true })
  fs.writeFileSync(
    path.join(agentsDir, 'claude.json'),
    JSON.stringify({ 
      env: { ANTHROPIC_API_KEY: 'test-key' },
      instructions: 'test instructions'
    })
  )
  const result = readAgentConfig('claude', tmpDir)
  expect(result.env).toEqual({ ANTHROPIC_API_KEY: 'test-key' })
  expect(result.instructions).toContain('You are an AI assistant running inside Overseer')
  expect(result.instructions).toContain('test instructions')
})

test('merges instructions from JSON and global Markdown file', () => {
  const agentsDir = path.join(tmpDir, 'agents')
  fs.mkdirSync(agentsDir, { recursive: true })
  fs.writeFileSync(
    path.join(agentsDir, 'gemini.json'),
    JSON.stringify({ instructions: 'Local JSON' })
  )
  fs.writeFileSync(
    path.join(tmpDir, 'GEMINI.md'),
    'Global Markdown'
  )
  const result = readAgentConfig('gemini', tmpDir)
  expect(result.instructions).toContain('You are an AI assistant running inside Overseer')
  expect(result.instructions).toContain('Local JSON')
  expect(result.instructions).toContain('Global Markdown')
})

test('loads only global Markdown and core when JSON is missing', () => {
  fs.writeFileSync(
    path.join(tmpDir, 'SHELL.md'),
    'Global Shell Rules'
  )
  const result = readAgentConfig('shell', tmpDir)
  expect(result.instructions).toContain('You are an AI assistant running inside Overseer')
  expect(result.instructions).toContain('Global Shell Rules')
})

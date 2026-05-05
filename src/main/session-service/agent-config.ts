import fs from 'fs'
import path from 'path'

export interface AgentConfig {
  env: Record<string, string>
  instructions?: string
}

// SPRITE SYSTEM SUPPRESSED
// CORE_SCAFFOLDING was removed along with the Overseer context-injection system.
// Hardcoded Overseer/Sprite persona strings were too fragile and cost more than
// they provided. User-defined instructions from ~/.overseer are still respected.
// See feat/sprite-suppression.

export function readAgentConfig(
  agentType: string,
  baseDir: string = `${process.env.HOME}/.overseer`
): AgentConfig {
  const agentsDir = path.join(baseDir, 'agents')
  const configPath = path.join(agentsDir, `${agentType}.json`)
  const mdPath = path.join(baseDir, `${agentType.toUpperCase()}.md`)

  let env: Record<string, string> = {}
  let instructions = ''

  // 1. Load from JSON config
  if (fs.existsSync(configPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      env = (raw.env && typeof raw.env === 'object') ? raw.env : {}
      if (typeof raw.instructions === 'string' && raw.instructions.trim()) {
        instructions = raw.instructions
      }
    } catch {
      // ignore parse errors
    }
  }

  // 2. Load from global Markdown file (scaffolding)
  if (fs.existsSync(mdPath)) {
    try {
      const mdContent = fs.readFileSync(mdPath, 'utf8')
      if (mdContent.trim()) {
        instructions = instructions ? `${instructions}\n\n${mdContent}` : mdContent
      }
    } catch {
      // ignore read errors
    }
  }

  return { env, instructions }
}

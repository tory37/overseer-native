import fs from 'fs'
import path from 'path'

export interface AgentConfig {
  env: Record<string, string>
  instructions?: string
}

const CORE_SCAFFOLDING = `You are an AI assistant running inside Overseer, a terminal management application. 
Overseer provides a multi-tab terminal environment with a native PTY shell, an integrated Git tool panel in the sidebar, and a character companion (Sprite) that visually represents your persona.`.trim()

export function readAgentConfig(
  agentType: string,
  baseDir: string = `${process.env.HOME}/.overseer`
): AgentConfig {
  const agentsDir = path.join(baseDir, 'agents')
  const configPath = path.join(agentsDir, `${agentType}.json`)
  const mdPath = path.join(baseDir, `${agentType.toUpperCase()}.md`)

  let env: Record<string, string> = {}
  let instructions = CORE_SCAFFOLDING

  // 1. Load from JSON config
  if (fs.existsSync(configPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      env = (raw.env && typeof raw.env === 'object') ? raw.env : {}
      if (typeof raw.instructions === 'string' && raw.instructions.trim()) {
        instructions = `${instructions}\n\n${raw.instructions}`
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
        instructions = `${instructions}\n\n${mdContent}`
      }
    } catch {
      // ignore read errors
    }
  }

  return { env, instructions }
}

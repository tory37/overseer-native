import fs from 'fs'
import path from 'path'

export function readAgentEnvVars(
  agentType: string,
  agentsDir: string = `${process.env.HOME}/.overseer/agents`
): Record<string, string> {
  const configPath = path.join(agentsDir, `${agentType}.json`)
  if (!fs.existsSync(configPath)) return {}
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return (raw.env && typeof raw.env === 'object') ? raw.env : {}
  } catch {
    return {}
  }
}

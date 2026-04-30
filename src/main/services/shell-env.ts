import { execSync } from 'child_process'

/**
 * Loads the user's shell environment (PATH, etc.) into the current process.
 * This is crucial in production where the app might be launched without 
 * the shell's login environment.
 */
export function loadShellEnv() {
  if (process.platform === 'win32') return

  try {
    const shell = process.env.SHELL || '/bin/bash'
    // Run a login shell and print the environment
    const rawEnv = execSync(`${shell} -l -c 'env'`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    })

    const lines = rawEnv.split('\n')
    for (const line of lines) {
      const parts = line.split('=')
      if (parts.length >= 2) {
        const key = parts[0]
        const value = parts.slice(1).join('=')
        
        // Only update key variables that are often missing or wrong in Electron prod
        if (['PATH', 'NODE_PATH', 'NVM_DIR', 'NVM_BIN', 'NVM_INC'].includes(key)) {
          process.env[key] = value
        }
      }
    }
  } catch (error) {
    console.error('Failed to load shell environment:', error)
  }
}

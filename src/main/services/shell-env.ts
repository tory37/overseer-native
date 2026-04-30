import { execSync } from 'child_process'
import os from 'os'

const BLACKLIST = [
  'NODE_ENV',
  'ELECTRON_RUN_AS_NODE',
  'ELECTRON_NO_ASAR',
  'ELECTRON_ENABLE_LOGGING',
  'ELECTRON_ENABLE_STACK_DUMPING',
  'OVERSEER_VERSION',
  'OVERSEER_IS_DEV'
]

/**
 * Loads the user's shell environment (PATH, etc.) into the current process.
 * This is crucial in production where the app might be launched without 
 * the shell's login environment.
 */
export function loadShellEnv() {
  if (process.platform === 'win32') return

  try {
    let shell: string | undefined = process.env.SHELL
    if (!shell) {
      try {
        shell = os.userInfo().shell || undefined
      } catch {
        shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash'
      }
    }

    // Run a login shell and print the environment
    const rawEnv = execSync(`${shell} -l -c 'env'`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    })

    const lines = rawEnv.split('\n')
    for (const line of lines) {
      const index = line.indexOf('=')
      if (index > 0) {
        const key = line.slice(0, index)
        const value = line.slice(index + 1)
        
        if (!BLACKLIST.includes(key)) {
          process.env[key] = value
        }
      }
    }
  } catch (error) {
    console.error('Failed to load shell environment:', error)
  }
}

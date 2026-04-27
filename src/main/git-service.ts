import { exec } from 'child_process'
import type { GitCommandResult } from '../renderer/types/ipc'

export function runGitCommand(command: string, cwd: string): Promise<GitCommandResult> {
  return new Promise((resolve) => {
    exec(`git ${command}`, { cwd }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: error?.code ?? 0,
      })
    })
  })
}

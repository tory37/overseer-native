import { runGitCommand } from '../../src/main/git-service'
import path from 'path'

const repoDir = path.resolve(__dirname, '../..')

test('git status exits 0 in a valid git repo', async () => {
  const result = await runGitCommand('status', repoDir)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('On branch')
})

test('git status fails with non-zero exit in a non-git directory', async () => {
  const result = await runGitCommand('status', '/tmp')
  expect(result.exitCode).not.toBe(0)
  expect(result.stderr).toBeTruthy()
})

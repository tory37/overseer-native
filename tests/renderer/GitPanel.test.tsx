import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GitPanel } from '../../src/renderer/components/GitPanel'
import type { GitCommandResult } from '../../src/renderer/types/ipc'

const mockResult: GitCommandResult = { stdout: 'On branch main', stderr: '', exitCode: 0 }

beforeEach(() => {
  Object.defineProperty(window, 'overseer', {
    value: {
      gitStatus: jest.fn().mockResolvedValue(mockResult),
      gitCommit: jest.fn().mockResolvedValue({ stdout: '[main abc1234] test', stderr: '', exitCode: 0 }),
      gitPush: jest.fn().mockResolvedValue(mockResult),
      gitPull: jest.fn().mockResolvedValue(mockResult),
    },
    writable: true,
    configurable: true,
  })
})

test('runs git status and shows output when Status button clicked', async () => {
  render(<GitPanel cwd="/tmp/project" />)
  fireEvent.click(screen.getByText('Status'))
  await waitFor(() => expect(screen.getByText('On branch main')).toBeInTheDocument())
})

test('prompts for commit message before running git commit', async () => {
  const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('my commit message')
  render(<GitPanel cwd="/tmp/project" />)
  fireEvent.click(screen.getByText('Commit'))
  expect(promptSpy).toHaveBeenCalled()
  await waitFor(() => expect((window.overseer.gitCommit as jest.Mock)).toHaveBeenCalledWith('/tmp/project', 'my commit message'))
  promptSpy.mockRestore()
})

test('does not commit when prompt is cancelled', async () => {
  jest.spyOn(window, 'prompt').mockReturnValue(null)
  render(<GitPanel cwd="/tmp/project" />)
  fireEvent.click(screen.getByText('Commit'))
  expect(window.overseer.gitCommit).not.toHaveBeenCalled()
})

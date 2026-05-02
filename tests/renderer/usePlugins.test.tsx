import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePlugins } from '../../src/renderer/hooks/usePlugins'
import type { PluginTool } from '../../src/renderer/types/ipc'

const mockTool: PluginTool = {
  id: 'git',
  name: 'Git',
  icon: 'git-branch',
  entry: '/fake/path/git.js',
  pluginName: 'Git Plugin',
}

const TestComponent = () => {
  const { tools, loading } = usePlugins()
  if (loading) return <div>loading</div>
  return (
    <ul>
      {tools.map(t => (
        <li key={t.id}>{t.name}: {t.component ? 'loaded' : 'failed'}</li>
      ))}
    </ul>
  )
}

beforeEach(() => {
  Object.defineProperty(window, 'overseer', {
    value: { getPlugins: jest.fn().mockResolvedValue([mockTool]) },
    writable: true,
    configurable: true,
  })
})

test('starts in loading state', () => {
  render(<TestComponent />)
  expect(screen.getByText('loading')).toBeInTheDocument()
})

test('calls getPlugins on mount', async () => {
  render(<TestComponent />)
  await waitFor(() => expect(window.overseer.getPlugins).toHaveBeenCalledTimes(1))
})

test('resolves to empty list when getPlugins returns empty array', async () => {
  ;(window.overseer.getPlugins as jest.Mock).mockResolvedValue([])
  render(<TestComponent />)
  await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('marks tool as failed when dynamic import throws', async () => {
  // The entry path does not exist — import() will reject
  render(<TestComponent />)
  await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  expect(screen.getByText('Git: failed')).toBeInTheDocument()
})

test('does not update state after unmount (no setState after cancel)', async () => {
  const { unmount } = render(<TestComponent />)
  unmount()
  // No thrown "can't perform state update on unmounted component" — just verify no crash
  await new Promise(r => setTimeout(r, 50))
})

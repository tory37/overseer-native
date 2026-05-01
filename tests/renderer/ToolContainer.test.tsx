import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToolContainer } from '../../src/renderer/components/ToolContainer'
import type { ToolContext, LoadedTool } from '../../src/renderer/hooks/usePlugins'

// Mock usePlugins so tests control what tools are available
jest.mock('../../src/renderer/hooks/usePlugins', () => ({
  ...jest.requireActual('../../src/renderer/hooks/usePlugins'),
  usePlugins: jest.fn(),
}))
import { usePlugins } from '../../src/renderer/hooks/usePlugins'

const mockContext: ToolContext = { version: 1, cwd: '/test/project', sessionId: 'sess-1' }

const makeTool = (id: string, name: string): LoadedTool => ({
  id,
  name,
  icon: 'x',
  entry: `/fake/${id}.js`,
  pluginName: 'Test Plugin',
  component: ({ context }: { context: ToolContext }) => <div>{name} content — {context.cwd}</div>,
  loadError: null,
})

const makeFailedTool = (id: string, name: string): LoadedTool => ({
  id,
  name,
  icon: 'x',
  entry: `/fake/${id}.js`,
  pluginName: 'Test Plugin',
  component: null,
  loadError: 'Module not found',
})

test('shows loading state while plugins are loading', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({ tools: [], loading: true })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('Loading tools...')).toBeInTheDocument()
})

test('shows empty state when no plugins found', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({ tools: [], loading: false })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/No tools found/)).toBeInTheDocument()
})

test('renders a tab button for each tool', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('Git')).toBeInTheDocument()
  expect(screen.getByText('Notes')).toBeInTheDocument()
})

test('renders first tool content by default', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/Git content/)).toBeInTheDocument()
  expect(screen.queryByText(/Notes content/)).not.toBeInTheDocument()
})

test('switches active tool when tab clicked', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git'), makeTool('notes', 'Notes')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  fireEvent.click(screen.getByText('Notes'))
  expect(screen.getByText(/Notes content/)).toBeInTheDocument()
  expect(screen.queryByText(/Git content/)).not.toBeInTheDocument()
})

test('passes context to the active tool component', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeTool('git', 'Git')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText(/\/test\/project/)).toBeInTheDocument()
})

test('shows inline error card for tools that failed to import', () => {
  ;(usePlugins as jest.Mock).mockReturnValue({
    tools: [makeFailedTool('bad', 'BadTool')],
    loading: false,
  })
  render(<ToolContainer context={mockContext} />)
  expect(screen.getByText('BadTool failed to load')).toBeInTheDocument()
  expect(screen.getByText('Module not found')).toBeInTheDocument()
})

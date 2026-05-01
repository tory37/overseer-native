import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToolErrorBoundary } from '../../src/renderer/components/ToolErrorBoundary'

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Tool render failed')
  return <div>Tool loaded fine</div>
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('renders children when no error occurs', () => {
  render(
    <ToolErrorBoundary toolName="Git">
      <ThrowingComponent shouldThrow={false} />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('Tool loaded fine')).toBeInTheDocument()
})

test('renders error card with tool name and message when child throws', () => {
  render(
    <ToolErrorBoundary toolName="Git">
      <ThrowingComponent shouldThrow={true} />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('Git failed to load')).toBeInTheDocument()
  expect(screen.getByText('Tool render failed')).toBeInTheDocument()
})

test('renders error card without message when error has no message', () => {
  const BadComponent = () => { throw new Error() }
  render(
    <ToolErrorBoundary toolName="MyTool">
      <BadComponent />
    </ToolErrorBoundary>
  )
  expect(screen.getByText('MyTool failed to load')).toBeInTheDocument()
})

test('does not affect sibling components outside the boundary', () => {
  render(
    <div>
      <ToolErrorBoundary toolName="Bad">
        <ThrowingComponent shouldThrow={true} />
      </ToolErrorBoundary>
      <div>Sibling is fine</div>
    </div>
  )
  expect(screen.getByText('Bad failed to load')).toBeInTheDocument()
  expect(screen.getByText('Sibling is fine')).toBeInTheDocument()
})

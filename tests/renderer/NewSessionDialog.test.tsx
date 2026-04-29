import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NewSessionDialog } from '../../src/renderer/components/NewSessionDialog'

beforeEach(() => {
  jest.useFakeTimers()
  ;(window as any).overseer = {
    openDirectory: jest.fn().mockResolvedValue(null),
    isDirectory: jest.fn().mockResolvedValue(true),
  }
})

afterEach(() => {
  jest.useRealTimers()
})

test('auto focuses the session name input on mount', () => {
  render(<NewSessionDialog onCreate={() => {}} onCancel={() => {}} />)
  const input = screen.getByLabelText('Name')
  expect(input).toHaveFocus()
})

test('calls onCreate with form values on submit', async () => {
  const onCreate = jest.fn()
  render(<NewSessionDialog onCancel={() => {}} onCreate={onCreate} />)

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'my-session' } })
  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/home/user/project' } })
  fireEvent.change(screen.getByLabelText('Agent'), { target: { value: 'claude' } })

  await act(async () => { jest.advanceTimersByTime(400) })

  fireEvent.click(screen.getByText('Create'))

  expect(onCreate).toHaveBeenCalledWith({
    name: 'my-session',
    agentType: 'claude',
    cwd: '/home/user/project',
    spriteId: null,
    persona: undefined,
  })
})

test('calls onCancel when Cancel is clicked', () => {
  const onCancel = jest.fn()
  render(<NewSessionDialog onCancel={onCancel} onCreate={() => {}} />)
  fireEvent.click(screen.getByText('Cancel'))
  expect(onCancel).toHaveBeenCalled()
})

test('Browse button opens directory picker and sets cwd', async () => {
  ;(window as any).overseer.openDirectory = jest.fn().mockResolvedValue('/chosen/path')
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  await act(async () => {
    fireEvent.click(screen.getByText('Browse'))
  })

  expect((window as any).overseer.openDirectory).toHaveBeenCalled()
  expect(screen.getByLabelText('Working Directory')).toHaveValue('/chosen/path')
})

test('cancelled Browse does not change cwd', async () => {
  ;(window as any).overseer.openDirectory = jest.fn().mockResolvedValue(null)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  await act(async () => {
    fireEvent.click(screen.getByText('Browse'))
  })

  expect(screen.getByLabelText('Working Directory')).toHaveValue('')
})

test('shows error after debounce for invalid path', async () => {
  ;(window as any).overseer.isDirectory = jest.fn().mockResolvedValue(false)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/bad/path' } })

  await act(async () => { jest.advanceTimersByTime(400) })
  await act(async () => {})

  expect(screen.getByText('Directory not found')).toBeInTheDocument()
})

test('no error shown for valid path', async () => {
  ;(window as any).overseer.isDirectory = jest.fn().mockResolvedValue(true)
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)

  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/valid/path' } })

  await act(async () => { jest.advanceTimersByTime(400) })
  await act(async () => {})

  expect(screen.queryByText('Directory not found')).not.toBeInTheDocument()
})

test('no error and no IPC call when cwd is empty', () => {
  render(<NewSessionDialog onCancel={() => {}} onCreate={() => {}} />)
  expect(screen.queryByText('Directory not found')).not.toBeInTheDocument()
  expect((window as any).overseer.isDirectory).not.toHaveBeenCalled()
})

test('allows Create with empty cwd', () => {
  const onCreate = jest.fn()
  render(<NewSessionDialog onCancel={() => {}} onCreate={onCreate} />)

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'my-session' } })
  fireEvent.click(screen.getByText('Create'))

  expect(onCreate).toHaveBeenCalledWith({
    name: 'my-session',
    agentType: 'shell',
    cwd: '',
    spriteId: null,
    persona: undefined,
  })
})

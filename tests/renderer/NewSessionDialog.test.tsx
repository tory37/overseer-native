import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NewSessionDialog } from '../../src/renderer/components/NewSessionDialog'

test('calls onCreate with form values on submit', () => {
  const onCreate = jest.fn()
  render(<NewSessionDialog onCancel={() => {}} onCreate={onCreate} />)

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'my-session' } })
  fireEvent.change(screen.getByLabelText('Working Directory'), { target: { value: '/home/user/project' } })
  fireEvent.change(screen.getByLabelText('Agent'), { target: { value: 'claude' } })
  fireEvent.click(screen.getByText('Create'))

  expect(onCreate).toHaveBeenCalledWith({
    name: 'my-session',
    agentType: 'claude',
    cwd: '/home/user/project',
  })
})

test('calls onCancel when Cancel is clicked', () => {
  const onCancel = jest.fn()
  render(<NewSessionDialog onCancel={onCancel} onCreate={() => {}} />)
  fireEvent.click(screen.getByText('Cancel'))
  expect(onCancel).toHaveBeenCalled()
})

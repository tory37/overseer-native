import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TerminalPane } from '../../src/renderer/components/TerminalPane'

jest.mock('../../src/renderer/components/TerminalInstance', () => ({
  TerminalInstance: () => <div data-testid="terminal-instance" />
}))

jest.mock('../../src/renderer/components/CompanionTerminal', () => ({
  CompanionTerminal: () => <div data-testid="companion-terminal" />
}))

const mockProps: any = {
  sessions: [{ id: 's1', name: 'S1' }],
  activeSessionId: 's1',
  activeTheme: { colors: {} },
  keybindings: {},
  allCompanions: [{ sessionId: 's1', companionId: 'c1' }],
  allCompanionsB: [],
  splitOpen: true,
  threeWayOpen: false,
  splitDirection: 'horizontal',
  splitSwapped: false,
  secondarySwapped: false,
  splitFocused: 'main',
  outerSplitRatio: 0.5,
  innerSplitRatio: 0.5,
  onOuterRatio: jest.fn(),
  onInnerRatio: jest.fn(),
  onFocusPane: jest.fn(),
}

describe('TerminalPane Right Click Focus', () => {
  it('should call onFocusPane when main panel is left-clicked', () => {
    render(<TerminalPane {...mockProps} />)
    const mainPanel = screen.getByText('Main').parentElement!
    fireEvent.mouseDown(mainPanel)
    expect(mockProps.onFocusPane).toHaveBeenCalledWith('main')
  })

  it('should call onFocusPane when companion panel is left-clicked', () => {
    render(<TerminalPane {...mockProps} />)
    const companionPanel = screen.getByText('Companion A').parentElement!
    fireEvent.mouseDown(companionPanel)
    expect(mockProps.onFocusPane).toHaveBeenCalledWith('companionA')
  })

  it('should call onFocusPane when main panel is right-clicked', () => {
    mockProps.onFocusPane.mockClear()
    render(<TerminalPane {...mockProps} />)
    const mainPanel = screen.getByText('Main').parentElement!
    
    // Simulating right click sequence
    fireEvent.mouseDown(mainPanel, { button: 2 })
    fireEvent.contextMenu(mainPanel)
    
    expect(mockProps.onFocusPane).toHaveBeenCalledWith('main')
  })

  it('should call onFocusPane when companion panel is right-clicked', () => {
    mockProps.onFocusPane.mockClear()
    render(<TerminalPane {...mockProps} />)
    const companionPanel = screen.getByText('Companion A').parentElement!
    
    // Simulating right click sequence
    fireEvent.mouseDown(companionPanel, { button: 2 })
    fireEvent.contextMenu(companionPanel)
    
    expect(mockProps.onFocusPane).toHaveBeenCalledWith('companionA')
  })
})

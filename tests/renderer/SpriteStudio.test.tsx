import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpriteStudio } from '../../src/renderer/components/SpriteStudio'
import { useSpritesStore } from '../../src/renderer/store/sprites'
import '@testing-library/jest-dom'

// Mock the avatar creation to avoid issues in JSDOM
jest.mock('@dicebear/core', () => ({
  createAvatar: () => ({
    toString: () => '<svg>avatar</svg>'
  })
}))

jest.mock('@dicebear/collection', () => ({
  bottts: {}
}))

describe('SpriteStudio', () => {
  beforeEach(() => {
    useSpritesStore.setState({
      sprites: [
        { id: 'default-sprite', name: 'Overseer', style: 'bottts', seed: 'overseer', persona: '...' }
      ]
    })
  })

  test('renders list view by default', () => {
    render(<SpriteStudio onClose={() => {}} />)
    expect(screen.getByText('Sprite Library')).toBeInTheDocument()
    expect(screen.getByText('Overseer')).toBeInTheDocument()
  })

  test('can switch to create view', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
    expect(screen.getByText('New Sprite')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  test('can switch to edit view from list', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Edit Sprite')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Overseer')).toBeInTheDocument()
  })

  test('goes back to list from form', () => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('Sprite Library')).toBeInTheDocument()
  })
})

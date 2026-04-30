import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpriteStudio } from '../../src/renderer/components/SpriteStudio'
import { useSpritesStore } from '../../src/renderer/store/sprites'
import '@testing-library/jest-dom'

jest.mock('../../src/renderer/lib/render-avatar', () => ({
  renderAvatar: jest.fn(() => '<svg>avatar</svg>'),
}))

jest.mock('../../src/renderer/lib/dicebear-styles', () => ({
  CURATED_STYLES: [
    {
      id: 'bottts',
      label: 'Bottts',
      collection: {},
      options: [
        { type: 'enum',  key: 'eyes',      label: 'Eyes',  values: ['bulging', 'dizzy', 'eva'] },
        { type: 'color', key: 'baseColor', label: 'Color', values: ['ffb300', '1e88e5'] },
      ],
    },
    {
      id: 'pixel-art',
      label: 'Pixel Art',
      collection: {},
      options: [
        { type: 'enum', key: 'eyes', label: 'Eyes', values: ['variant01', 'variant02'] },
      ],
    },
  ],
}))

beforeEach(() => {
  useSpritesStore.setState({
    sprites: [
      { id: 'default-sprite', name: 'Overseer', style: 'bottts', seed: 'overseer', options: {}, persona: '...' },
    ],
    createSprite: jest.fn().mockReturnValue({ id: 'new-id', name: 'New', style: 'bottts', seed: 'x', options: {}, persona: '' }),
    updateSprite: jest.fn(),
    deleteSprite: jest.fn(),
    loadSprites: jest.fn(),
  })
})

describe('SpriteStudio — list view', () => {
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

describe('SpriteStudio — EDIT view character creator', () => {
  beforeEach(() => {
    render(<SpriteStudio onClose={() => {}} />)
    fireEvent.click(screen.getByText('+ Create New Sprite'))
  })

  test('shows style picker with Bottts by default', () => {
    expect(screen.getByText('Bottts')).toBeInTheDocument()
  })

  test('clicking right style arrow advances to Pixel Art', () => {
    // The style picker has two arrow buttons at the top of the creator
    const styleSection = screen.getByTestId('style-picker')
    const rightBtn = styleSection.querySelector('button:last-child')!
    fireEvent.click(rightBtn)
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
  })

  test('clicking left style arrow from first style wraps to last style', () => {
    const styleSection = screen.getByTestId('style-picker')
    const leftBtn = styleSection.querySelector('button:first-child')!
    fireEvent.click(leftBtn)
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
  })

  test('shows option labels for current style', () => {
    expect(screen.getByText('Eyes')).toBeInTheDocument()
    expect(screen.getByText('Color')).toBeInTheDocument()
  })

  test('enum option shows Random by default', () => {
    expect(screen.getAllByText('Random').length).toBeGreaterThan(0)
  })

  test('clicking right on enum option shows first value', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn)
    expect(screen.getByText('bulging')).toBeInTheDocument()
  })

  test('clicking left on enum option when at Random shows last value', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const leftBtn = eyesRow.querySelector('button:first-child')!
    fireEvent.click(leftBtn)
    expect(screen.getByText('eva')).toBeInTheDocument()
  })

  test('cycling from last enum value right returns to Random', () => {
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    // bulging → dizzy → eva → Random
    fireEvent.click(rightBtn) // bulging
    fireEvent.click(rightBtn) // dizzy
    fireEvent.click(rightBtn) // eva
    fireEvent.click(rightBtn) // Random
    expect(eyesRow.querySelector('[data-testid="option-value"]')?.textContent).toBe('Random')
  })

  test('changing style resets options (shows Random for all slots)', () => {
    // Select an eye value first
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn) // now shows 'bulging'
    expect(screen.getByText('bulging')).toBeInTheDocument()

    // Change style
    const styleSection = screen.getByTestId('style-picker')
    const styleRight = styleSection.querySelector('button:last-child')!
    fireEvent.click(styleRight)

    // Should show Pixel Art now and options reset
    expect(screen.getByText('Pixel Art')).toBeInTheDocument()
    expect(screen.queryByText('bulging')).not.toBeInTheDocument()
  })

  test('shows Randomize button', () => {
    expect(screen.getByText('🎲 Randomize')).toBeInTheDocument()
  })

  test('save calls store with style and options', () => {
    const { createSprite } = useSpritesStore.getState()
    const mockCreate = createSprite as jest.Mock

    // Select an eye value
    const eyesRow = screen.getByTestId('option-eyes')
    const rightBtn = eyesRow.querySelector('button:last-child')!
    fireEvent.click(rightBtn) // eyes = bulging

    // Fill in name
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Bot' } })
    fireEvent.click(screen.getByText('Save'))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Bot',
        style: 'bottts',
        options: { eyes: 'bulging' },
      })
    )
  })
})

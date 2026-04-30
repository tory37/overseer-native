import { renderAvatar } from '../../src/renderer/lib/render-avatar'
import { createAvatar } from '@dicebear/core'

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toString: () => '<svg>test-avatar</svg>' })),
}))

jest.mock('../../src/renderer/lib/dicebear-styles', () => ({
  CURATED_STYLES: [
    { id: 'bottts',    label: 'Bottts',    collection: { __id: 'bottts' },    options: [] },
    { id: 'pixel-art', label: 'Pixel Art', collection: { __id: 'pixelArt' }, options: [] },
  ],
}))

const mockCreateAvatar = createAvatar as jest.Mock

beforeEach(() => {
  mockCreateAvatar.mockClear()
})

test('returns SVG string', () => {
  const result = renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'abc', options: {}, persona: '' })
  expect(result).toBe('<svg>test-avatar</svg>')
})

test('passes seed and options to createAvatar, wrapping string values in arrays', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'myseed', options: { eyes: 'bulging' }, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.objectContaining({ seed: 'myseed', eyes: ['bulging'] })
  )
})

test('uses first style as fallback when style id is unknown', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'unknown-style', seed: 'x', options: {}, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.anything()
  )
})

test('wraps string options in arrays but passes array options (colors) through unchanged', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 's', options: { eyes: 'glow', baseColor: ['ff0000'] }, persona: '' })
  const callArgs = mockCreateAvatar.mock.calls[0][1]
  expect(callArgs.eyes).toEqual(['glow'])       // string → wrapped in array
  expect(callArgs.baseColor).toEqual(['ff0000']) // already an array → unchanged
  expect(callArgs.seed).toBe('s')
})

test('handles undefined options gracefully', () => {
  expect(() => {
    renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'x', persona: '' })
  }).not.toThrow()
})

test('applies overrides when provided', () => {
  renderAvatar(
    { id: '1', name: 'Bot', style: 'bottts', seed: 's', options: { mouth: 'smile01' }, persona: '' },
    { mouth: 'bite' }
  )
  const callArgs = mockCreateAvatar.mock.calls[0][1]
  expect(callArgs.mouth).toEqual(['bite'])
})

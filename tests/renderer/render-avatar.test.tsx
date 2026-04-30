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

test('passes seed and options to createAvatar', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'myseed', options: { eyes: 'bulging' }, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.objectContaining({ seed: 'myseed', eyes: 'bulging' })
  )
})

test('uses first style as fallback when style id is unknown', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'unknown-style', seed: 'x', options: {}, persona: '' })
  expect(mockCreateAvatar).toHaveBeenCalledWith(
    { __id: 'bottts' },
    expect.anything()
  )
})

test('spreads options over seed so explicit options override seed-based values', () => {
  renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 's', options: { eyes: 'glow', baseColor: ['ff0000'] }, persona: '' })
  const callArgs = mockCreateAvatar.mock.calls[0][1]
  expect(callArgs.eyes).toBe('glow')
  expect(callArgs.baseColor).toEqual(['ff0000'])
  expect(callArgs.seed).toBe('s')
})

test('handles undefined options gracefully', () => {
  expect(() => {
    renderAvatar({ id: '1', name: 'Bot', style: 'bottts', seed: 'x', persona: '' })
  }).not.toThrow()
})

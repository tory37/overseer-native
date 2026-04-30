import { CURATED_STYLES, type OptionDef, type StyleDef } from '../../src/renderer/lib/dicebear-styles'

jest.mock('@dicebear/collection', () => ({
  bottts: { __id: 'bottts' },
  pixelArt: { __id: 'pixelArt' },
  funEmoji: { __id: 'funEmoji' },
  avataaars: { __id: 'avataaars' },
  micah: { __id: 'micah' },
  lorelei: { __id: 'lorelei' },
  personas: { __id: 'personas' },
}))

describe('CURATED_STYLES', () => {
  test('has exactly 7 entries', () => {
    expect(CURATED_STYLES).toHaveLength(7)
  })

  test('each style has required fields', () => {
    for (const style of CURATED_STYLES) {
      expect(style.id).toBeTruthy()
      expect(style.label).toBeTruthy()
      expect(style.collection).toBeTruthy()
      expect(Array.isArray(style.options)).toBe(true)
    }
  })

  test('ids are the expected style slugs', () => {
    const ids = CURATED_STYLES.map(s => s.id)
    expect(ids).toEqual(['bottts', 'pixel-art', 'fun-emoji', 'avataaars', 'micah', 'lorelei', 'personas'])
  })

  test('each option has type, key, and label', () => {
    for (const style of CURATED_STYLES) {
      for (const opt of style.options) {
        expect(['enum', 'color']).toContain(opt.type)
        expect(opt.key).toBeTruthy()
        expect(opt.label).toBeTruthy()
      }
    }
  })

  test('bottts has eyes and baseColor options', () => {
    const bottts = CURATED_STYLES.find(s => s.id === 'bottts')!
    const eyes = bottts.options.find(o => o.key === 'eyes')!
    const color = bottts.options.find(o => o.key === 'baseColor')!
    expect(eyes.type).toBe('enum')
    expect((eyes as OptionDef & { type: 'enum' }).values.length).toBeGreaterThan(0)
    expect(color.type).toBe('color')
    expect((color as OptionDef & { type: 'color' }).values.length).toBeGreaterThan(0)
  })

  test('each enum option has at least one value', () => {
    for (const style of CURATED_STYLES) {
      for (const opt of style.options) {
        if (opt.type === 'enum') {
          expect(opt.values.length).toBeGreaterThan(0)
        }
        if (opt.type === 'color') {
          expect(opt.values.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

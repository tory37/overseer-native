import { BUILTIN_THEMES } from '../../src/renderer/store/theme'

describe('BUILTIN_THEMES', () => {
  test('contains all expected themes', () => {
    const ids = BUILTIN_THEMES.map(t => t.id)
    expect(ids).toContain('overseer-dark')
    expect(ids).toContain('overseer-light')
    
    // Check for some animal themes to ensure spread works
    expect(ids).toContain('raven')
    expect(ids).toContain('wolf')
    expect(ids).toContain('kraken')
    expect(ids).toContain('xenomorph')
    
    // Ensure old themes are gone
    expect(ids).not.toContain('monokai')
    expect(ids).not.toContain('solarized-dark')
    expect(ids).not.toContain('nord')
  })

  test('Overseer Dark has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'overseer-dark')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#1e1e1e')
    expect(theme?.colors['accent']).toBe('#0e639c')
  })

  test('Overseer Light has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'overseer-light')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#ffffff')
    expect(theme?.colors['accent']).toBe('#007acc')
  })

  test('Animal themes have correct structure', () => {
    const raven = BUILTIN_THEMES.find(t => t.id === 'raven')
    expect(raven).toBeDefined()
    expect(raven?.name).toBe('Raven')
    expect(raven?.colors['bg-main']).toBeDefined()
    expect(raven?.colors['accent']).toBeDefined()
  })
})

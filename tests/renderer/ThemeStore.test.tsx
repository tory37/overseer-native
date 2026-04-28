import { BUILTIN_THEMES } from '../../src/renderer/store/theme'

describe('BUILTIN_THEMES', () => {
  test('contains all expected themes', () => {
    const ids = BUILTIN_THEMES.map(t => t.id)
    expect(ids).toContain('overseer-dark')
    expect(ids).toContain('overseer-light')
    expect(ids).toContain('monokai')
    expect(ids).toContain('solarized-dark')
    expect(ids).toContain('nord')
    expect(ids).toContain('code-red')
    expect(ids).toContain('amber-alert')
    expect(ids).toContain('matrix')
    expect(ids).toContain('cyberpunk')
    expect(ids).toContain('deep-sea')
  })

  test('Code Red has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'code-red')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#0a0a0a')
    expect(theme?.colors['accent']).toBe('#ff0000')
    expect(theme?.colors['terminal-fg']).toBe('#ff0000')
  })

  test('Amber Alert has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'amber-alert')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#0d0d0d')
    expect(theme?.colors['accent']).toBe('#ffb000')
    expect(theme?.colors['terminal-fg']).toBe('#ffb000')
  })

  test('Matrix has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'matrix')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#000500')
    expect(theme?.colors['accent']).toBe('#00ff41')
    expect(theme?.colors['terminal-fg']).toBe('#00ff41')
  })

  test('Cyberpunk has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'cyberpunk')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#0d0221')
    expect(theme?.colors['accent']).toBe('#ff00ff')
    expect(theme?.colors['terminal-fg']).toBe('#ff00ff')
  })

  test('Deep Sea has correct colors', () => {
    const theme = BUILTIN_THEMES.find(t => t.id === 'deep-sea')
    expect(theme).toBeDefined()
    expect(theme?.colors['bg-main']).toBe('#010a10')
    expect(theme?.colors['accent']).toBe('#00f0ff')
    expect(theme?.colors['terminal-fg']).toBe('#00f0ff')
  })
})

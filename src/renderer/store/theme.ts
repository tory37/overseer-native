import { create } from 'zustand'
import { Theme, IPC } from '../types/ipc'
import { ANIMAL_THEMES, RANGER_THEMES } from '../themes'

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'overseer-dark',
    name: 'Overseer Dark',
    colors: {
      'bg-main': '#1e1e1e',
      'bg-header': '#2d2d2d',
      'bg-sidebar': '#252526',
      'bg-active-tab': '#094771',
      'bg-inactive-tab': '#2d2d2d',
      'bg-terminal': '#1e1e1e',
      'text-main': '#cccccc',
      'text-muted': '#888888',
      'accent': '#0e639c',
      'border': '#444444',
      'terminal-bg': '#1e1e1e',
      'terminal-fg': '#cccccc'
    }
  },
  {
    id: 'overseer-light',
    name: 'Overseer Light',
    colors: {
      'bg-main': '#ffffff',
      'bg-header': '#f3f3f3',
      'bg-sidebar': '#f3f3f3',
      'bg-active-tab': '#007acc',
      'bg-inactive-tab': '#e1e1e1',
      'bg-terminal': '#ffffff',
      'text-main': '#333333',
      'text-muted': '#666666',
      'accent': '#007acc',
      'border': '#cccccc',
      'terminal-bg': '#ffffff',
      'terminal-fg': '#333333'
    }
  },
  ...ANIMAL_THEMES,
  ...RANGER_THEMES
]

interface ThemeState {
  activeThemeId: string
  customThemes: Theme[]
  setActiveTheme: (id: string) => void
  loadSettings: () => Promise<void>
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: 'overseer-dark',
  customThemes: [],
  setActiveTheme: (id) => {
    set({ activeThemeId: id })
    const { activeThemeId, customThemes } = get()
    window.overseer?.writeTheme?.({ activeThemeId, customThemes })
  },
  loadSettings: async () => {
    if (!window.overseer?.readTheme) return
    const settings = await window.overseer.readTheme()
    if (settings) {
      set({ 
        activeThemeId: settings.activeThemeId || 'overseer-dark', 
        customThemes: settings.customThemes || [] 
      })
    }
  }
}))

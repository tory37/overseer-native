import { create } from 'zustand'
import { Theme, IPC } from '../types/ipc'

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
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      'bg-main': '#272822',
      'bg-header': '#1e1f1c',
      'bg-sidebar': '#1e1f1c',
      'bg-active-tab': '#49483e',
      'bg-inactive-tab': '#272822',
      'bg-terminal': '#272822',
      'text-main': '#f8f8f2',
      'text-muted': '#75715e',
      'accent': '#a6e22e',
      'border': '#49483e',
      'terminal-bg': '#272822',
      'terminal-fg': '#f8f8f2'
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      'bg-main': '#002b36',
      'bg-header': '#073642',
      'bg-sidebar': '#073642',
      'bg-active-tab': '#268bd2',
      'bg-inactive-tab': '#002b36',
      'bg-terminal': '#002b36',
      'text-main': '#839496',
      'text-muted': '#586e75',
      'accent': '#268bd2',
      'border': '#073642',
      'terminal-bg': '#002b36',
      'terminal-fg': '#839496'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      'bg-main': '#2e3440',
      'bg-header': '#3b4252',
      'bg-sidebar': '#3b4252',
      'bg-active-tab': '#88c0d0',
      'bg-inactive-tab': '#2e3440',
      'bg-terminal': '#2e3440',
      'text-main': '#d8dee9',
      'text-muted': '#4c566a',
      'accent': '#88c0d0',
      'border': '#434c5e',
      'terminal-bg': '#2e3440',
      'terminal-fg': '#d8dee9'
    }
  }
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
    ;(window as any).electron.invoke(IPC.THEME_WRITE, { activeThemeId, customThemes })
  },
  loadSettings: async () => {
    const settings = await (window as any).electron.invoke(IPC.THEME_READ)
    if (settings) {
      set({ 
        activeThemeId: settings.activeThemeId || 'overseer-dark', 
        customThemes: settings.customThemes || [] 
      })
    }
  }
}))

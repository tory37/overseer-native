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
  },
  {
    id: 'code-red',
    name: 'Code Red',
    colors: {
      'bg-main': '#0a0a0a',
      'bg-header': '#151515',
      'bg-sidebar': '#121212',
      'bg-active-tab': '#4a0000',
      'bg-inactive-tab': '#1a1a1a',
      'bg-terminal': '#0a0a0a',
      'text-main': '#ffffff',
      'text-muted': '#880000',
      'accent': '#ff0000',
      'border': '#330000',
      'terminal-bg': '#0a0a0a',
      'terminal-fg': '#ff0000'
    }
  },
  {
    id: 'amber-alert',
    name: 'Amber Alert',
    colors: {
      'bg-main': '#0d0d0d',
      'bg-header': '#1a1a1a',
      'bg-sidebar': '#141414',
      'bg-active-tab': '#b37700',
      'bg-inactive-tab': '#1a1a1a',
      'bg-terminal': '#0d0d0d',
      'text-main': '#ffb000',
      'text-muted': '#805800',
      'accent': '#ffb000',
      'border': '#332200',
      'terminal-bg': '#0d0d0d',
      'terminal-fg': '#ffb000'
    }
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      'bg-main': '#000500',
      'bg-header': '#000a00',
      'bg-sidebar': '#000700',
      'bg-active-tab': '#00330d',
      'bg-inactive-tab': '#000a00',
      'bg-terminal': '#000500',
      'text-main': '#00ff41',
      'text-muted': '#008020',
      'accent': '#00ff41',
      'border': '#002209',
      'terminal-bg': '#000500',
      'terminal-fg': '#00ff41'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      'bg-main': '#0d0221',
      'bg-header': '#1a0442',
      'bg-sidebar': '#130330',
      'bg-active-tab': '#ff00ff',
      'bg-inactive-tab': '#1a0442',
      'bg-terminal': '#0d0221',
      'text-main': '#ffffff',
      'text-muted': '#ff00ff',
      'accent': '#ff00ff',
      'border': '#1a0442',
      'terminal-bg': '#0d0221',
      'terminal-fg': '#ff00ff'
    }
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    colors: {
      'bg-main': '#010a10',
      'bg-header': '#021a2b',
      'bg-sidebar': '#021421',
      'bg-active-tab': '#00f0ff',
      'bg-inactive-tab': '#021a2b',
      'bg-terminal': '#010a10',
      'text-main': '#ffffff',
      'text-muted': '#00f0ff',
      'accent': '#00f0ff',
      'border': '#021a2b',
      'terminal-bg': '#010a10',
      'terminal-fg': '#00f0ff'
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

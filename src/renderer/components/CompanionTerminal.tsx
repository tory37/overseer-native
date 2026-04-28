import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Keybindings, Theme } from '../types/ipc'

interface Props {
  companionId: string
  focused: boolean
  keybindings: Keybindings
  activeTheme: Theme
}

export function CompanionTerminal({ companionId, focused, keybindings, activeTheme }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const keybindingsRef = useRef(keybindings)

  useEffect(() => { keybindingsRef.current = keybindings }, [keybindings])

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = {
        background: activeTheme.colors['terminal-bg'],
        foreground: activeTheme.colors['terminal-fg']
      }
    }
  }, [activeTheme])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({ 
      theme: { 
        background: activeTheme.colors['terminal-bg'], 
        foreground: activeTheme.colors['terminal-fg'] 
      }, 
      fontFamily: 'monospace', 
      fontSize: 14 
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      return !matchKeybinding(keybindingsRef.current, e)
    })

    const unsubscribeData = window.overseer.onCompanionData((id, data) => {
      if (id === companionId) term.write(data)
    })

    term.onData((data) => {
      window.overseer.sendCompanionInput(companionId, data)
    })

    const observer = new ResizeObserver(() => {
      fit.fit()
      window.overseer.resizeCompanion(companionId, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribeData()
      observer.disconnect()
      term.dispose()
    }
  }, [companionId])

  useEffect(() => {
    if (focused && termRef.current) termRef.current.focus()
  }, [focused])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

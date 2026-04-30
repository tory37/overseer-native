import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Keybindings, Theme } from '../types/ipc'

interface Props {
  companionId: string
  focused: boolean
  visible: boolean
  keybindings: Keybindings
  activeTheme: Theme
}

export function CompanionTerminal({ companionId, focused, visible, keybindings, activeTheme }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const fitRef         = useRef<FitAddon | null>(null)
  const keybindingsRef = useRef(keybindings)
  const focusedRef     = useRef(focused)

  useEffect(() => { keybindingsRef.current = keybindings }, [keybindings])
  useEffect(() => { focusedRef.current = focused }, [focused])

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = {
        background: activeTheme.colors['terminal-bg'],
        foreground: activeTheme.colors['terminal-fg']
      }
    }
  }, [activeTheme])

  // Refresh layout when becoming visible
  useEffect(() => {
    if (visible && fitRef.current) {
      // Small delay to ensure display: block has been applied and rendered
      setTimeout(() => {
        fitRef.current?.fit()
      }, 0)
    }
  }, [visible])

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
    fitRef.current = fit

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.type === 'keydown' && e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        const sel = term.getSelection()
        if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
        return false
      }
      if (e.type === 'keydown' && e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        window.overseer.readFromClipboard().then(text => {
          if (text) window.overseer.sendCompanionInput(companionId, text)
        }).catch(() => {})
        return false
      }
      return !matchKeybinding(keybindingsRef.current, e)
    })

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      window.overseer.showContextMenu({
        x: e.clientX,
        y: e.clientY,
        hasSelection: !!term.getSelection()
      })
    }
    containerRef.current.addEventListener('contextmenu', handleContextMenu)

    const unsubCopy = window.overseer.onTerminalCopy(() => {
      if (!focusedRef.current) return
      const sel = term.getSelection()
      if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
    })

    const unsubPaste = window.overseer.onTerminalPaste(() => {
      if (!focusedRef.current) return
      window.overseer.readFromClipboard().then(text => {
        if (text) window.overseer.sendCompanionInput(companionId, text)
      }).catch(() => {})
    })

    const unsubscribeData = window.overseer.onCompanionData((id, data) => {
      if (id === companionId) term.write(data)
    })

    term.onData((data) => {
      window.overseer.sendCompanionInput(companionId, data)
    })

    const observer = new ResizeObserver(() => {
      if (!containerRef.current || containerRef.current.clientWidth === 0) return
      fit.fit()
      window.overseer.resizeCompanion(companionId, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribeData()
      unsubCopy()
      unsubPaste()
      observer.disconnect()
      containerRef.current?.removeEventListener('contextmenu', handleContextMenu)
      term.dispose()
    }
  }, [companionId])

  useEffect(() => {
    if (focused && termRef.current) termRef.current.focus()
  }, [focused])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

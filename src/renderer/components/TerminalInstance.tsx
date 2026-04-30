import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Session, Keybindings, Theme } from '../types/ipc'

interface Props {
  session: Session
  focused: boolean
  visible: boolean
  keybindings: Keybindings
  activeTheme: Theme
}

export function TerminalInstance({ session, focused, visible, keybindings, activeTheme }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const fitRef         = useRef<FitAddon | null>(null)
  const keybindingsRef = useRef(keybindings)
  const isReplayingRef = useRef(true)
  const ptyBufferRef   = useRef<string[]>([])

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
    if (focused && termRef.current) termRef.current.focus()
  }, [focused])

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

    isReplayingRef.current = true
    ptyBufferRef.current = []

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
          if (text && !isReplayingRef.current) window.overseer.sendInput(session.id, text)
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
      const sel = term.getSelection()
      if (sel) window.overseer.copyToClipboard(sel).catch(() => {})
    })

    const unsubPaste = window.overseer.onTerminalPaste(() => {
      window.overseer.readFromClipboard().then(text => {
        if (text && !isReplayingRef.current) window.overseer.sendInput(session.id, text)
      }).catch(() => {})
    })

    const unsubscribe = window.overseer.onPtyData(session.id, (data) => {
      if (isReplayingRef.current) {
        ptyBufferRef.current.push(data)
      } else {
        term.write(data)
      }
    })

    const unsubscribeError = window.overseer.onPtyError(session.id, (err) => {
      term.write(`\r\n\x1b[31m[Overseer] ${err}\x1b[0m\r\n`)
    })

    window.overseer.getScrollback(session.id).then(data => {
      const finishReplay = () => {
        isReplayingRef.current = false
        while (ptyBufferRef.current.length > 0) {
          term.write(ptyBufferRef.current.shift()!)
        }
      }

      if (data) {
        term.write(data, finishReplay)
      } else {
        term.write('\r\nWelcome to Overseer\r\n\r\n', finishReplay)
      }
    })

    term.onData((data) => {
      if (!isReplayingRef.current) {
        window.overseer.sendInput(session.id, data)
      }
    })

    const observer = new ResizeObserver(() => {
      if (!containerRef.current || containerRef.current.clientWidth === 0) return
      fit.fit()
      window.overseer.resize(session.id, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribe()
      unsubscribeError()
      unsubCopy()
      unsubPaste()
      observer.disconnect()
      containerRef.current?.removeEventListener('contextmenu', handleContextMenu)
      term.dispose()
    }
  }, [session.id])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

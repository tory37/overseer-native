import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { matchKeybinding } from '../types/ipc'
import type { Session, Keybindings } from '../types/ipc'

interface Props {
  session: Session
  focused: boolean
  keybindings: Keybindings
}

export function TerminalInstance({ session, focused, keybindings }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const termRef        = useRef<Terminal | null>(null)
  const fitRef         = useRef<FitAddon | null>(null)
  const keybindingsRef = useRef(keybindings)

  useEffect(() => { keybindingsRef.current = keybindings }, [keybindings])

  useEffect(() => {
    if (focused && termRef.current) termRef.current.focus()
  }, [focused])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({ theme: { background: '#1e1e1e' }, fontFamily: 'monospace', fontSize: 14 })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      return !matchKeybinding(keybindingsRef.current, e)
    })

    window.overseer.getScrollback(session.id).then(data => {
      if (data) {
        term.write(Buffer.from(data, 'binary'))
      } else {
        term.write('\r\nWelcome to Overseer\r\n\r\n')
      }
    })

    const unsubscribe = window.overseer.onPtyData(session.id, (data) => {
      term.write(data)
    })

    const unsubscribeError = window.overseer.onPtyError(session.id, (err) => {
      term.write(`\r\n\x1b[31m[Overseer] ${err}\x1b[0m\r\n`)
    })

    term.onData((data) => {
      window.overseer.sendInput(session.id, data)
    })

    const observer = new ResizeObserver(() => {
      fit.fit()
      window.overseer.resize(session.id, term.cols, term.rows)
    })
    observer.observe(containerRef.current)

    return () => {
      unsubscribe()
      unsubscribeError()
      observer.disconnect()
      term.dispose()
    }
  }, [session.id])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

import React, { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { renderAvatar } from '../lib/render-avatar'
import { useSpritesStore } from '../store/sprites'
import { ANIMATION_OVERRIDES } from '../lib/dicebear-styles'

interface Props {
  sessionId: string | null
  spriteId: string | null
  animationState: 'idle' | 'talking' | 'thinking'  // no-op in MVP; prop exists for future extension
  visible: boolean
  onOpenStudio: () => void
}

function ProminentBubble({ text, targetRef }: { text: string, targetRef: React.RefObject<HTMLDivElement | null> }) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    const update = () => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect()
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
      }
    }
    update()
    // Small delay to ensure layout is settled
    const timer = setTimeout(update, 50)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      clearTimeout(timer)
    }
  }, [targetRef, text])

  if (!text) return null

  const root = document.getElementById('overlay-root')
  if (!root) return null

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: coords.top - Math.min(60, coords.height),
      left: coords.left - 100,
      width: coords.width + 120,
      maxHeight: '400px',
      overflowY: 'auto',
      background: 'var(--bg-main)',
      border: '2px solid var(--accent)',
      borderRadius: '16px',
      padding: '16px 20px',
      fontSize: '16px',
      fontWeight: '500',
      color: 'var(--text-main)',
      textAlign: 'center',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      zIndex: 9999,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {text}
      {/* Speech bubble pointer */}
      <div style={{
        position: 'absolute',
        bottom: '-12px',
        left: 'calc(50% + 30px)',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: '12px solid var(--accent)',
        pointerEvents: 'none',
      }} />
    </div>,
    root
  )
}

export function SpritePanel({ sessionId, spriteId, animationState: _animationState, visible, onOpenStudio }: Props) {
  const sprites = useSpritesStore(s => s.sprites)
  const sprite = spriteId ? (sprites.find(s => s.id === spriteId) ?? null) : null
  const [speechText, setSpeechText] = useState('')
  const [lastMessage, setLastMessage] = useState('')
  const [lastPtyTime, setLastPtyTime] = useState(0)
  const [isMouthOpen, setIsMouthOpen] = useState(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSpeechText('')
    setLastMessage('')
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    const unsub = window.overseer.onSpriteSpeech(({ sessionId: sid, text }) => {
      if (sid !== sessionId) return
      
      setSpeechText(text)
      setLastMessage(text)
      
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => {
        setSpeechText('')
      }, 8000)
    })
    return () => {
      unsub()
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    const unsub = window.overseer.onCompanionData((_id, _data) => {
      setLastPtyTime(Date.now())
    })
    return unsub
  }, [sessionId])

  useEffect(() => {
    if (!speechText) {
      setIsMouthOpen(false)
      return
    }
    const interval = setInterval(() => {
      setIsMouthOpen(prev => !prev)
    }, 150)
    return () => clearInterval(interval)
  }, [speechText])

  if (!visible) return null

  const now = Date.now()
  const isThinking = !speechText && (now - lastPtyTime < 2000)
  const isSpeaking = !!speechText
  const animationClass = isSpeaking ? 'overseer-sprite-speaking' : (isThinking ? 'overseer-sprite-thinking' : 'overseer-sprite-idle')

  let avatarSvg = ''
  if (sprite) {
    try {
      const overrides: Record<string, unknown> = {}
      const styleOverrides = ANIMATION_OVERRIDES[sprite.style]

      if (isSpeaking) {
        if (isMouthOpen && styleOverrides?.speaking) {
          Object.assign(overrides, styleOverrides.speaking)
        }
      } else if (isThinking && styleOverrides?.thinking) {
        Object.assign(overrides, styleOverrides.thinking)
      }

      avatarSvg = renderAvatar(sprite, overrides)
    } catch (err) {
      console.error(`[Sprite] Avatar render failed for sprite ${sprite.id}:`, err)
    }
  }

  const containerStyle: React.CSSProperties = {
    borderTop: '1px solid var(--border)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minHeight: '180px',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'flex-start',
    marginBottom: '8px',
  }

  if (!sprite) {
    return (
      <div style={containerStyle}>
        <div style={labelStyle}>Sprite</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center' }}>No Sprite assigned</div>
        <button
          onClick={onOpenStudio}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}
        >
          Open Studio
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>Sprite — {sprite.name}</div>
      
      {/* Persistent Bubble Area */}
      <div ref={bubbleRef} style={{
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '4px',
        position: 'relative',
      }}>
        <div style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--accent)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text-main)',
          maxWidth: '220px',
          maxHeight: '100px',
          overflowY: 'auto',
          textAlign: 'center',
          opacity: lastMessage ? 1 : 0.4,
          fontStyle: lastMessage ? 'normal' : 'italic',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: lastMessage ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
        }}>
          {lastMessage || "Awaiting transmission..."}
          
          {/* Inline bubble pointer */}
          {lastMessage && (
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--accent)',
            }} />
          )}
        </div>
      </div>

      {/* Prominent Overlay (Portal) */}
      <ProminentBubble text={speechText} targetRef={bubbleRef} />

      {avatarSvg && (
        <div
          className={animationClass}
          style={{ width: '80px', height: '80px' }}
          dangerouslySetInnerHTML={{ __html: avatarSvg }}
        />
      )}
    </div>
  )
}


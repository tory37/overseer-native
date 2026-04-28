import React, { useEffect, useState, useRef } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'
import { useSpritesStore } from '../store/sprites'

interface Props {
  sessionId: string | null
  spriteId: string | null
  animationState: 'idle' | 'talking' | 'thinking'  // no-op in MVP; prop exists for future extension
  visible: boolean
  onOpenStudio: () => void
}

export function SpritePanel({ sessionId, spriteId, animationState: _animationState, visible, onOpenStudio }: Props) {
  const sprites = useSpritesStore(s => s.sprites)
  const sprite = spriteId ? (sprites.find(s => s.id === spriteId) ?? null) : null
  const [speechText, setSpeechText] = useState('')
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const unsub = window.overseer.onSpriteSpeech(({ sessionId: sid, text }) => {
      if (sid !== sessionId) return
      setSpeechText(text)
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => setSpeechText(''), 8000)
    })
    return () => {
      unsub()
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [sessionId])

  if (!visible) return null

  let avatarSvg = ''
  if (sprite) {
    try {
      avatarSvg = createAvatar(bottts, { seed: sprite.seed }).toString()
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
    gap: '8px',
    minHeight: '160px',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'flex-start',
  }

  if (!sprite) {
    return (
      <div style={containerStyle}>
        <div style={labelStyle}>Sprite</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No Sprite assigned</div>
        <button
          onClick={onOpenStudio}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
        >
          Open Studio
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>Sprite — {sprite.name}</div>
      {speechText && (
        <div style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '12px',
          color: 'var(--text-main)',
          maxWidth: '220px',
          textAlign: 'center',
        }}>
          {speechText}
        </div>
      )}
      {avatarSvg && (
        <div
          style={{ width: '80px', height: '80px' }}
          dangerouslySetInnerHTML={{ __html: avatarSvg }}
        />
      )}
    </div>
  )
}

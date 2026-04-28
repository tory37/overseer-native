import React, { useState } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'
import { useSpritesStore } from '../store/sprites'

interface Props {
  onClose: () => void
  editingId?: string | null
}

export function SpriteStudio({ onClose, editingId }: Props) {
  const { sprites, createSprite, updateSprite, deleteSprite } = useSpritesStore()
  const editing = editingId ? (sprites.find(s => s.id === editingId) ?? null) : null

  const [name, setName] = useState(editing?.name ?? '')
  const [seed, setSeed] = useState(editing?.seed ?? '')
  const [persona, setPersona] = useState(editing?.persona ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  let previewSvg = ''
  if (seed) {
    try {
      previewSvg = createAvatar(bottts, { seed }).toString()
    } catch (err) {
      console.error('[Sprite] Avatar preview render failed:', err)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateSprite(editing.id, { name: name.trim(), seed, persona })
    } else {
      createSprite({ name: name.trim(), style: 'bottts', seed, persona })
    }
    onClose()
  }

  const handleDelete = () => {
    if (!editing) return
    if (confirmDelete) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
      deleteSprite(editing.id)
      onClose()
    } else {
      setConfirmDelete(true)
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 2000)
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-header)', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '420px', maxWidth: '560px', width: '100%',
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '6px 8px', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px',
  }

  return (
    <div style={overlayStyle}>
      <form style={dialogStyle} onSubmit={handleSave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>{editing ? 'Edit Sprite' : 'New Sprite'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <label style={labelStyle} htmlFor="sprite-name">
          Name
          <input id="sprite-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required autoFocus />
        </label>

        <label style={labelStyle} htmlFor="sprite-seed">
          Avatar Seed
          <input id="sprite-seed" aria-label="Avatar Seed" style={inputStyle} value={seed} onChange={e => setSeed(e.target.value)} placeholder="Any text — changes the avatar shape" />
        </label>

        {previewSvg && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px' }} dangerouslySetInnerHTML={{ __html: previewSvg }} />
          </div>
        )}

        <label style={labelStyle} htmlFor="sprite-persona">
          Persona
          <textarea
            id="sprite-persona"
            aria-label="Persona"
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
            value={persona}
            onChange={e => setPersona(e.target.value)}
            placeholder="Describe the character personality..."
          />
        </label>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: confirmDelete ? '#c0392b' : 'transparent',
                color: confirmDelete ? '#fff' : '#e05252',
                border: '1px solid #e05252',
                borderRadius: '4px', padding: '6px 12px', cursor: 'pointer',
              }}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          )}
          <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Save</button>
        </div>
      </form>
    </div>
  )
}

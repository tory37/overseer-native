import React, { useState } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'
import { useSpritesStore, Sprite } from '../store/sprites'

interface Props {
  onClose: () => void
  editingId?: string | null
}

export function SpriteStudio({ onClose, editingId: initialEditingId }: Props) {
  const { sprites, createSprite, updateSprite, deleteSprite } = useSpritesStore()
  
  // Local state to manage which view we are in
  const [view, setView] = useState<'LIST' | 'EDIT'>(initialEditingId ? 'EDIT' : 'LIST')
  const [currentEditId, setCurrentEditId] = useState<string | null>(initialEditingId || null)

  const editing = currentEditId ? (sprites.find(s => s.id === currentEditId) ?? null) : null

  // Form state
  const [name, setName] = useState(editing?.name ?? '')
  const [seed, setSeed] = useState(editing?.seed ?? '')
  const [persona, setPersona] = useState(editing?.persona ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEdit = (sprite: Sprite) => {
    setCurrentEditId(sprite.id)
    setName(sprite.name)
    setSeed(sprite.seed)
    setPersona(sprite.persona)
    setView('EDIT')
  }

  const handleNew = () => {
    setCurrentEditId(null)
    setName('')
    setSeed('')
    setPersona('')
    setView('EDIT')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateSprite(editing.id, { name: name.trim(), seed, persona })
    } else {
      createSprite({ name: name.trim(), style: 'bottts', seed, persona })
    }
    setView('LIST')
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
      deleteSprite(id)
      setConfirmDelete(null)
      if (currentEditId === id) setView('LIST')
    } else {
      setConfirmDelete(id)
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(null), 2000)
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }
  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-header)', padding: '24px', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '420px', maxWidth: '600px', width: '90%',
    maxHeight: '85vh', overflowY: 'auto',
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '6px 8px', width: '100%', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px',
  }

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Sprite Library</h2>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
        {sprites.map(s => {
          let svg = ''
          try { svg = createAvatar(bottts, { seed: s.seed }).toString() } catch (e) {}
          return (
            <div key={s.id} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', 
              background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border)' 
            }}>
              <div style={{ width: '40px', height: '40px' }} dangerouslySetInnerHTML={{ __html: svg }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '14px' }}>{s.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  {s.persona}
                </div>
              </div>
              <button 
                onClick={() => handleEdit(s)}
                style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(s.id)}
                style={{ 
                  background: confirmDelete === s.id ? '#c0392b' : 'transparent', 
                  color: confirmDelete === s.id ? '#fff' : '#e05252', 
                  border: '1px solid #e05252', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' 
                }}
              >
                {confirmDelete === s.id ? 'Sure?' : 'Delete'}
              </button>
            </div>
          )
        })}
      </div>

      <button 
        onClick={handleNew}
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        + Create New Sprite
      </button>

      <div style={{ 
        marginTop: '12px', padding: '12px', background: 'var(--bg-main)', 
        borderRadius: '4px', border: '1px dotted var(--border)', fontSize: '13px' 
      }}>
        <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginBottom: '4px' }}>How to use Sprites</div>
        <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Assign a sprite to your session. When the AI outputs text wrapped in 
          <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px', margin: '0 4px', color: 'var(--accent)' }}>
            &lt;speak&gt;...&lt;/speak&gt;
          </code> 
          tags, it will appear in the sprite's speech bubble.
        </div>
      </div>
    </div>
  )

  const renderForm = () => {
    let previewSvg = ''
    if (seed) {
      try { previewSvg = createAvatar(bottts, { seed }).toString() } catch (err) {}
    }

    return (
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>{editing ? 'Edit Sprite' : 'New Sprite'}</h2>
          <button type="button" onClick={() => setView('LIST')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>← Back</button>
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

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setView('LIST')} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>Save</button>
        </div>
      </form>
    )
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {view === 'LIST' ? renderList() : renderForm()}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useSpritesStore, Sprite } from '../store/sprites'
import { renderAvatar } from '../lib/render-avatar'
import { CURATED_STYLES, type OptionDef } from '../lib/dicebear-styles'

interface Props {
  onClose: () => void
  editingId?: string | null
}

export function SpriteStudio({ onClose, editingId: initialEditingId }: Props) {
  const { sprites, createSprite, updateSprite, deleteSprite } = useSpritesStore()

  const [view, setView] = useState<'LIST' | 'EDIT'>(initialEditingId ? 'EDIT' : 'LIST')
  const [currentEditId, setCurrentEditId] = useState<string | null>(initialEditingId || null)

  const editing = currentEditId ? (sprites.find(s => s.id === currentEditId) ?? null) : null

  const [name, setName] = useState(editing?.name ?? '')
  const [style, setStyle] = useState(editing?.style ?? 'bottts')
  const [seed, setSeed] = useState(editing?.seed ?? Math.random().toString(36).slice(2, 10))
  const [options, setOptions] = useState<Record<string, unknown>>(editing?.options ?? {})
  const [persona, setPersona] = useState(editing?.persona ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const styleDef = CURATED_STYLES.find(s => s.id === style) ?? CURATED_STYLES[0]
  const styleIdx = CURATED_STYLES.findIndex(s => s.id === style)

  const handleStyleLeft = () => {
    const newIdx = (styleIdx - 1 + CURATED_STYLES.length) % CURATED_STYLES.length
    setStyle(CURATED_STYLES[newIdx].id)
    setOptions({})
  }

  const handleStyleRight = () => {
    const newIdx = (styleIdx + 1) % CURATED_STYLES.length
    setStyle(CURATED_STYLES[newIdx].id)
    setOptions({})
  }

  const handleEnumLeft = (def: OptionDef & { type: 'enum' }) => {
    const currentVal = options[def.key] as string | undefined
    const currentIdx = currentVal !== undefined ? def.values.indexOf(currentVal) : -1
    let newVal: string | undefined
    if (currentIdx === -1) {
      newVal = def.values[def.values.length - 1]
    } else if (currentIdx === 0) {
      newVal = undefined
    } else {
      newVal = def.values[currentIdx - 1]
    }
    if (newVal === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: newVal })
    }
  }

  const handleEnumRight = (def: OptionDef & { type: 'enum' }) => {
    const currentVal = options[def.key] as string | undefined
    const currentIdx = currentVal !== undefined ? def.values.indexOf(currentVal) : -1
    let newVal: string | undefined
    if (currentIdx === -1) {
      newVal = def.values[0]
    } else if (currentIdx === def.values.length - 1) {
      newVal = undefined
    } else {
      newVal = def.values[currentIdx + 1]
    }
    if (newVal === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: newVal })
    }
  }

  const handleColorSelect = (def: OptionDef & { type: 'color' }, color: string | undefined) => {
    if (color === undefined) {
      const { [def.key]: _, ...rest } = options
      setOptions(rest)
    } else {
      setOptions({ ...options, [def.key]: [color] })
    }
  }

  const handleEdit = (sprite: Sprite) => {
    setCurrentEditId(sprite.id)
    setName(sprite.name)
    setStyle(sprite.style)
    setSeed(sprite.seed)
    setOptions(sprite.options ?? {})
    setPersona(sprite.persona)
    setView('EDIT')
  }

  const handleNew = () => {
    setCurrentEditId(null)
    setName('')
    setStyle('bottts')
    setSeed(Math.random().toString(36).slice(2, 10))
    setOptions({})
    setPersona('')
    setView('EDIT')
  }

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).slice(2, 10))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateSprite(editing.id, { name: name.trim(), style, seed, options, persona })
    } else {
      createSprite({ name: name.trim(), style, seed, options, persona })
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
  const arrowBtnStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)',
    borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '14px', lineHeight: '1.4',
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
          try { svg = renderAvatar(s) } catch (e) {}
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px',
              background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border)',
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
                  border: '1px solid #e05252', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer',
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
        borderRadius: '4px', border: '1px dotted var(--border)', fontSize: '13px',
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

  const renderOptionSlot = (def: OptionDef) => {
    if (def.type === 'enum') {
      const currentVal = options[def.key] as string | undefined
      return (
        <div
          key={def.key}
          data-testid={`option-${def.key}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <button type="button" style={arrowBtnStyle} onClick={() => handleEnumLeft(def)}>←</button>
          <span style={{ width: '80px', color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>{def.label}</span>
          <span
            data-testid="option-value"
            style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--text-main)', minWidth: '80px' }}
          >
            {currentVal ?? 'Random'}
          </span>
          <button type="button" style={arrowBtnStyle} onClick={() => handleEnumRight(def)}>→</button>
        </div>
      )
    }

    if (def.type === 'color') {
      const selectedColor = (options[def.key] as string[] | undefined)?.[0]
      return (
        <div
          key={def.key}
          data-testid={`option-${def.key}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
        >
          <span style={{ width: '90px', color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>{def.label}</span>
          <button
            type="button"
            onClick={() => handleColorSelect(def, undefined)}
            title="Random"
            style={{
              width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
              background: 'transparent', color: 'var(--text-muted)',
              border: selectedColor === undefined ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}
          >✕</button>
          {def.values.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(def, color)}
              title={`#${color}`}
              style={{
                width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', padding: 0,
                background: `#${color}`,
                border: selectedColor === color ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      )
    }

    return null
  }

  const renderForm = () => {
    let previewSvg = ''
    try {
      previewSvg = renderAvatar({ id: '', name: '', style, seed: seed || 'preview', options, persona })
    } catch (err) {}

    return (
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>{editing ? 'Edit Sprite' : 'New Sprite'}</h2>
          <button type="button" onClick={() => setView('LIST')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>← Back</button>
        </div>

        {/* Name + preview side by side */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <label style={{ ...labelStyle, flex: 1 }} htmlFor="sprite-name">
            Name
            <input id="sprite-name" aria-label="Name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </label>
          {previewSvg && (
            <div
              style={{ width: '80px', height: '80px', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          )}
        </div>

        {/* Style picker */}
        <div
          data-testid="style-picker"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
        >
          <button type="button" style={arrowBtnStyle} onClick={handleStyleLeft}>←</button>
          <span style={{ color: 'var(--text-main)', fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
            {styleDef.label}
          </span>
          <button type="button" style={arrowBtnStyle} onClick={handleStyleRight}>→</button>
        </div>

        {/* Option slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {styleDef.options.map(renderOptionSlot)}
        </div>

        {/* Randomize */}
        <button
          type="button"
          onClick={handleRandomize}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px', cursor: 'pointer', fontSize: '12px' }}
        >
          🎲 Randomize
        </button>

        {/* Persona */}
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

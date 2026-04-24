'use client'

import { useState, useEffect } from 'react'
import { updateAlbionPrice } from './actions/prices'
import MarkupInput from './MarkupInput'

interface Props {
  type: 'buyer' | 'seller'
  label: string
  currentPrice: number
  currentMarkup: number
  updatedAt?: string
}

export default function AlbionPriceForm({ type, label, currentPrice, currentMarkup, updatedAt }: Props) {
  const [value, setValue] = useState(String(currentPrice))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formattedDate, setFormattedDate] = useState<string | null>(null)

  useEffect(() => {
    if (updatedAt) {
      setFormattedDate(new Date(updatedAt).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }))
    }
  }, [updatedAt])

  async function handleSave() {
    const price = parseFloat(value)
    if (isNaN(price) || price <= 0) { setError('Precio inválido'); return }

    setSaving(true)
    setError(null)
    try {
      await updateAlbionPrice(type, price)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.card}>
      <div style={s.labelRow}>
        <span style={s.label}>{label}</span>
        <span style={s.region}>America West</span>
      </div>

      <div style={s.inputRow}>
        <span style={s.prefix}>$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={s.input}
        />
        <span style={s.unit}>/M</span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saved ? { ...s.btn, ...s.btnSaved } : saving ? { ...s.btn, ...s.btnDisabled } : s.btn}
        >
          {saved ? 'Guardado' : saving ? '...' : 'Guardar'}
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.markupRow}>
        <span style={s.markupLabel}>Markup</span>
        <MarkupInput game="albion" server={type} currentMarkup={currentMarkup} />
      </div>

      {formattedDate && <p style={s.updatedAt}>Actualizado: {formattedDate}</p>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '16px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#f5f5f5' },
  region: { fontSize: '11px', color: '#666' },
  inputRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  prefix: { color: '#888', fontSize: '14px' },
  input: { flex: 1, background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '8px 10px', fontSize: '16px', color: '#e8c547', fontFamily: 'monospace', outline: 'none', width: '80px' },
  unit: { color: '#888', fontSize: '13px' },
  btn: { background: '#e8c547', color: '#0a0a0a', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  btnSaved: { background: '#22c55e', color: '#fff' },
  btnDisabled: { background: '#555', cursor: 'not-allowed' },
  error: { margin: '8px 0 0', fontSize: '12px', color: '#ef4444' },
  markupRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #2a2a2a' },
  markupLabel: { fontSize: '12px', color: '#666' },
  updatedAt: { margin: '8px 0 0', fontSize: '11px', color: '#555' },
}

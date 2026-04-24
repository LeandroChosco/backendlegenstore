'use client'

import { useState } from 'react'
import { updateMarkup } from './actions/prices'

interface Props {
  game: string
  server: string
  currentMarkup: number
}

export default function MarkupInput({ game, server, currentMarkup }: Props) {
  const [value, setValue] = useState(String(currentMarkup))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  async function handleSave() {
    const pct = parseFloat(value)
    if (isNaN(pct)) { setError(true); setTimeout(() => setError(false), 1500); return }

    setSaving(true)
    try {
      await updateMarkup(game, server, pct)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error('updateMarkup error:', e)
      setError(true)
      setTimeout(() => setError(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const btnColor = saved ? '#22c55e' : error ? '#ef4444' : saving ? '#555' : '#e8c547'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        style={{
          width: '64px', background: '#111', border: '1px solid #333', borderRadius: '5px',
          padding: '4px 6px', fontSize: '13px', color: '#f5f5f5', fontFamily: 'monospace',
          outline: 'none', textAlign: 'right',
        }}
      />
      <span style={{ fontSize: '12px', color: '#888' }}>%</span>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: btnColor, color: '#0a0a0a', border: 'none', borderRadius: '5px',
          padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? '✓' : saving ? '...' : 'OK'}
      </button>
    </div>
  )
}

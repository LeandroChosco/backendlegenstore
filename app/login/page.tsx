'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>A</div>
          <h1 style={styles.title}>Panel Admin</h1>
          <p style={styles.subtitle}>Ingresá para gestionar el contenido</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>!</span>
              {error}
            </div>
          )}

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              autoComplete="email"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={styles.footer}>Acceso restringido — solo administradores</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: '#111111',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '40px 36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    width: '48px',
    height: '48px',
    background: '#e8c547',
    color: '#0a0a0a',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#f5f5f5',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888888',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#1c0a0a',
    border: '1px solid #ef444430',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#ef4444',
  },
  errorIcon: {
    width: '18px',
    height: '18px',
    background: '#ef4444',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#cccccc',
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#f5f5f5',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
  },
  inputFocus: {
    background: '#1a1a1a',
    border: '1px solid #e8c547',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#f5f5f5',
    outline: 'none',
    width: '100%',
  },
  button: {
    background: '#e8c547',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.15s',
  },
  buttonDisabled: {
    background: '#6b5e2a',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#555555',
  },
}

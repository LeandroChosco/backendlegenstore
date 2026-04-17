import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AlbionPriceForm from './AlbionPriceForm'

const GAME_LABELS: Record<string, string> = {
  albion: 'Albion Online',
  wow_tbc: 'WoW TBC',
  wow_midnight: 'WoW Midnight',
  runescape: 'RuneScape OSRS',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .order('game')
    .order('server')

  const albionBuyer = prices?.find(p => p.game === 'albion' && p.server === 'buyer')
  const albionSeller = prices?.find(p => p.game === 'albion' && p.server === 'seller')
  const scrapedPrices = prices?.filter(p => p.game !== 'albion') ?? []

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.brand}>
          <div style={s.logo}>A</div>
          <span style={s.brandName}>Panel Admin</span>
        </div>
        <div style={s.userInfo}>
          <span style={s.userEmail}>{user.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={s.logoutBtn}>Cerrar sesión</button>
          </form>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.pageTitle}>Gestión de Precios</h1>

        {/* Albion — precios estáticos editables */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Albion Online</h2>
            <span style={s.badge}>Editable</span>
          </div>
          <div style={s.albionGrid}>
            <AlbionPriceForm
              type="buyer"
              label="Compradores"
              currentPrice={albionBuyer?.price_usd ?? 0.25}
              updatedAt={albionBuyer?.updated_at}
            />
            <AlbionPriceForm
              type="seller"
              label="Vendedores"
              currentPrice={albionSeller?.price_usd ?? 0.18}
              updatedAt={albionSeller?.updated_at}
            />
          </div>
        </section>

        {/* Precios scrapeados */}
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Precios scrapeados</h2>
            <span style={{ ...s.badge, background: '#1a2a1a', color: '#22c55e' }}>Auto</span>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Juego</th>
                  <th style={s.th}>Servidor</th>
                  <th style={s.th}>Región</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Precio USD</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {scrapedPrices.map(row => (
                  <tr key={`${row.game}-${row.server}`} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.gameTag}>{GAME_LABELS[row.game] ?? row.game}</span>
                    </td>
                    <td style={s.td}>
                      {(row.raw_data as Record<string, string>)?.server_name ?? row.server}
                    </td>
                    <td style={{ ...s.td, color: '#888' }}>{row.region}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', color: '#e8c547' }}>
                      ${Number(row.price_usd).toFixed(6)}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', color: '#666', fontSize: '12px' }}>
                      {row.updated_at ? formatDate(row.updated_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#111', borderBottom: '1px solid #2a2a2a' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { width: '32px', height: '32px', background: '#e8c547', color: '#0a0a0a', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700 },
  brandName: { fontSize: '15px', fontWeight: 600 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  userEmail: { fontSize: '13px', color: '#888' },
  logoutBtn: { background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', color: '#ccc', cursor: 'pointer' },
  main: { padding: '40px 32px', maxWidth: '1100px', margin: '0 auto' },
  pageTitle: { fontSize: '26px', fontWeight: 600, marginBottom: '32px' },
  section: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '24px', marginBottom: '24px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, margin: 0 },
  badge: { fontSize: '11px', padding: '3px 8px', background: '#2a2a0a', color: '#e8c547', borderRadius: '4px', fontWeight: 600 },
  albionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 500, borderBottom: '1px solid #2a2a2a' },
  tr: { borderBottom: '1px solid #1a1a1a' },
  td: { padding: '12px 14px' },
  gameTag: { fontSize: '12px', padding: '3px 8px', background: '#1a1a2a', color: '#aab', borderRadius: '4px' },
}

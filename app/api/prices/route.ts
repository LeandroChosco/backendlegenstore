import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prices')
    .select('game, server, region, price_usd, is_static, raw_data, updated_at')
    .order('game')
    .order('server')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Organizar por juego para facilitar el consumo en el frontend
  const result: Record<string, unknown> = {}

  for (const row of data) {
    if (row.game === 'albion') {
      if (!result.albion) result.albion = { region: row.region, updated_at: row.updated_at, prices: {} }
      ;(result.albion as Record<string, unknown>).prices ??= {}
      ;((result.albion as Record<string, unknown>).prices as Record<string, unknown>)[row.server] = {
        price_usd: row.price_usd,
        label: (row.raw_data as Record<string, unknown>)?.label,
      }
    } else if (row.game === 'runescape') {
      result.runescape = {
        price_usd: row.price_usd,
        region: row.region,
        updated_at: row.updated_at,
        raw_data: row.raw_data,
      }
    } else if (row.game === 'wow_tbc') {
      if (!result.wow_tbc) result.wow_tbc = { servers: [], updated_at: row.updated_at }
      ;(result.wow_tbc as Record<string, unknown[]>).servers.push({
        server: row.server,
        price_usd: row.price_usd,
        updated_at: row.updated_at,
      })
    } else if (row.game === 'wow_midnight') {
      if (!result.wow_midnight) result.wow_midnight = { servers: [], updated_at: row.updated_at }
      ;(result.wow_midnight as Record<string, unknown[]>).servers.push({
        server: (row.raw_data as Record<string, unknown>)?.server_name ?? row.server,
        price_usd: row.price_usd,
        updated_at: row.updated_at,
      })
    }
  }

  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}

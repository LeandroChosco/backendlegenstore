import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  if (!key || key !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scraperPath = path.join(process.cwd(), 'scrapers', 'index.js')

  // Fire and forget — responder inmediato antes del timeout de Render (30s)
  // El resultado aparece en los logs del servicio en Render
  exec(`node ${scraperPath}`, { timeout: 180_000, env: process.env }, (error, stdout, stderr) => {
    if (error) console.error('[scrape] FALLÓ:', error.message, '\n', stderr)
    else console.log('[scrape] OK:\n', stdout)
  })

  return NextResponse.json({
    ok: true,
    message: 'Scraper iniciado en background. Revisá los logs en Render → Logs.',
  })
}

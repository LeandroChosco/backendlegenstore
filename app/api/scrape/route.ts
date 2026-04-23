import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

export const runtime = 'nodejs'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  if (!key || key !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scraperPath = path.join(process.cwd(), 'scrapers', 'index.js')

  try {
    const { stdout, stderr } = await execAsync(`node ${scraperPath}`, {
      timeout: 120_000,
      env: process.env,
    })

    return NextResponse.json({
      ok: true,
      output: stdout,
      warnings: stderr || null,
    })
  } catch (error) {
    const err = error as { message: string; stdout?: string; stderr?: string }
    return NextResponse.json({
      ok: false,
      error: err.message,
      output: err.stdout ?? null,
    }, { status: 500 })
  }
}

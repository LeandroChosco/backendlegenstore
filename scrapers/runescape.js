const { upsertPrice } = require('./supabase')

const LISTING_URL = 'https://www.g2g.com/categories/osrs-gold?sort=recommended_v2'

async function runRunescape(browser) {
  console.log('\n[RuneScape] Iniciando scraper...')

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  })
  const page = await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  await context.addCookies([
    { name: 'currency_code', value: 'USD', domain: 'www.g2g.com', path: '/' },
    { name: 'currency',      value: 'USD', domain: 'www.g2g.com', path: '/' },
  ])

  await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(4000)  // esperar que Vue/Quasar renderice el contenido
  await page.waitForSelector('.text-body1.ellipsis-2-lines', { timeout: 30000 })

  const cardHref = await page.evaluate(() => {
    const el = document.querySelector('.text-body1.ellipsis-2-lines span')
    return el?.closest('a')?.href ?? null
  })

  if (!cardHref) throw new Error('No se encontró el card de OSRS en G2G')

  await page.goto(cardHref, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.text-body1.text-weight-medium', { timeout: 15000 })
  await page.waitForTimeout(3000)

  const prices = await page.evaluate(() => {
    return [...document.querySelectorAll('.text-body1.text-weight-medium')]
      .filter(el => el.parentElement?.className?.includes('row') && el.parentElement?.className?.includes('items-end'))
      .slice(0, 5)
      .map(el => parseFloat(el.innerText?.trim()))
      .filter(p => !isNaN(p) && p > 0)
  })

  await context.close()

  if (prices.length === 0) throw new Error('No se encontraron precios de OSRS')

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const price_usd = parseFloat(avg.toFixed(6))

  console.log(`  Precios top ${prices.length}: [${prices.join(', ')}] → promedio: $${price_usd}`)

  await upsertPrice({
    game: 'runescape',
    server: 'OSRS Gold',
    region: 'Global',
    price_usd,
    raw_data: { prices, count: prices.length, source: 'g2g.com' },
  })

  console.log('[RuneScape] Completado.')
}

module.exports = { runRunescape }

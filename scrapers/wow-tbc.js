const { upsertPrice } = require('./supabase')

const LISTING_URL =
  'https://www.g2g.com/categories/wow-classic-era-vanilla-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&sort=recommended_v2'

const TARGETS = [
  'Nightslayer [US - Anniversary] - Horde',
  'Nightslayer [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Horde',
]

async function scrapeVendorPrices(page, serverName) {
  console.log(`  Entrando a card: ${serverName}`)

  // Navegar a la lista y esperar que los cards se rendericen
  await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.text-body1.ellipsis-2-lines', { timeout: 15000 })

  // Scrollear para disparar lazy loading de cards que estén abajo del fold
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1000)

  // Obtener el href del link del card para navegar directo (más confiable en headless)
  const cardHref = await page.evaluate((target) => {
    const spans = [...document.querySelectorAll('span')]
    const span = spans.find(s => s.innerText?.trim() === target)
    const link = span?.closest('a')
    return link?.href ?? null
  }, serverName)

  if (!cardHref) throw new Error(`No se encontró el link del card para ${serverName}`)

  console.log(`  Navegando a: ${cardHref.slice(0, 80)}...`)
  await page.goto(cardHref, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Esperar que aparezca la sección de vendedores
  await page.waitForSelector('.text-body1.text-weight-medium', { timeout: 15000 })
  await page.waitForTimeout(3000)

  // Extraer los primeros 5 precios de la tabla de vendedores
  const prices = await page.evaluate(() => {
    const priceEls = [...document.querySelectorAll('.text-body1.text-weight-medium')]
      .filter(el => {
        const parent = el.parentElement
        return parent?.className?.includes('row') && parent?.className?.includes('items-end')
      })
      .slice(0, 5)
      .map(el => parseFloat(el.innerText?.trim()))
      .filter(p => !isNaN(p) && p > 0)
    return priceEls
  })

  if (prices.length === 0) throw new Error(`No se encontraron precios para ${serverName}`)

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  console.log(`  Precios: [${prices.join(', ')}] → promedio: $${avg.toFixed(6)}`)

  return {
    price_usd: parseFloat(avg.toFixed(6)),
    raw_data: { prices, count: prices.length, source: 'g2g.com' },
  }
}

async function runWowTbc(browser) {
  console.log('\n[WoW TBC] Iniciando scraper...')
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  })
  const page = await context.newPage()

  // Ocultar webdriver flag
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  // Forzar moneda USD independiente del IP del servidor
  await context.addCookies([
    { name: 'currency_code', value: 'USD', domain: 'www.g2g.com', path: '/' },
    { name: 'currency',      value: 'USD', domain: 'www.g2g.com', path: '/' },
  ])

  for (const server of TARGETS) {
    try {
      const { price_usd, raw_data } = await scrapeVendorPrices(page, server)
      await upsertPrice({ game: 'wow_tbc', server, region: 'US', price_usd, raw_data })
    } catch (err) {
      console.error(`  [ERROR] ${server}: ${err.message}`)
    }
  }

  await context.close()
  console.log('[WoW TBC] Completado.')
}

module.exports = { runWowTbc }

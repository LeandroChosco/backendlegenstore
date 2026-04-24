const { upsertPrice } = require('./supabase')
const https = require('https')

function getEurUsdRate() {
  return new Promise((resolve) => {
    https.get('https://open.er-api.com/v6/latest/EUR', (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data).rates?.USD ?? 1.08) }
        catch { resolve(1.08) }
      })
    }).on('error', () => resolve(1.08))
  })
}

const LISTING_URL =
  'https://www.g2g.com/categories/wow-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&fa=lgc_2299_platform%3Algc_2299_platform_39978,lgc_2299_platform_39980,lgc_2299_platform_39982,lgc_2299_platform_39984,lgc_2299_platform_39986,lgc_2299_platform_39988'

async function runWowMidnight(browser) {
  console.log('\n[WoW Midnight] Iniciando scraper...')
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  })
  const page = await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  // Forzar moneda USD independiente del IP del servidor
  await context.addCookies([
    { name: 'currency_code', value: 'USD', domain: 'www.g2g.com', path: '/' },
    { name: 'currency',      value: 'USD', domain: 'www.g2g.com', path: '/' },
  ])

  await page.goto(LISTING_URL + '&currency=USD', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.text-body1.ellipsis-2-lines', { timeout: 15000 })
  await page.waitForTimeout(3000)

  // Extraer los primeros 4 cards: título + precio buscando dentro del mismo card
  const cards = await page.evaluate(() => {
    const titleEls = [...document.querySelectorAll('.text-body1.ellipsis-2-lines span')]
    const results = []

    for (let i = 0; i < 4; i++) {
      const titleEl = titleEls[i]
      if (!titleEl) break

      const title = titleEl.innerText?.trim()
      const card = titleEl.closest('a') || titleEl.closest('article') || titleEl.parentElement?.parentElement?.parentElement
      const priceSpan = card
        ? [...card.querySelectorAll('span')].find(
            el => /^\d+\.\d+$/.test(el.innerText?.trim()) && el.children.length === 0
          )
        : null

      const price = parseFloat(priceSpan?.innerText?.trim() ?? '')
      const spans = card ? [...card.querySelectorAll('span')].map(s => s.innerText?.trim()) : []
      const currency = spans.find(s => /^(USD|EUR|GBP)$/.test(s)) ?? 'USD'
      if (title && !isNaN(price)) results.push({ title, price, currency })
    }
    return results
  })

  if (cards.length === 0) {
    console.error('  [ERROR] No se encontraron cards de WoW Midnight')
    await page.close()
    return
  }

  console.log(`  Cards encontrados: ${cards.length}`)

  const detectedCurrency = cards[0]?.currency ?? 'USD'
  let eurUsd = 1
  if (detectedCurrency === 'EUR') {
    eurUsd = await getEurUsdRate()
    console.log(`  [INFO] Moneda detectada: EUR → convirtiendo a USD (tasa: ${eurUsd.toFixed(4)})`)
  }

  for (let i = 0; i < cards.length; i++) {
    const { title, price, currency } = cards[i]
    const rawUsd = currency === 'EUR' ? price * eurUsd : price
    const priceUsd = parseFloat(rawUsd.toFixed(6))
    const server = `card_${i + 1}`
    console.log(`  ${server}: ${title} → $${priceUsd}`)

    try {
      await upsertPrice({
        game: 'wow_midnight',
        server,
        region: 'US',
        price_usd: priceUsd,
        raw_data: { server_name: title, source: 'g2g.com' },
      })
    } catch (err) {
      console.error(`  [ERROR] card_${i + 1}: ${err.message}`)
    }
  }

  await context.close()
  console.log('[WoW Midnight] Completado.')
}

module.exports = { runWowMidnight }

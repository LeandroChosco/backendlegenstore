require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { chromium } = require('playwright')
const { runWowTbc } = require('./wow-tbc')
const { runWowMidnight } = require('./wow-midnight')
const { runRunescape } = require('./runescape')

async function runAll() {
  const startTime = Date.now()
  console.log(`\n========================================`)
  console.log(`Scraper iniciado: ${new Date().toISOString()}`)
  console.log(`========================================`)

  // Todos los scrapers comparten una instancia de Chrome
  let browser
  try {
    console.log('\nIniciando Chrome (headless)...')
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })

    await runRunescape(browser)
    await runWowTbc(browser)
    await runWowMidnight(browser)

  } catch (err) {
    console.error('[Browser] Error crítico:', err.message)
  } finally {
    if (browser) await browser.close()
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n========================================`)
  console.log(`Scraper finalizado en ${elapsed}s`)
  console.log(`========================================\n`)
}

runAll()

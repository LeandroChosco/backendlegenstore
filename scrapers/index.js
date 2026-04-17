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

  // RuneScape no necesita browser — corre primero
  try {
    await runRunescape()
  } catch (err) {
    console.error('[RuneScape] FALLÓ:', err.message)
  }

  // WoW scrapers comparten una instancia de Chromium
  let browser
  try {
    console.log('\nIniciando Chromium (headless)...')
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })

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

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { chromium } = require('playwright-extra')
const stealth = require('puppeteer-extra-plugin-stealth')
chromium.use(stealth())
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
      ],
    })

    const scrapers = [
      { name: 'RuneScape',    fn: runRunescape },
      { name: 'WoW TBC',     fn: runWowTbc    },
      { name: 'WoW Midnight', fn: runWowMidnight },
    ]

    for (const { name, fn } of scrapers) {
      try {
        await fn(browser)
      } catch (err) {
        console.error(`[${name}] FALLÓ: ${err.message}`)
      }
    }

  } catch (err) {
    console.error('[Browser] Error crítico al lanzar Chrome:', err.message)
  } finally {
    if (browser) await browser.close()
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n========================================`)
  console.log(`Scraper finalizado en ${elapsed}s`)
  console.log(`========================================\n`)
}

runAll()

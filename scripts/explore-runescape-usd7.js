const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })

  // Emular locale y timezone de US
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.0060 }, // New York
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  const page = await context.newPage()

  console.log('Cargando con locale en-US...')
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  await page.screenshot({ path: 'scripts/usd7-loaded.png' })

  const result = await page.evaluate(() => {
    const currency = document.querySelector('.locale-currency-button')?.innerText?.trim()
    const all = [...document.querySelectorAll('*')]

    const priceEl = all.find(el =>
      /^\$\d+\.\d+\s*\/\s*M$/.test(el.innerText?.trim()) && el.children.length === 0
    )

    // También buscar precios en formato general
    const anyPrices = all
      .filter(el => /\$\d+\.\d+/.test(el.innerText?.trim()) && el.children.length <= 1)
      .slice(0, 5)
      .map(el => ({ text: el.innerText.trim(), class: el.className }))

    return { currency, price: priceEl?.innerText?.trim(), anyPrices }
  })

  console.log('\n=== RESULTADO ===')
  console.log(JSON.stringify(result, null, 2))

  await browser.close()
})()

const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })
  const page = await context.newPage()

  // 1. Cargar la página
  console.log('Cargando página...')
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)

  // 2. Setear locale_currency y recargar
  console.log('Seteando USD en localStorage...')
  await page.evaluate(() => {
    localStorage.setItem('locale_currency', 'USD')
    localStorage.setItem('selectedCurrency', 'USD')
    localStorage.setItem('currency', 'USD')
    localStorage.setItem('eld_currency', 'USD')
  })

  console.log('Recargando página con USD...')
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  await page.screenshot({ path: 'scripts/usd5-reloaded.png' })

  // 3. Verificar moneda y precio
  const result = await page.evaluate(() => {
    const currencyBtn = document.querySelector('.locale-currency-button')
    const all = [...document.querySelectorAll('*')]
    const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    const priceContainer = label?.parentElement

    // Buscar precio con selector específico
    const priceEl = all.find(el =>
      /^\$\d+\.\d+\s*\/\s*M$/.test(el.innerText?.trim()) && el.children.length === 0
    )

    return {
      currency: currencyBtn?.innerText?.trim(),
      priceContainerText: priceContainer?.innerText?.replace(/\n/g, ' | '),
      priceElText: priceEl?.innerText?.trim(),
      priceElClass: priceEl?.className,
      priceElParentClass: priceEl?.parentElement?.className,
    }
  })

  console.log('\n=== RESULTADO ===')
  console.log(JSON.stringify(result, null, 2))

  await browser.close()
})()

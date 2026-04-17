const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })
  const page = await context.newPage()

  // Primero cargar el dominio para poder escribir localStorage
  await page.goto('https://www.eldorado.gg', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Ver qué hay en localStorage relacionado a currency
  console.log('\n=== LOCALSTORAGE KEYS ===')
  const lsKeys = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const result = {}
    keys.forEach(k => { result[k] = localStorage.getItem(k) })
    return result
  })
  console.log(JSON.stringify(lsKeys, null, 2))

  // Ver cookies relacionadas a currency/locale
  console.log('\n=== COOKIES ===')
  const cookies = await context.cookies()
  const relevantCookies = cookies.filter(c =>
    /currency|locale|lang|region/i.test(c.name)
  )
  console.log(JSON.stringify(relevantCookies, null, 2))

  // Intentar forzar USD via localStorage con las keys comunes de Angular/eldorado
  await page.evaluate(() => {
    // Intentar varias keys posibles
    localStorage.setItem('currency', 'USD')
    localStorage.setItem('selectedCurrency', 'USD')
    localStorage.setItem('locale_currency', 'USD')
    localStorage.setItem('eld_currency', 'USD')
    // Buscar y modificar la key real si existe
    Object.keys(localStorage).forEach(k => {
      const val = localStorage.getItem(k)
      if (val && (val.includes('MXN') || val.includes('currency'))) {
        console.log(`Found key: ${k} = ${val}`)
      }
    })
  })

  // Navegar a la página de OSRS
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  await page.screenshot({ path: 'scripts/usd4-after-ls.png' })

  // Ver qué moneda muestra ahora
  const currencyNow = await page.evaluate(() => {
    const btn = document.querySelector('.locale-currency-button')
    return btn?.innerText?.trim()
  })
  console.log('\nMoneda actual:', currencyNow)

  // Precio actual
  const priceNow = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    return all
      .filter(el => /\$\d+\.\d+/.test(el.innerText?.trim()) && el.children.length <= 1)
      .slice(0, 5)
      .map(el => ({ text: el.innerText.trim(), class: el.className }))
  })
  console.log('\nPrecios encontrados:', JSON.stringify(priceNow, null, 2))

  // Dump LS después de cargar la página real (para ver la key correcta)
  console.log('\n=== LOCALSTORAGE DESPUÉS DE CARGAR ===')
  const lsAfter = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const result = {}
    keys.forEach(k => { result[k] = localStorage.getItem(k) })
    return result
  })
  console.log(JSON.stringify(lsAfter, null, 2))

  await browser.close()
})()

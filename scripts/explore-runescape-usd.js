const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // Precio actual antes de cambiar
  console.log('\n=== PRECIO ACTUAL (antes de cambiar moneda) ===')
  const priceBefore = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    const container = label?.closest('[class]')
    return container?.innerText?.replace(/\n/g, ' | ')
  })
  console.log(priceBefore)

  // Buscar el selector de moneda
  console.log('\n=== BUSCANDO SELECTOR DE MONEDA ===')
  const currencySelector = await page.evaluate(() => {
    const all = [...document.querySelectorAll('select, [class*="currency"], [class*="Currency"]')]
    return all.slice(0, 10).map(el => ({
      tag: el.tagName,
      class: el.className,
      text: el.innerText?.trim().slice(0, 100),
      value: el.value ?? null,
      options: el.tagName === 'SELECT'
        ? [...el.options].map(o => ({ value: o.value, text: o.text }))
        : null,
    }))
  })
  console.log(JSON.stringify(currencySelector, null, 2))

  // Buscar dropdowns con USD/monedas
  console.log('\n=== DROPDOWNS CON OPCIONES DE MONEDA ===')
  const dropdowns = await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select')]
    const withCurrency = selects.filter(s =>
      [...s.options].some(o => o.text.includes('USD') || o.text.includes('$') || o.value.toLowerCase().includes('usd'))
    )
    return withCurrency.map(s => ({
      class: s.className,
      id: s.id,
      currentValue: s.value,
      options: [...s.options].map(o => ({ value: o.value, text: o.text })),
    }))
  })
  console.log(JSON.stringify(dropdowns, null, 2))

  // Buscar cualquier elemento clickeable que mencione moneda/currency
  console.log('\n=== ELEMENTOS CLICKEABLES CON MONEDA ===')
  const currencyButtons = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role="listbox"], [role="combobox"], [class*="dropdown"]')]
    return all
      .filter(el => {
        const text = el.innerText?.trim() ?? ''
        return text.match(/USD|EUR|MXN|\$|€|currency/i)
      })
      .slice(0, 8)
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.innerText?.trim().slice(0, 80),
        role: el.getAttribute('role'),
      }))
  })
  console.log(JSON.stringify(currencyButtons, null, 2))

  // Si encontramos un selector, intentar cambiarlo a USD
  console.log('\n=== INTENTANDO CAMBIAR A USD ===')
  try {
    // Buscar el dropdown de moneda en el header/navbar
    const currencyDropdown = page.locator('select').filter({ hasText: /USD|EUR|MXN/ }).first()
    const count = await currencyDropdown.count()

    if (count > 0) {
      await currencyDropdown.selectOption('USD')
      await page.waitForTimeout(2000)
      console.log('Cambiado a USD via select')
    } else {
      // Intentar buscar por aria-label o placeholder
      const currencyLocator = page.locator('[aria-label*="currency" i], [placeholder*="currency" i], [class*="currency-selector" i]').first()
      const count2 = await currencyLocator.count()
      if (count2 > 0) {
        await currencyLocator.click()
        await page.waitForTimeout(1000)
        console.log('Dropdown de currency abierto')
        await page.screenshot({ path: 'scripts/eldorado-currency-open.png' })
      } else {
        console.log('No se encontró selector de moneda standard, buscando en header...')
        // Dump del header para encontrar selector
        const headerText = await page.evaluate(() => {
          const header = document.querySelector('header, nav, [class*="header"], [class*="navbar"]')
          return header?.innerText?.slice(0, 500) + '\n\n' + header?.outerHTML?.slice(0, 1000)
        })
        console.log(headerText)
      }
    }
  } catch (e) {
    console.log('Error al cambiar moneda:', e.message)
  }

  // Precio después del cambio (si funcionó)
  const priceAfter = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    const container = label?.closest('[class]')
    return container?.innerText?.replace(/\n/g, ' | ')
  })
  console.log('\n=== PRECIO DESPUÉS ===', priceAfter)

  await page.screenshot({ path: 'scripts/eldorado-usd-screenshot.png' })
  console.log('\nScreenshot: scripts/eldorado-usd-screenshot.png')

  await browser.close()
})()

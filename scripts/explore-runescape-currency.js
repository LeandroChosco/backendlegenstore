const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // Click en el botón de moneda (locale-currency-button)
  console.log('Haciendo click en locale-currency-button...')
  await page.click('.locale-currency-button')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'scripts/eldorado-currency-dropdown.png', fullPage: false })
  console.log('Screenshot con dropdown abierto: scripts/eldorado-currency-dropdown.png')

  // Ver qué apareció después del click
  console.log('\n=== HTML DEL DROPDOWN DE MONEDA ===')
  const dropdownHTML = await page.evaluate(() => {
    const btn = document.querySelector('.locale-currency-button')
    const parent = btn?.parentElement?.parentElement
    return {
      btnParentHTML: parent?.outerHTML?.slice(0, 2000),
      fullText: parent?.innerText?.replace(/\n/g, ' | ').slice(0, 500),
    }
  })
  console.log(JSON.stringify(dropdownHTML, null, 2))

  // Buscar opciones de moneda visibles
  console.log('\n=== OPCIONES DE MONEDA VISIBLES ===')
  const options = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    return all
      .filter(el => el.innerText?.match(/USD|EUR|GBP|MXN/) && el.children.length <= 3 && el.clientHeight > 0)
      .slice(0, 15)
      .map(el => ({
        text: el.innerText?.trim().slice(0, 60),
        tag: el.tagName,
        class: el.className,
        visible: el.offsetParent !== null,
      }))
  })
  console.log(JSON.stringify(options, null, 2))

  // Intentar seleccionar USD
  console.log('\n=== INTENTANDO SELECCIONAR USD ===')
  try {
    const usdOption = page.locator('text=USD').first()
    const count = await usdOption.count()
    if (count > 0) {
      await usdOption.click()
      await page.waitForTimeout(2000)
      console.log('USD seleccionado')

      const priceUSD = await page.evaluate(() => {
        const all = [...document.querySelectorAll('*')]
        const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
        const container = label?.parentElement
        return container?.innerText?.replace(/\n/g, ' | ')
      })
      console.log('Precio en USD:', priceUSD)
    } else {
      console.log('Opción USD no visible aún')
    }
  } catch (e) {
    console.log('Error:', e.message)
  }

  await page.screenshot({ path: 'scripts/eldorado-after-usd.png', fullPage: false })
  console.log('Screenshot final guardado')

  await browser.close()
})()

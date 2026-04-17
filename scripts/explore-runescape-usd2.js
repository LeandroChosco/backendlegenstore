const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // 1. Abrir el modal de currency
  console.log('Abriendo modal de currency...')
  await page.click('.locale-currency-button')
  await page.waitForSelector('dialog[open]', { timeout: 5000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'scripts/step1-modal-open.png' })

  // 2. Ver el HTML del dialog para entender qué hay adentro
  console.log('\n=== HTML DEL DIALOG ===')
  const dialogHTML = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    return dialog?.outerHTML?.slice(0, 3000)
  })
  console.log(dialogHTML)

  // 3. Clickear el dropdown-trigger (combobox de currency) dentro del dialog
  console.log('\nClickeando el combobox dentro del dialog...')
  const combobox = page.locator('dialog[open] [role="combobox"]').first()
  await combobox.click({ force: true })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'scripts/step2-combobox-open.png' })

  // 4. Ver opciones disponibles
  console.log('\n=== OPCIONES DEL DROPDOWN ===')
  const options = await page.evaluate(() => {
    const listbox = document.querySelector('[role="listbox"], [role="option"]')
    const all = [...document.querySelectorAll('[role="option"], .dropdown-option, .ng-option')]
    return all.slice(0, 20).map(el => ({
      text: el.innerText?.trim().slice(0, 50),
      class: el.className,
      role: el.getAttribute('role'),
    }))
  })
  console.log(JSON.stringify(options, null, 2))

  // 5. Buscar y clickear USD
  console.log('\nBuscando opción USD...')
  const usdOption = page.locator('dialog[open]').locator('text=USD').first()
  const usdCount = await usdOption.count()
  console.log('Opciones con texto USD encontradas:', usdCount)

  if (usdCount > 0) {
    await usdOption.click({ force: true })
    await page.waitForTimeout(2000)
    console.log('USD seleccionado')
  } else {
    // Intentar escribir USD en el search del combobox
    console.log('Intentando escribir USD en el search...')
    await page.keyboard.type('USD')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'scripts/step3-search-usd.png' })

    const usdFiltered = page.locator('dialog[open] [role="option"]').filter({ hasText: 'USD' }).first()
    const count2 = await usdFiltered.count()
    if (count2 > 0) {
      await usdFiltered.click({ force: true })
      await page.waitForTimeout(2000)
      console.log('USD seleccionado via search')
    }
  }

  // 6. Confirmar (si hay botón Save/Apply)
  console.log('\nBuscando botón de confirmación...')
  const saveBtn = page.locator('dialog[open]').locator('button').filter({ hasText: /save|apply|confirm|ok|aceptar/i }).first()
  const saveBtnCount = await saveBtn.count()
  if (saveBtnCount > 0) {
    await saveBtn.click()
    await page.waitForTimeout(2000)
    console.log('Confirmado')
  }

  // 7. Precio final
  await page.screenshot({ path: 'scripts/step4-price-usd.png' })
  const priceUSD = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    const container = label?.parentElement
    return container?.innerText?.replace(/\n/g, ' | ')
  })
  console.log('\n=== PRECIO FINAL ===', priceUSD)

  await browser.close()
})()

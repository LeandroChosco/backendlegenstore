const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })

  console.log('Navegando...')
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  // 1. Abrir modal via JS directo (bypass pointer-events)
  console.log('Abriendo modal de currency via JS...')
  await page.evaluate(() => {
    const btn = document.querySelector('.locale-currency-button')
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'scripts/usd3-step1-modal.png' })

  // 2. Dump del dialog
  const dialogContent = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    return {
      exists: !!dialog,
      text: dialog?.innerText?.replace(/\n/g, ' | ').slice(0, 400),
      html: dialog?.outerHTML?.slice(0, 2000),
    }
  })
  console.log('\n=== DIALOG ===')
  console.log('Existe:', dialogContent.exists)
  console.log('Texto:', dialogContent.text)

  if (!dialogContent.exists) {
    console.log('Dialog no abrió, revisá el screenshot step1')
    await browser.close()
    return
  }

  // 3. Clickear el SEGUNDO combobox (currency) via JS
  console.log('\nClickeando segundo combobox (currency) via JS...')
  await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    const comboboxes = dialog?.querySelectorAll('[role="combobox"], .dropdown-trigger')
    console.log('Comboboxes encontrados:', comboboxes?.length)
    const currencyCombobox = comboboxes?.[1] ?? comboboxes?.[0]
    currencyCombobox?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'scripts/usd3-step2-combobox.png' })

  // 4. Ver opciones disponibles — dump completo
  console.log('\n=== OPCIONES VISIBLES (role=option) ===')
  const options = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[role="option"]')]
    return all.slice(0, 20).map(el => ({
      text: el.innerText?.trim().slice(0, 60),
      class: el.className,
    }))
  })
  console.log(JSON.stringify(options, null, 2))

  // Buscar con otros selectores si role=option no dio resultados
  if (options.length === 0) {
    console.log('\n=== FALLBACK: buscando opciones por otros selectores ===')
    const fallback = await page.evaluate(() => {
      const candidates = [
        ...document.querySelectorAll('.ng-option, .dropdown-item, li[class*="option"], [class*="list-item"]')
      ]
      return candidates.slice(0, 20).map(el => ({
        text: el.innerText?.trim().slice(0, 60),
        class: el.className,
        tag: el.tagName,
      }))
    })
    console.log(JSON.stringify(fallback, null, 2))
  }

  // 5. Buscar input de búsqueda dentro del dropdown y escribir USD
  console.log('\nBuscando input de búsqueda en el dropdown...')
  const searchInput = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    const inputs = [...(dialog?.querySelectorAll('input') ?? [])]
    return inputs.map(i => ({ class: i.className, placeholder: i.placeholder, type: i.type }))
  })
  console.log('Inputs en dialog:', JSON.stringify(searchInput))

  // Escribir USD en el input de búsqueda del dropdown
  const inputLocator = page.locator('dialog[open] input').last()
  const inputCount = await inputLocator.count()
  if (inputCount > 0) {
    await inputLocator.fill('USD', { force: true })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'scripts/usd3-step2b-typed.png' })
  }

  // 6. Ahora sí buscar USD en las opciones filtradas
  console.log('\nSeleccionando USD via JS...')
  const usdClicked = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.dropdown-option, [role="option"]')]
    const usd = opts.find(el => el.innerText?.trim().startsWith('USD'))
    if (usd) {
      usd.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return `Clickeado: ${usd.innerText.trim()}`
    }
    // Dump de lo que quedó tras filtrar
    return 'No encontrado. Opciones visibles: ' + opts.map(o => o.innerText?.trim()).join(', ')
  })
  console.log('Resultado:', usdClicked)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'scripts/usd3-step3-after-usd.png' })

  // 6. Buscar botón Save/Confirm dentro del dialog y clickear
  console.log('\nBuscando botón de confirmación...')
  const saved = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    const btns = [...(dialog?.querySelectorAll('button') ?? [])]
    const saveBtn = btns.find(b => /save|apply|confirm|done|ok|aceptar/i.test(b.innerText))
    if (saveBtn) {
      saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return saveBtn.innerText.trim()
    }
    // Si no hay botón, listar todos los botones del dialog
    return btns.map(b => b.innerText?.trim()).join(' | ')
  })
  console.log('Botones dialog:', saved)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'scripts/usd3-step4-final.png' })

  // 7. Precio final
  const priceInfo = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    const label = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    const container = label?.parentElement?.parentElement
    return {
      currency: document.querySelector('.locale-currency-button')?.innerText?.trim(),
      priceContainer: container?.innerText?.replace(/\n/g, ' | '),
      priceElement: [...document.querySelectorAll('*')]
        .filter(el => /\$\d+\.\d+/.test(el.innerText?.trim()) && el.children.length <= 1)
        .slice(0, 5)
        .map(el => ({ text: el.innerText.trim(), class: el.className })),
    }
  })
  console.log('\n=== PRECIO FINAL ===')
  console.log(JSON.stringify(priceInfo, null, 2))

  await browser.close()
})()

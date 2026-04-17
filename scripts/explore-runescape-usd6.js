const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })
  const page = await context.newPage()

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)

  // 1. Abrir modal
  await page.evaluate(() => {
    document.querySelector('.locale-currency-button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForSelector('dialog[open]', { timeout: 5000 })
  await page.waitForTimeout(1500)

  // 2. Click en el segundo combobox (currency) con force
  const comboboxes = page.locator('dialog[open] [role="combobox"]')
  const count = await comboboxes.count()
  console.log('Comboboxes en dialog:', count)

  const currencyCombobox = comboboxes.nth(1)
  await currencyCombobox.click({ force: true })
  await page.waitForTimeout(1000)

  // 3. Escribir USD directamente en el combobox (es searchable)
  console.log('Escribiendo USD...')
  await page.keyboard.type('USD')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'scripts/usd6-typed.png' })

  // 4. Opciones filtradas
  const filteredOptions = await page.evaluate(() => {
    return [...document.querySelectorAll('.dropdown-option')]
      .map(el => ({ text: el.innerText.trim(), class: el.className }))
  })
  console.log('Opciones filtradas:', JSON.stringify(filteredOptions, null, 2))

  // 5. Click en USD
  const usdOpt = page.locator('.dropdown-option').filter({ hasText: /^USD/ }).first()
  const usdCount = await usdOpt.count()
  console.log('Opciones USD visibles:', usdCount)

  if (usdCount > 0) {
    await usdOpt.click({ force: true })
    console.log('USD clickeado')
  } else {
    // Intentar via JS
    await page.evaluate(() => {
      const opt = [...document.querySelectorAll('.dropdown-option')].find(el => el.innerText.trim().startsWith('USD'))
      opt?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }
  await page.waitForTimeout(1000)

  // 6. Click Save
  console.log('Clickeando Save...')
  await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')
    const btns = [...(dialog?.querySelectorAll('button') ?? [])]
    const save = btns.find(b => /save/i.test(b.innerText))
    save?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'scripts/usd6-saved.png' })

  // 7. Precio final
  const result = await page.evaluate(() => {
    const currency = document.querySelector('.locale-currency-button')?.innerText?.trim()
    const all = [...document.querySelectorAll('*')]
    const priceEl = all.find(el =>
      /^\$\d+\.\d+\s*\/\s*M$/.test(el.innerText?.trim()) && el.children.length === 0
    )
    return {
      currency,
      price: priceEl?.innerText?.trim(),
      priceClass: priceEl?.className,
      priceParentClass: priceEl?.parentElement?.className,
    }
  })
  console.log('\n=== PRECIO EN USD ===')
  console.log(JSON.stringify(result, null, 2))

  await browser.close()
})()

const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  console.log('Navegando a eldorado.gg...')
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // Buscar el elemento "Price" y su valor
  console.log('\n=== BUSCANDO ELEMENTO PRICE ===')
  const priceInfo = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]

    // Buscar el label "Price"
    const priceLabel = all.find(el =>
      el.innerText?.trim() === 'Price' && el.children.length === 0
    )

    if (!priceLabel) {
      // Fallback: buscar el valor de precio directamente
      const priceVal = all.find(el => /^\$\d+\.\d+\s*\/\s*M$/.test(el.innerText?.trim()))
      return { found: false, priceVal: priceVal?.innerText?.trim(), priceValClass: priceVal?.className }
    }

    const container = priceLabel.closest('[class]')
    const parent = container?.parentElement

    return {
      found: true,
      labelTag: priceLabel.tagName,
      labelClass: priceLabel.className,
      containerClass: container?.className,
      containerText: container?.innerText?.replace(/\n/g, ' | '),
      parentClass: parent?.className,
      parentHTML: parent?.outerHTML?.slice(0, 800),
    }
  })
  console.log(JSON.stringify(priceInfo, null, 2))

  // Buscar todos los elementos con formato de precio $X.XXXX / M
  console.log('\n=== TODOS LOS PRECIOS $X.XX / M ===')
  const prices = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    return all
      .filter(el => /\$\d+\.\d+/.test(el.innerText?.trim()) && el.children.length <= 2)
      .slice(0, 8)
      .map(el => ({
        text: el.innerText?.trim(),
        tag: el.tagName,
        class: el.className,
        parentClass: el.parentElement?.className,
        grandparentClass: el.parentElement?.parentElement?.className,
      }))
  })
  console.log(JSON.stringify(prices, null, 2))

  // HTML del card completo que contiene "Price"
  console.log('\n=== HTML DEL CARD CON PRICE ===')
  const cardHTML = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    const priceLabel = all.find(el => el.innerText?.trim() === 'Price' && el.children.length === 0)
    let card = priceLabel
    for (let i = 0; i < 6; i++) {
      card = card?.parentElement
      if (card && card.clientHeight > 200) break
    }
    return card?.outerHTML?.slice(0, 2000)
  })
  console.log(cardHTML)

  await page.screenshot({ path: 'scripts/eldorado-screenshot.png' })
  console.log('\nScreenshot: scripts/eldorado-screenshot.png')

  await browser.close()
})()

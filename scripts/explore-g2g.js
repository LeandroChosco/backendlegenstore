const { chromium } = require('playwright')

const TARGET_URL =
  'https://www.g2g.com/categories/wow-classic-era-vanilla-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&sort=recommended_v2'

const TARGETS = [
  'Nightslayer [US - Anniversary] - Horde',
  'Nightslayer [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Horde',
]

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  console.log('Navegando a g2g.com...')
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // --- Dump general: clases de los primeros contenedores ---
  console.log('\n=== ESTRUCTURA GENERAL (primeros niveles) ===')
  const bodyHTML = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="product"], [class*="item"], [class*="offer"]')
    const result = []
    cards.forEach((el, i) => {
      if (i < 10) {
        result.push({
          tag: el.tagName,
          classes: el.className,
          text: el.innerText?.slice(0, 120).replace(/\n/g, ' '),
        })
      }
    })
    return result
  })
  console.log(JSON.stringify(bodyHTML, null, 2))

  // --- Buscar los 4 targets por texto ---
  console.log('\n=== BUSCANDO LOS 4 LISTINGS TARGET ===')
  const found = await page.evaluate((targets) => {
    const results = []
    const allElements = document.querySelectorAll('*')

    for (const el of allElements) {
      for (const target of targets) {
        if (el.innerText?.trim() === target && el.children.length === 0) {
          const parent = el.closest('[class]')
          const grandparent = parent?.parentElement?.closest('[class]')
          results.push({
            target,
            tag: el.tagName,
            class: el.className,
            parentTag: parent?.tagName,
            parentClass: parent?.className,
            grandparentClass: grandparent?.className,
            cardHTML: grandparent?.outerHTML?.slice(0, 600),
          })
        }
      }
    }
    return results
  }, TARGETS)

  console.log(JSON.stringify(found, null, 2))

  // --- Extraer precio de cada uno ---
  console.log('\n=== PRECIOS ENCONTRADOS ===')
  const prices = await page.evaluate((targets) => {
    const results = []
    const allText = document.querySelectorAll('*')

    for (const el of allText) {
      for (const target of targets) {
        if (el.innerText?.trim() === target && el.children.length === 0) {
          const card = el.closest('[class*="card"], [class*="item"], [class*="product"], li, [class*="listing"]')
          if (card) {
            const priceEl = card.querySelector('[class*="price"], [class*="amount"], [class*="value"]')
            results.push({
              server: target,
              price: priceEl?.innerText?.trim() ?? 'NO ENCONTRADO',
              priceClass: priceEl?.className,
              fullCardText: card.innerText?.slice(0, 200).replace(/\n/g, ' | '),
            })
          }
        }
      }
    }
    return results
  }, TARGETS)

  console.log(JSON.stringify(prices, null, 2))

  // --- Screenshot para ver qué cargó ---
  await page.screenshot({ path: 'scripts/g2g-screenshot.png', fullPage: false })
  console.log('\nScreenshot guardado en scripts/g2g-screenshot.png')

  await browser.close()
})()

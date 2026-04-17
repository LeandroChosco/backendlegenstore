const { chromium } = require('playwright')

const TARGET_URL =
  'https://www.g2g.com/categories/wow-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&fa=lgc_2299_platform%3Algc_2299_platform_39978,lgc_2299_platform_39980,lgc_2299_platform_39982,lgc_2299_platform_39984,lgc_2299_platform_39986,lgc_2299_platform_39988'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  console.log('Navegando a WoW Midnight...')
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // --- Extraer los primeros 4 cards con título y precio ---
  console.log('\n=== PRIMEROS 4 CARDS ===')
  const cards = await page.evaluate(() => {
    const priceEls = [...document.querySelectorAll('.text-font-default.q-mr-xs')]
    const results = []

    for (const priceEl of priceEls) {
      const card = priceEl.closest('[class*="col"], [class*="card"], [class*="item"]')
      const titleEl = card?.querySelector('.text-body1.ellipsis-2-lines span, [class*="ellipsis"] span')
      const offersEl = [...(card?.querySelectorAll('span') ?? [])].find(el =>
        el.innerText?.includes('ofertas')
      )

      results.push({
        title: titleEl?.innerText?.trim() ?? 'NO ENCONTRADO',
        price: priceEl?.innerText?.trim(),
        currency: priceEl?.nextElementSibling?.innerText?.trim(),
        offers: offersEl?.innerText?.trim(),
        priceClass: priceEl?.className,
        parentClass: priceEl?.parentElement?.className,
      })

      if (results.length === 4) break
    }

    return results
  })
  console.log(JSON.stringify(cards, null, 2))

  // --- Confirmar que la estructura de clases es la misma ---
  console.log('\n=== VERIFICACIÓN DE ESTRUCTURA (mismas clases que TBC?) ===')
  const structureCheck = await page.evaluate(() => {
    return {
      hasTitleClass: !!document.querySelector('.text-body1.ellipsis-2-lines'),
      hasPriceClass: !!document.querySelector('.text-font-default.q-mr-xs'),
      hasCardContainer: !!document.querySelector('[data-v-61390112]'),
      firstFourTitles: [...document.querySelectorAll('.text-body1.ellipsis-2-lines span')]
        .slice(0, 4)
        .map(el => el.innerText?.trim()),
      firstFourPrices: [...document.querySelectorAll('.text-font-default.q-mr-xs')]
        .slice(0, 4)
        .map(el => el.innerText?.trim()),
    }
  })
  console.log(JSON.stringify(structureCheck, null, 2))

  await page.screenshot({ path: 'scripts/g2g-midnight-screenshot.png' })
  console.log('\nScreenshot guardado: scripts/g2g-midnight-screenshot.png')

  await browser.close()
  console.log('Exploración completada.')
})()

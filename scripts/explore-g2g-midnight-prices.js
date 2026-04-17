const { chromium } = require('playwright')

const TARGET_URL =
  'https://www.g2g.com/categories/wow-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&fa=lgc_2299_platform%3Algc_2299_platform_39978,lgc_2299_platform_39980,lgc_2299_platform_39982,lgc_2299_platform_39984,lgc_2299_platform_39986,lgc_2299_platform_39988'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // Buscar el HTML completo del primer card para ver estructura real
  console.log('\n=== HTML DEL PRIMER CARD COMPLETO ===')
  const firstCard = await page.evaluate(() => {
    const titleEl = document.querySelector('.text-body1.ellipsis-2-lines')
    const card = titleEl?.closest('[data-v-61390112]') ?? titleEl?.closest('a') ?? titleEl?.parentElement?.parentElement?.parentElement
    return {
      html: card?.outerHTML?.slice(0, 1500),
      fullText: card?.innerText?.replace(/\n/g, ' | '),
    }
  })
  console.log(JSON.stringify(firstCard, null, 2))

  // Buscar cualquier elemento que tenga un número decimal tipo precio
  console.log('\n=== TODOS LOS ELEMENTOS CON PRECIOS DECIMALES ===')
  const priceEls = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')]
    return all
      .filter(el => /^\d+\.\d+$/.test(el.innerText?.trim()) && el.children.length === 0)
      .slice(0, 10)
      .map(el => ({
        price: el.innerText.trim(),
        tag: el.tagName,
        class: el.className,
        parentClass: el.parentElement?.className,
        grandparentClass: el.parentElement?.parentElement?.className,
      }))
  })
  console.log(JSON.stringify(priceEls, null, 2))

  await browser.close()
})()

const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome', // Usa Chrome real instalado en el sistema
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  })
  const page = await context.newPage()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  const URL = 'https://www.g2g.com/categories/wow-classic-era-vanilla-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&sort=recommended_v2'

  console.log('Navegando (headless)...')
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(8000)

  await page.screenshot({ path: 'scripts/debug-headless.png', fullPage: false })

  const info = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body?.innerText?.slice(0, 500),
    hasCards: !!document.querySelector('.text-body1.ellipsis-2-lines'),
    hasSpans: document.querySelectorAll('span').length,
    url: location.href,
  }))

  console.log(JSON.stringify(info, null, 2))
  await browser.close()
})()

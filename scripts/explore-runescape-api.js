const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1600, height: 900 },
  })
  const page = await context.newPage()

  // Interceptar todos los requests de API
  const apiRequests = []
  page.on('request', req => {
    const url = req.url()
    if (url.includes('api') || url.includes('offer') || url.includes('price') || url.includes('currency')) {
      apiRequests.push({ url, method: req.method(), headers: req.headers() })
    }
  })

  // Interceptar responses con precios
  page.on('response', async res => {
    const url = res.url()
    if ((url.includes('api') || url.includes('offer')) && res.status() === 200) {
      try {
        const body = await res.text()
        if (body.includes('price') || body.includes('currency') || body.includes('USD') || body.includes('MXN')) {
          console.log('\n=== API RESPONSE CON PRECIO ===')
          console.log('URL:', url)
          console.log('Body (primeros 500 chars):', body.slice(0, 500))
        }
      } catch {}
    }
  })

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  console.log('\n=== REQUESTS API DETECTADOS ===')
  apiRequests.forEach(r => {
    console.log(`${r.method} ${r.url}`)
  })

  await browser.close()
})()

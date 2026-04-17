const { chromium } = require('playwright')

const TARGET_URL = 'https://www.eldorado.gg/osrs-gold/g/10-0-0'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  let offersData = null

  // Interceptar la respuesta del endpoint de offers
  page.on('response', async res => {
    const url = res.url()
    if (url.includes('eldorado.gg/api') && res.status() === 200) {
      try {
        const text = await res.text()
        console.log('API hit:', url.replace('https://www.eldorado.gg/api/', '').slice(0, 80))
        if (url.includes('offers') || url.includes('predefined')) {
          offersData = JSON.parse(text)
        }
      } catch {}
    }
  })

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(5000)

  if (!offersData) {
    console.log('No se interceptaron offers, revisá la URL del endpoint')
    await browser.close()
    return
  }

  // Analizar estructura del JSON
  console.log('\n=== ESTRUCTURA DEL JSON ===')
  const sample = Array.isArray(offersData) ? offersData[0] : offersData?.offers?.[0] ?? Object.values(offersData)[0]
  console.log(JSON.stringify(sample, null, 2)?.slice(0, 1000))

  // Extraer los primeros 5 precios en USD
  console.log('\n=== PRIMEROS 5 PRECIOS (USD) ===')
  const offers = Array.isArray(offersData) ? offersData : offersData?.offers ?? []
  const top5 = offers.slice(0, 5).map(o => ({
    seller: o.sellerName ?? o.seller?.username ?? o.username,
    price: o.price ?? o.unitPrice ?? o.pricePerUnit ?? o.amount,
    currency: o.currency ?? o.priceCurrency ?? 'USD',
  }))
  console.log(JSON.stringify(top5, null, 2))

  const prices = top5.map(o => parseFloat(o.price)).filter(p => !isNaN(p))
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  console.log('\nPromedio USD:', avg.toFixed(6))

  await browser.close()
})()

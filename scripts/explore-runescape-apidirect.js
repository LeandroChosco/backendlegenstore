const https = require('https')

const OFFERS_URL = 'https://www.eldorado.gg/api/predefinedOffers/augmentedGame/offers?gameId=10&category=Currency&pageIndex=1&pageSize=10&useScoreV2=true'
const SEO_URL = 'https://www.eldorado.gg/api/library/seoAliasMappings?seoAlias=osrs-gold&category=Currency&gameId=10&locale=en-US'

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.eldorado.gg/osrs-gold/g/10-0-0',
      }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('Status:', res.statusCode, url.slice(30, 90))
        try { resolve(JSON.parse(data)) } catch { resolve(data.slice(0, 500)) }
      })
    }).on('error', reject)
  })
}

;(async () => {
  // 1. Probar el endpoint de seoAlias que ya sabemos que devuelve USD
  console.log('\n=== SEO ALIAS (best deal price en USD) ===')
  const seo = await fetchJSON(SEO_URL)
  console.log(JSON.stringify(seo?.bestDealPrice, null, 2))

  // 2. Probar el endpoint de offers
  console.log('\n=== OFFERS DIRECTO ===')
  const offers = await fetchJSON(OFFERS_URL)

  if (typeof offers === 'string') {
    console.log('Respuesta no es JSON:', offers)
    return
  }

  console.log('Keys del response:', Object.keys(offers))
  const list = Array.isArray(offers) ? offers : offers?.results ?? offers?.offers ?? offers?.data ?? Object.values(offers)[0]
  console.log('Total offers:', list?.length)

  if (list?.length > 0) {
    console.log('\nPrimer offer (estructura completa):')
    console.log(JSON.stringify(list[0], null, 2)?.slice(0, 1500))

    console.log('\n=== TOP 5 PRECIOS (USD) ===')
    const prices = []
    list.slice(0, 5).forEach((r, i) => {
      const usdPrice = r.offer?.pricePerUnitInUSD?.amount
      const seller = r.user?.username ?? r.user?.id ?? 'unknown'
      console.log(`${i + 1}. ${seller} — $${usdPrice} USD`)
      if (usdPrice) prices.push(usdPrice)
    })

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    console.log(`\nPromedio top 5: $${avg.toFixed(5)} USD`)
  }
})()

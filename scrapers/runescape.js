const https = require('https')
const { upsertPrice } = require('./supabase')

const OFFERS_URL =
  'https://www.eldorado.gg/api/predefinedOffers/augmentedGame/offers?gameId=10&category=Currency&pageIndex=1&pageSize=10&useScoreV2=true'

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.eldorado.gg/osrs-gold/g/10-0-0',
      },
    }, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function runRunescape() {
  console.log('\n[RuneScape] Iniciando scraper...')

  const json = await fetchJSON(OFFERS_URL)
  const results = json?.results ?? []

  if (results.length === 0) throw new Error('No se encontraron offers en la API de eldorado.gg')

  const prices = results
    .slice(0, 5)
    .map(r => r.offer?.pricePerUnitInUSD?.amount)
    .filter(p => typeof p === 'number' && p > 0)

  if (prices.length === 0) throw new Error('No se pudieron extraer precios USD')

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const price_usd = parseFloat(avg.toFixed(6))

  console.log(`  Precios top ${prices.length}: [${prices.join(', ')}] → promedio: $${price_usd}`)

  await upsertPrice({
    game: 'runescape',
    server: 'OSRS Gold',
    region: 'Global',
    price_usd,
    raw_data: { prices, count: prices.length, source: 'eldorado.gg' },
  })

  console.log('[RuneScape] Completado.')
}

module.exports = { runRunescape }

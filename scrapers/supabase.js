require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

// Cliente lazy — se crea cuando se usa por primera vez, no al importar el módulo
let supabase = null
function getClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

async function upsertPrice({ game, server, region, price_usd, raw_data }) {
  const { error } = await getClient()
    .from('prices')
    .upsert(
      { game, server, region, price_usd, raw_data, updated_at: new Date().toISOString() },
      { onConflict: 'game,server' }
    )

  if (error) throw new Error(`Supabase upsert error [${game}/${server}]: ${error.message}`)
  console.log(`  [DB] ${game} / ${server} → $${price_usd} USD`)
}

module.exports = { upsertPrice }

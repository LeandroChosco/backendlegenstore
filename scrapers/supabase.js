require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function upsertPrice({ game, server, region, price_usd, raw_data }) {
  const { error } = await supabase
    .from('prices')
    .upsert(
      { game, server, region, price_usd, raw_data, updated_at: new Date().toISOString() },
      { onConflict: 'game,server' }
    )

  if (error) throw new Error(`Supabase upsert error [${game}/${server}]: ${error.message}`)
  console.log(`  [DB] ${game} / ${server} → $${price_usd} USD`)
}

module.exports = { upsertPrice }

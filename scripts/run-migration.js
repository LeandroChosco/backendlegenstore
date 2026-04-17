const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Usar DIRECT_URL (sin pgbouncer) para DDL
const DIRECT_URL = 'postgresql://postgres.rtsstyqkqemflgndkipr:notelosabe123*@aws-1-us-east-1.pooler.supabase.com:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log('Conectando a Supabase...')
    await client.connect()
    console.log('Conectado.')

    const sqlPath = path.join(__dirname, '../supabase/migrations/001_create_prices.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('Ejecutando migración...')
    await client.query(sql)
    console.log('Migración completada.')

    // Verificar que las tablas y datos quedaron bien
    const { rows } = await client.query('SELECT game, server, region, price_usd, is_static, updated_at FROM prices ORDER BY game, server')
    console.log('\nDatos insertados:')
    console.table(rows)

  } catch (err) {
    console.error('Error en migración:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()

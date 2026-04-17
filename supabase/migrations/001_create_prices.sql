-- ============================================================
-- Tabla de precios: scraped + estáticos (Albion)
-- ============================================================

CREATE TABLE IF NOT EXISTS prices (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  game        TEXT        NOT NULL,
  server      TEXT        NOT NULL DEFAULT 'default',
  region      TEXT,
  price_usd   NUMERIC(12, 6) NOT NULL DEFAULT 0,
  is_static   BOOLEAN     DEFAULT FALSE,
  raw_data    JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT prices_game_server_unique UNIQUE (game, server)
);

-- Auto-update de updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON prices;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer (web pública consume el endpoint)
DROP POLICY IF EXISTS "prices_public_read" ON prices;
CREATE POLICY "prices_public_read" ON prices
  FOR SELECT USING (true);

-- Solo service_role puede escribir (scraper + admin panel server-side)
DROP POLICY IF EXISTS "prices_service_write" ON prices;
CREATE POLICY "prices_service_write" ON prices
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Seed inicial de datos
-- ============================================================

INSERT INTO prices (game, server, region, price_usd, is_static, raw_data) VALUES

  -- Albion Online (estáticos, editables desde el panel)
  ('albion', 'buyer',  'America West', 0.25, TRUE,  '{"label": "Compradores", "unit": "M"}'),
  ('albion', 'seller', 'America West', 0.18, TRUE,  '{"label": "Vendedores",  "unit": "M"}'),

  -- WoW TBC (scraped de g2g.com — promedio top 5 vendedores)
  ('wow_tbc', 'Nightslayer [US - Anniversary] - Horde',    'US', 0, FALSE, NULL),
  ('wow_tbc', 'Nightslayer [US - Anniversary] - Alliance', 'US', 0, FALSE, NULL),
  ('wow_tbc', 'Dreamscythe [US - Anniversary] - Alliance', 'US', 0, FALSE, NULL),
  ('wow_tbc', 'Dreamscythe [US - Anniversary] - Horde',    'US', 0, FALSE, NULL),

  -- WoW Midnight (scraped de g2g.com — primeros 4 cards de la lista)
  ('wow_midnight', 'card_1', 'US', 0, FALSE, NULL),
  ('wow_midnight', 'card_2', 'US', 0, FALSE, NULL),
  ('wow_midnight', 'card_3', 'US', 0, FALSE, NULL),
  ('wow_midnight', 'card_4', 'US', 0, FALSE, NULL),

  -- RuneScape OSRS (scraped de eldorado.gg API — promedio top 5)
  ('runescape', 'OSRS Gold', 'Global', 0, FALSE, NULL)

ON CONFLICT (game, server) DO NOTHING;

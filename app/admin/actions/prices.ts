'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function updateAlbionPrice(server: 'buyer' | 'seller', price_usd: number) {
  if (isNaN(price_usd) || price_usd <= 0) throw new Error('Precio inválido')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('prices')
    .update({ price_usd, updated_at: new Date().toISOString() })
    .eq('game', 'albion')
    .eq('server', server)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/api/prices')
}

export async function updateMarkup(game: string, server: string, markup_pct: number) {
  if (isNaN(markup_pct)) throw new Error('Porcentaje inválido')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('prices')
    .update({ markup_pct })
    .eq('game', game)
    .eq('server', server)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/api/prices')
}

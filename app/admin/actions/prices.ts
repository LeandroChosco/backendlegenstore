'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAlbionPrice(server: 'buyer' | 'seller', price_usd: number) {
  if (isNaN(price_usd) || price_usd <= 0) throw new Error('Precio inválido')

  const supabase = await createClient()
  const { error } = await supabase
    .from('prices')
    .update({ price_usd, updated_at: new Date().toISOString() })
    .eq('game', 'albion')
    .eq('server', server)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/api/prices')
}

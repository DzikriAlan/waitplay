import { getSupabaseRealtimeClient } from '@/shared/lib/supabaseRealtime'
import type { PayloadGetSlitherArena } from '../types/slitherTypes'

// Satu kanal Realtime per ruangan; frame ular disiarkan lewat kanal ini, sama seperti
// getGameRoomsStream membungkus EventSource. Null berarti kunci Supabase belum diisi — arena
// tetap jalan tapi hanya solo.
export const getSlitherChannel = (payload: PayloadGetSlitherArena) => {
  const client = getSupabaseRealtimeClient()
  if (!client || !payload.code) return null
  return client.channel(`slither:${payload.code}`, {
    config: { broadcast: { self: false }, presence: { key: payload.playerId } },
  })
}

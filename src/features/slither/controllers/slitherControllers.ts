import { useCallback, useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSlitherStates } from '../states/slitherStates'
import { getSlitherChannel } from '../services/slitherServices'
import type { DataSlitherPlayer } from '../types/slitherTypes'

const PRUNE_INTERVAL = 1500

export const useSlitherControllers = () => {
  const { payloadGetSlitherArena, slitherArena, setSlitherArena, setSlitherPlayer, setSlitherPrune } =
    useSlitherStates()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const code = payloadGetSlitherArena.code
  const playerId = payloadGetSlitherArena.playerId

  // Frame ular dikirim puluhan kali per detik dari loop render, jadi ini pembungkus kirim yang
  // stabil, bukan useMutation (mutasi TanStack per frame tidak masuk akal).
  const storeSlitherState = useCallback((payload: DataSlitherPlayer) => {
    const channel = channelRef.current
    if (!channel) return
    channel.send({ type: 'broadcast', event: payload.alive ? 'state' : 'dead', payload })
  }, [])

  useEffect(() => {
    if (!code || !playerId) return

    const channel = getSlitherChannel({ code, playerId, name: payloadGetSlitherArena.name })
    if (!channel) {
      // Tanpa kunci Supabase arena tetap dimainkan solo.
      setSlitherArena({ status: 'success', data: { players: [] } })
      return
    }

    channelRef.current = channel
    channel
      .on('broadcast', { event: 'state' }, ({ payload }: { payload: DataSlitherPlayer }) => {
        if (payload.playerId !== playerId) setSlitherPlayer(payload)
      })
      .on('broadcast', { event: 'dead' }, ({ payload }: { payload: DataSlitherPlayer }) => {
        if (payload.playerId !== playerId) setSlitherPlayer({ ...payload, alive: false })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSlitherArena({ status: 'success' })
      })

    const timer = window.setInterval(() => setSlitherPrune(Date.now()), PRUNE_INTERVAL)

    return () => {
      window.clearInterval(timer)
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [code, playerId, payloadGetSlitherArena.name, setSlitherArena, setSlitherPlayer, setSlitherPrune])

  return { slitherArena, storeSlitherState }
}

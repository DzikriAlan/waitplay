import { create } from 'zustand'
import { SLITHER_STALE_MS } from '@/shared/lib/slitherEngine'
import type { DataSlitherPlayer, PayloadGetSlitherArena, SlitherArena } from '../types/slitherTypes'

interface SlitherStore {
  payloadGetSlitherArena: PayloadGetSlitherArena
  slitherArena: SlitherArena
  setGetSlitherArena: (payload: Partial<PayloadGetSlitherArena>) => void
  setSlitherArena: (state: Partial<SlitherArena>) => void
  setSlitherPlayer: (player: DataSlitherPlayer) => void
  setSlitherPrune: (now: number) => void
  setSlitherReset: () => void
}

const emptyState: SlitherArena = {
  status: 'loading',
  statusTitle: 'Menyiapkan arena',
  statusSubtitle: 'Mohon tunggu sebentar.',
  data: { players: [] },
}

// Daftar lawan disimpan sebagai peta berdasarkan playerId; frame yang basi dibuang supaya ular
// yang sudah keluar tidak terus tergambar.
const getMergedPlayers = (players: DataSlitherPlayer[], next: DataSlitherPlayer, now: number) => {
  const kept = players.filter(
    (player) => player.playerId !== next.playerId && now - player.ts < SLITHER_STALE_MS,
  )
  return [...kept, next]
}

export const useSlitherStates = create<SlitherStore>((set) => ({
  payloadGetSlitherArena: { code: '', playerId: '', name: '' },
  slitherArena: { ...emptyState, data: { players: [] } },

  setGetSlitherArena: (payload) =>
    set((state) => ({ payloadGetSlitherArena: { ...state.payloadGetSlitherArena, ...payload } })),

  setSlitherArena: (next) => set((state) => ({ slitherArena: { ...state.slitherArena, ...next } })),

  setSlitherPlayer: (player) =>
    set((state) => {
      const players = state.slitherArena.data?.players ?? []
      return {
        slitherArena: {
          ...state.slitherArena,
          status: 'success',
          data: { players: getMergedPlayers(players, player, Date.now()) },
        },
      }
    }),

  setSlitherPrune: (now) =>
    set((state) => {
      const players = state.slitherArena.data?.players ?? []
      const fresh = players.filter((player) => now - player.ts < SLITHER_STALE_MS)
      if (fresh.length === players.length) return {}
      return { slitherArena: { ...state.slitherArena, data: { players: fresh } } }
    }),

  setSlitherReset: () =>
    set({ slitherArena: { ...emptyState, status: 'loading', data: { players: [] } } }),
}))

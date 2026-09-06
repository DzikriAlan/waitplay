'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { getSlitherRoomCode, getSlitherSeed } from '@/shared/lib/slitherEngine'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import { useSlitherStates } from '../states/slitherStates'
import { useSlitherControllers } from '../controllers/slitherControllers'
import type { DataSlitherPlayer } from '../types/slitherTypes'
import type { SlitherBoardRow } from './SlitherArena'
import SlitherLobby from './SlitherLobby'
import SlitherHud from './SlitherHud'
import SlitherTouch, { type SlitherControl } from './SlitherTouch'

// Arena tiga dimensi baru dipakai setelah pemain masuk permainan, sedangkan lobinya tidak
// membutuhkan Three.js sama sekali, jadi pustakanya dipisah dari muatan awal halaman.
const SlitherArena = dynamic(() => import('./SlitherArena'), { ssr: false })

interface Props {
  initialRoom?: string
}

const GLOBAL_ROOM = 'GLOBAL'
const SOLO_BOTS = 8
const ONLINE_BOTS = 4

export default function SlitherPlay({ initialRoom = '' }: Props) {
  const router = useRouter()
  const { setGetSlitherArena, setSlitherReset } = useSlitherStates()
  const { slitherArena, storeSlitherState } = useSlitherControllers()
  const [guest] = useState(() => ({
    id:
      (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
      `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Ular${Math.floor(1000 + Math.random() * 9000)}`,
  }))
  const [board, setBoard] = useState<SlitherBoardRow[]>([])
  // Masukan stik ditulis ke ref, bukan state, supaya gerakan jempol tidak memicu render tiap frame.
  const controlRef = useRef<SlitherControl>({ angle: null, boost: false })
  // Elemen yang diminta layar penuh, dipisah dari HUD supaya kontrol sentuh ikut terbawa.
  const stageRef = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState({ isTouch: false, isPortrait: false })
  const [filters, setFilters] = useState({
    phase: 'lobby' as 'lobby' | 'arena',
    mode: 'solo' as 'solo' | 'online' | 'room',
    roomCode: initialRoom.toUpperCase().slice(0, 5),
    nameDraft: '',
    skinIndex: 0,
    isExitOpen: false,
    isFullscreen: false,
    score: 0,
    isDead: false,
    isWin: false,
    placement: 0,
    total: 0,
    respawnNonce: 0,
  })

  const data = useMemo(() => {
    const identityId = guest.id
    const identityName = (filters.nameDraft || guest.name || 'Ular').slice(0, 14)
    const players = slitherArena.data?.players ?? []
    const isReady = !!identityId
    const seedSource = filters.mode === 'solo' ? `SOLO-${identityId}` : filters.roomCode || GLOBAL_ROOM

    // Baris kita sendiri dituakan dengan skor yang persis sama dengan tampilan "ular kamu mati",
    // bukan skor papan yang baru diperbarui tiap setengah detik, supaya urutannya selalu mengikuti
    // langkah yang sedang berjalan.
    const getLiveRow = (row: SlitherBoardRow) => (row.playerId === identityId ? { ...row, score: filters.score } : row)
    const ranked = [...board]
      .map(getLiveRow)
      .sort((left, right) => right.score - left.score)
      .map((row, index) => ({ ...row, rank: index + 1, isSelf: row.playerId === identityId }))

    // Selalu tampilkan baris kita: kalau tidak masuk enam besar, sisakan satu slot terakhir
    // supaya urutannya jadi 1, 2, 3, 4, 5, lalu peringkat kita yang sebenarnya.
    const LEADER_LIMIT = 6
    const selfRow = ranked.find((row) => row.isSelf)
    const leaderboard =
      selfRow && selfRow.rank > LEADER_LIMIT
        ? [...ranked.slice(0, LEADER_LIMIT - 1), selfRow]
        : ranked.slice(0, LEADER_LIMIT)

    return {
      identityId,
      identityName,
      players,
      seed: getSlitherSeed(seedSource),
      isReady,
      isArena: filters.phase === 'arena' && isReady,
      isJoinDisabled: filters.roomCode.trim().length < 3,
      botCount: filters.mode === 'solo' ? SOLO_BOTS : ONLINE_BOTS,
      leaderboard,
    }
  }, [guest, filters, slitherArena, board])

  const editSlitherName = (value: string) => {
    setFilters((prev) => ({ ...prev, nameDraft: value.slice(0, 14) }))
  }
  const editSlitherSkin = (index: number) => {
    setFilters((prev) => ({ ...prev, skinIndex: index }))
  }
  const editSlitherRoom = (value: string) => {
    setFilters((prev) => ({ ...prev, roomCode: value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) }))
  }
  const enterArena = { isDead: false, isWin: false, placement: 0, total: 0, score: 0 }
  const submitSlitherSolo = () => {
    setGetSlitherArena({ code: '', playerId: data.identityId, name: data.identityName })
    setFilters((prev) => ({ ...prev, phase: 'arena', mode: 'solo', ...enterArena }))
  }
  const submitSlitherGlobal = () => {
    setGetSlitherArena({ code: GLOBAL_ROOM, playerId: data.identityId, name: data.identityName })
    setFilters((prev) => ({ ...prev, phase: 'arena', mode: 'online', roomCode: GLOBAL_ROOM, ...enterArena }))
  }
  const submitSlitherCreate = () => {
    const code = getSlitherRoomCode()
    setGetSlitherArena({ code, playerId: data.identityId, name: data.identityName })
    setFilters((prev) => ({ ...prev, phase: 'arena', mode: 'room', roomCode: code, ...enterArena }))
    router.replace({ pathname: '/slither', query: { room: code } }, undefined, { shallow: true })
  }
  const submitSlitherJoin = () => {
    const code = filters.roomCode.trim()
    if (code.length < 3) return
    setGetSlitherArena({ code, playerId: data.identityId, name: data.identityName })
    setFilters((prev) => ({ ...prev, phase: 'arena', mode: 'room', ...enterArena }))
    router.replace({ pathname: '/slither', query: { room: code } }, undefined, { shallow: true })
  }
  const submitSlitherFrame = (frame: DataSlitherPlayer) => {
    storeSlitherState(frame)
  }
  const submitSlitherScore = (score: number) => {
    setFilters((prev) => (prev.score === score ? prev : { ...prev, score }))
  }
  const submitSlitherBoard = (rows: SlitherBoardRow[]) => {
    setBoard(rows)
  }
  const submitSlitherDead = (placement: number, total: number) => {
    setFilters((prev) => (prev.isDead || prev.isWin ? prev : { ...prev, isDead: true, placement, total }))
  }
  const submitSlitherWin = (total: number) => {
    setFilters((prev) => (prev.isDead || prev.isWin ? prev : { ...prev, isWin: true, placement: 1, total }))
  }
  const submitSlitherRespawn = () => {
    setFilters((prev) => ({
      ...prev,
      isDead: false,
      isWin: false,
      placement: 0,
      total: 0,
      score: 0,
      respawnNonce: prev.respawnNonce + 1,
    }))
  }
  const editSlitherFullscreen = () => {
    const getFullscreenElement = () => document.fullscreenElement
    if (getFullscreenElement()) {
      document.exitFullscreen?.().catch(() => {})
    } else {
      stageRef.current?.requestFullscreen?.().catch(() => {})
    }
  }
  const loadSlitherExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearSlitherExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitSlitherExit = () => {
    setSlitherReset()
    window.location.href = '/'
  }

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    const portrait = window.matchMedia('(orientation: portrait)')
    const loadDevice = () => setDevice({ isTouch: coarse.matches, isPortrait: portrait.matches })
    loadDevice()
    coarse.addEventListener('change', loadDevice)
    portrait.addEventListener('change', loadDevice)
    return () => {
      coarse.removeEventListener('change', loadDevice)
      portrait.removeEventListener('change', loadDevice)
    }
  }, [])
  useEffect(() => {
    // Layar penuh bisa ditutup dari luar tombol ini, misalnya tombol Esc peramban, jadi keadaan
    // tombol disamakan dengan keadaan sebenarnya lewat peristiwa ini, bukan ditebak dari klik saja.
    const loadFullscreenChange = () => {
      setFilters((prev) => {
        const next = !!document.fullscreenElement
        return prev.isFullscreen === next ? prev : { ...prev, isFullscreen: next }
      })
    }
    document.addEventListener('fullscreenchange', loadFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', loadFullscreenChange)
  }, [])
  useEffect(() => {
    // Sebagian peramban mengizinkan penguncian orientasi; kalau ditolak, lapisan "putar layar"
    // di bawah yang mengambil alih.
    if (!data.isArena || !device.isTouch) return
    const orientation = window.screen?.orientation as (ScreenOrientation & {
      lock?: (value: string) => Promise<void>
    }) | undefined
    orientation?.lock?.('landscape').catch(() => {})
  }, [data.isArena, device.isTouch])
  useEffect(() => {
    if (!router.isReady) return
    const room = String(router.query.room ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
    if (room && filters.phase === 'lobby') setFilters((prev) => ({ ...prev, roomCode: room }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.room])
  useEffect(() => {
    // Tautan undangan membuka /slither/{kode}; begitu identitas siap, langsung masuk arena.
    if (!initialRoom || !data.isReady || filters.phase === 'arena') return
    const code = initialRoom.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
    if (code.length < 3) return
    setGetSlitherArena({ code, playerId: data.identityId, name: data.identityName })
    setFilters((prev) => ({ ...prev, phase: 'arena', mode: 'room', roomCode: code }))
  }, [initialRoom, data.isReady, data.identityId, data.identityName, filters.phase, setGetSlitherArena])

  if (!data.isArena) {
    return (
      <SlitherLobby
        name={filters.nameDraft}
        roomCode={filters.roomCode}
        isJoinDisabled={data.isJoinDisabled}
        skinIndex={filters.skinIndex}
        onEditSlitherName={editSlitherName}
        onEditSlitherSkin={editSlitherSkin}
        onEditSlitherRoom={editSlitherRoom}
        onSubmitSlitherSolo={submitSlitherSolo}
        onSubmitSlitherGlobal={submitSlitherGlobal}
        onSubmitSlitherCreate={submitSlitherCreate}
        onSubmitSlitherJoin={submitSlitherJoin}
      />
    )
  }

  return (
    <div ref={stageRef} className="relative h-[100dvh] w-full touch-none overflow-hidden bg-[#0a0a0b]">
      <SlitherArena
        isActive
        selfId={data.identityId}
        selfName={data.identityName}
        selfSkin={filters.skinIndex}
        seed={data.seed}
        botCount={data.botCount}
        remotePlayers={data.players}
        respawnNonce={filters.respawnNonce}
        controlRef={controlRef}
        onSubmitSlitherFrame={submitSlitherFrame}
        onSubmitSlitherScore={submitSlitherScore}
        onSubmitSlitherDead={submitSlitherDead}
        onSubmitSlitherWin={submitSlitherWin}
        onSubmitSlitherBoard={submitSlitherBoard}
      />

      <SlitherHud
        score={filters.score}
        isDead={filters.isDead}
        isWin={filters.isWin}
        placement={filters.placement}
        total={filters.total}
        isFullscreen={filters.isFullscreen}
        leaderboard={data.leaderboard}
        onSubmitSlitherRespawn={submitSlitherRespawn}
        onLoadSlitherExit={loadSlitherExit}
        onEditSlitherFullscreen={editSlitherFullscreen}
      />

      {device.isTouch ? <SlitherTouch controlRef={controlRef} /> : null}

      {device.isTouch && device.isPortrait ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#0a0a0b] px-8 text-center">
          <span aria-hidden="true" className="text-4xl">
            &#8635;
          </span>
          <p className="text-base font-black uppercase tracking-tight text-[#f2ede1]">
            Putar layar mendatar
          </p>
          <p className="text-[12px] leading-snug text-[#9aa3b2]">
            Slither 3D enak dimainkan dalam posisi mendatar. Putar perangkatmu untuk mulai bermain.
          </p>
        </div>
      ) : null}

      {filters.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi permainan ini akan diakhiri dan skormu tidak disimpan."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          onClearGameExit={clearSlitherExit}
          onSubmitGameExit={submitSlitherExit}
        />
      ) : null}
    </div>
  )
}

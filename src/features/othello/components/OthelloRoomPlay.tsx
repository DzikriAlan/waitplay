'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OthelloCell } from '../types/othelloTypes'
import {
  OTHELLO_SIZE,
  getOthelloColumn,
  getOthelloLegalMoves,
  getOthelloRow,
} from '@/shared/lib/othelloEngine'
import { useGameRoomsStates } from '@/features/game-rooms/states/gameRoomsStates'
import { useGameRoomsControllers } from '@/features/game-rooms/controllers/gameRoomsControllers'
import GameRoomsInvite from '@/features/game-rooms/components/GameRoomsInvite'
import GameTurnStatus from '@/shared/components/reusable/GameTurnStatus'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import OthelloHeader from './OthelloHeader'
import OthelloBoard from './OthelloBoard'
import OthelloResult from './OthelloResult'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameGuide from '@/shared/components/reusable/GameGuide'

interface Props {
  code: string
}

export default function OthelloRoomPlay({ code }: Props) {
  const { gameRooms, setGetGameRooms } = useGameRoomsStates()
  const { storeGameRoomsJoin, storeGameRoomsMove, storeGameRoomsLeave } = useGameRoomsControllers()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    isSoundOn: true,
    cue: null as GameAudioCue | null,
    lastOwnScore: 0,
    isCopied: false,
    inviteUrl: '',
    pagination: { currentPage: 1, perPage: 0, totalItem: 0, totalPage: 1 },
  })
  const data = useMemo(() => {
    const room = gameRooms.data
    const cells = room?.cells ?? []
    const seat = room?.seat ?? ''
    const rivalSeat = seat === 'p1' ? 'p2' : 'p1'
    const isPlaying = room?.status === 'playing'
    const isMyTurn = isPlaying && !!seat && room?.turn === seat
    const legalMoves = isMyTurn && cells.length ? getOthelloLegalMoves(cells, seat) : []

    // Kursi sendiri selalu digambar sebagai pemain supaya kedua layar memakai warna yang sama.
    const getSide = (owner: string) => (!owner ? '' : owner === seat ? 'player' : 'bot')
    const getCell = (owner: string, index: number): OthelloCell => ({
      index,
      row: getOthelloRow(index),
      column: getOthelloColumn(index),
      side: getSide(owner),
      isPlayable: legalMoves.includes(index),
      isLast: room?.lastCell === index,
    })
    const getSeatTotal = (target: string) => cells.filter((owner) => owner === target).length
    const getResultLabel = (winner: string) => {
      if (room?.leftSeat && room.leftSeat !== seat) return 'Lawan keluar, kamu menang'
      if (room?.leftSeat && room.leftSeat === seat) return 'Kamu keluar dari permainan'
      if (!winner) return ''
      if (winner === 'draw') return 'Seri'
      return winner === seat ? 'Kamu menang' : 'Lawan menang'
    }

    const ownScore = getSeatTotal(seat)
    const rivalScore = getSeatTotal(rivalSeat)

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.othello,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: cells,
      isLoading: gameRooms.status === 'loading' && !room,
      isError: gameRooms.status === 'error',
      isEmpty: gameRooms.status === 'empty',
      emptyTitle: 'Ruangan tidak ditemukan',
      emptySubtitle: 'Periksa kembali tautan undangan yang kamu terima.',
      emptyImage: '',
      pagination: { ...filters.pagination, perPage: cells.length, totalItem: cells.length },
      cells: cells.map((owner, index) => getCell(owner, index)),
      size: cells.length ? OTHELLO_SIZE : 0,
      turn: isMyTurn ? 'player' : 'bot',
      // Penanda besar dipakai supaya pemain tahu kenapa papan belum bisa disentuh.
      statusLabel: !seat
        ? 'Ruangan penuh, kamu menonton'
        : isMyTurn
          ? 'Giliranmu, taruh bidak'
          : (room?.rivalOnlineTotal ?? 0) > 0
            ? 'Menunggu langkah lawan'
            : 'Menunggu lawan tersambung',
      isWaiting: isPlaying && !isMyTurn,
      seat,
      code,
      inviteUrl: filters.inviteUrl,
      isCopied: filters.isCopied,
      playerTotal: room?.playerTotal ?? 0,
      seatTotal: room?.seatTotal ?? 2,
      isLobbyOpen: !!room && room.status === 'lobby',
      scoreLabel: `${ownScore} : ${rivalScore}`,
      ownScore,
      rivalScore,
      moveTotal: room?.moveTotal ?? 0,
      isFinished: room?.status === 'finished',
      isLeftByRival: !!room?.leftSeat && room.leftSeat !== seat,
      resultLabel: getResultLabel(room?.winner ?? ''),
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
    }
  }, [gameRooms, filters, code, text, activeLocale])
  const submitOthelloCell = (cellIndex: number) => {
    const room = gameRooms.data
    if (!room || room.turn !== room.seat) return
    storeGameRoomsMove.mutate({ code, token: room.token, cellIndex })
  }
  const submitGameRoomsInvite = () => {
    const loadCopiedInvite = async () => {
      try {
        await navigator.clipboard.writeText(filters.inviteUrl)
        setFilters((prev) => ({ ...prev, isCopied: true }))
      } catch {
        setFilters((prev) => ({ ...prev, isCopied: false }))
      }
    }
    loadCopiedInvite()
  }
  const editOthelloSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const clearOthelloRoom = () => {
    window.location.href = data.isLeftByRival ? '/' : '/othello'
  }

  const loadOthelloGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: true }))
  }
  const clearOthelloGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: false }))
  }
  const editOthelloLocale = (locale: string) => {
    setLocale(locale as LocaleCode)
  }
  const loadOthelloExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearOthelloExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitOthelloExit = () => {
    // Keluar mengakhiri sesi untuk kedua pemain, jadi server dikabari lebih dulu.
    const room = gameRooms.data
    if (room?.token) storeGameRoomsLeave.mutate({ code, token: room.token })
    window.location.href = '/'
  }
  useEffect(() => {
    // Pilihan bahasa baru dibaca di peramban supaya hasil render server tetap sama.
    setLocaleInit()
  }, [setLocaleInit])
  useEffect(() => {
    // Kursi disimpan per tab supaya dua tab di peramban yang sama tetap dapat kursi berbeda.
    const getStoredToken = () => {
      try {
        return window.sessionStorage.getItem(`game-room-${code}`) ?? ''
      } catch {
        return ''
      }
    }

    const token = getStoredToken()
    setFilters((prev) => ({ ...prev, inviteUrl: `${window.location.origin}/othello/${code}` }))
    setGetGameRooms({ code, token })
    storeGameRoomsJoin.mutate({ code, token, name: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, setGetGameRooms])
  useEffect(() => {
    // Sesi yang ditutup lawan tidak bisa dilanjutkan, jadi pemain diantar kembali ke beranda.
    if (!data.isLeftByRival) return
    const timer = window.setTimeout(() => {
      window.location.href = '/'
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [data.isLeftByRival])
  useEffect(() => {
    const token = gameRooms.data?.token
    if (!token) return
    try {
      window.sessionStorage.setItem(`game-room-${code}`, token)
    } catch {
      return
    }
  }, [gameRooms.data?.token, code])
  useEffect(() => {
    // Bunyi balikan hanya dibunyikan saat jumlah bidak pemain bertambah, sama seperti mode solo.
    setFilters((prev) =>
      data.ownScore > prev.lastOwnScore
        ? { ...prev, lastOwnScore: data.ownScore, cue: { id: Date.now(), kind: 'capture' } }
        : { ...prev, lastOwnScore: data.ownScore },
    )
  }, [data.ownScore])
  useEffect(() => {
    const room = gameRooms.data
    if (!room || room.status !== 'finished' || !room.winner || room.winner === 'draw') return
    const kind = room.winner === room.seat ? 'win' : 'lose'
    setFilters((prev) => (prev.cue?.kind === kind ? prev : { ...prev, cue: { id: Date.now(), kind } }))
  }, [gameRooms.data])

  return (
    <div className="flex h-[100dvh] w-full touch-none items-stretch justify-center overflow-hidden overscroll-none bg-[#0a0a0b] p-2 sm:p-4">
      <div className="flex h-full w-full max-w-[480px] flex-col gap-3">
        <OthelloHeader
          onLoadOthelloExit={loadOthelloExit}
          isSoundOn={data.isSoundOn}
          onLoadOthelloGuide={loadOthelloGuide}
          onEditOthelloSound={editOthelloSound}
        />

        <GameAudio
          isActive
          isMusicOn={data.isSoundOn}
          isSoundOn={data.isSoundOn}
          bassScale={[98, 110, 130.81, 110]}
          leadScale={[329.63, 392, 440, 493.88, 440, 392, 349.23, 329.63]}
          stepDuration={0.36}
          cue={data.cue}
        />

        <GameTurnStatus label={data.statusLabel} isWaiting={data.isWaiting} />

        <main className="flex min-h-0 flex-1 items-stretch justify-center">
          {data.isLoading || !data.size ? (
            <p className="self-center text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">
              Menyiapkan ruangan…
            </p>
          ) : (
            <OthelloBoard
              cells={data.cells}
              size={data.size}
              turn={data.turn}
              playerLabel="Bidak Kamu"
              botLabel="Bidak Lawan"
              playerScore={data.ownScore}
              botScore={data.rivalScore}
              onSubmitOthelloCell={submitOthelloCell}
            />
          )}
        </main>

        <footer className="grid shrink-0 grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Langkah</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.moveTotal}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Skor</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.scoreLabel}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Ruangan</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.code}</span>
          </div>
        </footer>
      </div>

      {data.isLobbyOpen ? (
        <GameRoomsInvite
          code={data.code}
          inviteUrl={data.inviteUrl}
          playerTotal={data.playerTotal}
          seatTotal={data.seatTotal}
          isCopied={data.isCopied}
          onSubmitGameRoomsInvite={submitGameRoomsInvite}
        />
      ) : null}

      {data.isFinished ? (
        <OthelloResult
          resultLabel={data.resultLabel}
          rivalLabel="Bidak lawan"
          playerScore={data.ownScore}
          botScore={data.rivalScore}
          moveTotal={data.moveTotal}
          onClearOthelloGame={clearOthelloRoom}
        />
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi ini akan diakhiri untuk kamu dan lawanmu."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          isConfirmLoading={storeGameRoomsLeave.isPending}
          onClearGameExit={clearOthelloExit}
          onSubmitGameExit={submitOthelloExit}
        />
      ) : null}
      {data.isGuideOpen ? (
        <GameGuide
          title={data.guideText.title}
          goalLabel={data.guide.goalLabel}
          goal={data.guideText.goal}
          playLabel={data.guide.playLabel}
          play={data.guideText.play}
          winLabel={data.guide.winLabel}
          win={data.guideText.win}
          closeLabel={data.guide.close}
          activeLocale={data.activeLocale}
          switchLabel={data.switchLabel}
          onEditLocale={editOthelloLocale}
          onClearGameGuide={clearOthelloGuide}
        />
      ) : null}
    </div>
  )
}

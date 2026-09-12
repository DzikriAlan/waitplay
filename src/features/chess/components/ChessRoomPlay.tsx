'use client'

import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import type { ChessCell, ChessColor } from '../types/chessTypes'
import { useGameRoomsStates } from '@/features/game-rooms/states/gameRoomsStates'
import { useGameRoomsControllers } from '@/features/game-rooms/controllers/gameRoomsControllers'
import GameRoomsInvite from '@/features/game-rooms/components/GameRoomsInvite'
import GameTurnStatus from '@/shared/components/reusable/GameTurnStatus'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import ChessRoomHeader from './ChessRoomHeader'
import ChessBoard from './ChessBoard'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameGuide from '@/shared/components/reusable/GameGuide'

interface Props {
  code: string
}

export default function ChessRoomPlay({ code }: Props) {
  const { gameRooms, setGameRooms, setGetGameRooms } = useGameRoomsStates()
  const { storeGameRoomsJoin, storeGameRoomsMove, storeGameRoomsLeave } = useGameRoomsControllers()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    selected: '',
    isCopied: false,
    isSoundOn: true,
    cue: null as GameAudioCue | null,
    inviteUrl: '',
    pagination: { currentPage: 1, perPage: 64, totalItem: 64, totalPage: 1 },
  })
  const data = useMemo(() => {
    const room = gameRooms.data
    const fen = room?.fen ?? ''
    const seat = room?.seat ?? ''
    const seatColor: ChessColor = seat === 'p2' ? 'b' : 'w'
    const chess = fen ? new Chess(fen) : new Chess()

    const getTargets = (square: string) => {
      if (!square) return [] as Array<{ to: string; captured?: string }>
      return chess.moves({ square: square as never, verbose: true }) as Array<{ to: string; captured?: string }>
    }
    const getCheckedSquare = () => {
      if (!chess.inCheck()) return ''
      const found = chess
        .board()
        .flat()
        .find((cell) => cell && cell.type === 'k' && cell.color === chess.turn())
      return found ? found.square : ''
    }
    const getBoard = (): ChessCell[] => {
      const targets = new Map(getTargets(filters.selected).map((move) => [move.to, !!move.captured]))
      const checkedSquare = getCheckedSquare()
      const lastMove = room?.lastMove ?? null

      return chess
        .board()
        .flat()
        .map((cell, index) => {
          const file = index % 8
          const rank = Math.floor(index / 8)
          const square = `${'abcdefgh'[file]}${8 - rank}`
          return {
            square,
            piece: cell ? { type: cell.type, color: cell.color as ChessColor } : null,
            isDark: (file + rank) % 2 === 1,
            isSelected: square === filters.selected,
            isTarget: targets.has(square),
            isCapture: targets.get(square) === true,
            isLastMove: !!lastMove && (lastMove.from === square || lastMove.to === square),
            isCheck: square === checkedSquare,
          }
        })
    }
    const getResultLabel = (winner: string) => {
      if (room?.leftSeat && room.leftSeat !== seat) return 'Lawan keluar, kamu menang'
      if (room?.leftSeat && room.leftSeat === seat) return 'Kamu keluar dari permainan'
      if (!winner) return ''
      if (winner === 'draw') return 'Seri'
      return winner === seat ? 'Kamu menang' : 'Lawan menang'
    }

    const isPlaying = room?.status === 'playing'
    const isMyTurn = isPlaying && !!seat && room?.turn === seat
    const board = getBoard()

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.chess,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: board,
      isLoading: gameRooms.status === 'loading' && !room,
      isError: gameRooms.status === 'error',
      isEmpty: gameRooms.status === 'empty',
      emptyTitle: 'Ruangan tidak ditemukan',
      emptySubtitle: 'Periksa kembali tautan undangan yang kamu terima.',
      emptyImage: '',
      pagination: filters.pagination,
      code,
      seat,
      seatColor,
      seatLabel: seatColor === 'w' ? 'Putih' : 'Hitam',
      turnLabel: isMyTurn ? 'Giliranmu' : 'Giliran lawan',
      // Penanda besar dipakai supaya pemain tahu kenapa papan belum bisa disentuh.
      statusLabel: !seat
        ? 'Ruangan penuh, kamu menonton'
        : isMyTurn
          ? 'Giliranmu, silakan jalan'
          : (room?.rivalOnlineTotal ?? 0) > 0
            ? `Menunggu langkah ${seatColor === 'w' ? 'Hitam' : 'Putih'}`
            : 'Menunggu lawan tersambung',
      isWaiting: isPlaying && !isMyTurn,
      lastMove: room?.lastMove ?? null,
      isFlipped: seatColor === 'b',
      isLocked: !isMyTurn || storeGameRoomsMove.isPending,
      isMyTurn,
      isCheck: chess.inCheck(),
      moveTotal: room?.moveTotal ?? 0,
      inviteUrl: filters.inviteUrl,
      isCopied: filters.isCopied,
      playerTotal: room?.playerTotal ?? 0,
      seatTotal: room?.seatTotal ?? 2,
      isLobbyOpen: !!room && room.status === 'lobby',
      isFinished: room?.status === 'finished',
      leftSeat: room?.leftSeat ?? '',
      isLeftByRival: !!room?.leftSeat && room.leftSeat !== seat,
      resultLabel: getResultLabel(room?.winner ?? ''),
      selected: filters.selected,
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
    }
  }, [gameRooms, filters, code, storeGameRoomsMove.isPending, text, activeLocale])
  const submitChessSquare = (square: string) => {
    const room = gameRooms.data
    if (!room || data.isLocked) return

    const getIsTarget = (from: string, to: string) => {
      const chess = new Chess(room.fen)
      const moves = chess.moves({ square: from as never, verbose: true }) as Array<{ to: string }>
      return moves.some((move) => move.to === to)
    }
    const getIsOwnPiece = (target: string) => {
      const chess = new Chess(room.fen)
      const piece = chess.get(target as never)
      return !!piece && piece.color === data.seatColor
    }

    if (filters.selected && getIsTarget(filters.selected, square)) {
      const getPredictedRoom = () => {
        const chess = new Chess(room.fen)
        try {
          chess.move({ from: filters.selected, to: square, promotion: 'q' })
        } catch {
          return null
        }
        return {
          ...room,
          fen: chess.fen(),
          lastMove: { from: filters.selected, to: square },
          turn: chess.turn() === 'w' ? 'p1' : 'p2',
          moveTotal: room.moveTotal + 1,
        }
      }

      const predicted = getPredictedRoom()
      if (predicted) setGameRooms({ status: 'success', data: predicted })
      storeGameRoomsMove.mutate({ code, token: room.token, from: filters.selected, to: square, promotion: 'q' })
      setFilters((prev) => ({ ...prev, selected: '' }))
      return
    }
    setFilters((prev) => ({ ...prev, selected: getIsOwnPiece(square) ? square : '' }))
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
  const editChessSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const clearChessRoom = () => {
    window.location.href = data.isLeftByRival ? '/' : '/chess'
  }

  const loadChessGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: true }))
  }
  const clearChessGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: false }))
  }
  const editChessLocale = (locale: string) => {
    setLocale(locale as LocaleCode)
  }
  const loadChessExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearChessExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitChessExit = () => {
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
    setFilters((prev) => ({ ...prev, inviteUrl: `${window.location.origin}/chess/${code}` }))
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
    const room = gameRooms.data
    if (!room) return
    if (room.status === 'finished' && room.winner) {
      const kind = room.winner === 'draw' ? null : room.winner === room.seat ? 'win' : 'lose'
      if (!kind) return
      setFilters((prev) => (prev.cue?.kind === kind ? prev : { ...prev, cue: { id: Date.now(), kind } }))
      return
    }
    const id = room.moveTotal
    setFilters((prev) => {
      if (!id || prev.cue?.id === id) return prev
      return { ...prev, cue: { id, kind: 'move' } }
    })
  }, [gameRooms.data])

  return (
    <div className="flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-[#0a0a0b] p-3 sm:p-5">
      <div className="flex h-full w-full max-w-[480px] flex-col gap-3">
        <ChessRoomHeader
          onLoadChessGuide={loadChessGuide}
          onLoadChessExit={loadChessExit}
          seatLabel={data.seatLabel}
          turnLabel={data.turnLabel}
          moveTotal={data.moveTotal}
          code={data.code}
          isSoundOn={data.isSoundOn}
          onEditChessSound={editChessSound}
        />

        <GameAudio
          isActive
          isMusicOn={data.isSoundOn}
          isSoundOn={data.isSoundOn}
          bassScale={[98, 98, 130.81, 110]}
          leadScale={[329.63, 392, 493.88, 440, 392, 329.63, 293.66, 392]}
          stepDuration={0.42}
          musicLevel={0.08}
          cue={data.cue}
        />

        <GameTurnStatus label={data.statusLabel} isWaiting={data.isWaiting} />

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {data.isLoading ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">Menyiapkan ruangan…</p>
          ) : (
            <ChessBoard
              board={data.data}
              lastMove={data.lastMove}
              isLocked={data.isLocked}
              isFlipped={data.isFlipped}
              onSubmitChessSquare={submitChessSquare}
            />
          )}
        </main>
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
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Permainan selesai</p>
            <p className="mt-2 text-2xl font-black uppercase leading-none text-[#f2ede1]">{data.resultLabel}</p>
            <button
              type="button"
              onClick={clearChessRoom}
              className="mt-6 w-full rounded-xl bg-[#f2ede1] py-3 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
            >
              Kembali
            </button>
          </div>
        </div>
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi ini akan diakhiri untuk kamu dan lawanmu."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          isConfirmLoading={storeGameRoomsLeave.isPending}
          onClearGameExit={clearChessExit}
          onSubmitGameExit={submitChessExit}
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
          onEditLocale={editChessLocale}
          onClearGameGuide={clearChessGuide}
        />
      ) : null}
    </div>
  )
}

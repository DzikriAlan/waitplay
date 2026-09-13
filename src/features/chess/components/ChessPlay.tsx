'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useChessStates } from '../states/chessStates'
import { useGameRoomsStates } from '@/features/game-rooms/states/gameRoomsStates'
import { useGameRoomsControllers } from '@/features/game-rooms/controllers/gameRoomsControllers'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import ChessHeader from './ChessHeader'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import ChessBoard from './ChessBoard'
import ChessCaptured from './ChessCaptured'
import ChessSettings from './ChessSettings'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameGuide from '@/shared/components/reusable/GameGuide'

const LEVELS = [
  { id: 0, label: 'Casual', skill: 2, depth: 4, movetime: 200 },
  { id: 1, label: 'Serious', skill: 12, depth: 10, movetime: 500 },
  { id: 2, label: 'World Class', skill: 20, depth: 20, movetime: 1200 },
]
const MODES = [
  { id: 'solo', label: 'You vs Computer', hint: 'You play White, the engine answers as Black.' },
  {
    id: 'auto',
    label: 'Computer v Computer',
    hint: 'You open with the first move, then the engine plays both sides while every move is explained.',
  },
]
const PROMOTION_CHOICES = [
  { piece: 'q', label: 'Queen', glyph: '♛' },
  { piece: 'r', label: 'Rook', glyph: '♜' },
  { piece: 'b', label: 'Bishop', glyph: '♝' },
  { piece: 'n', label: 'Knight', glyph: '♞' },
]

export default function ChessPlay() {
  const {
    chessGame,
    setChessInit,
    setChessSelect,
    setChessMove,
    setChessPromotion,
    setChessUndo,
    setChessRestart,
  } = useChessStates()
  const { gameRooms } = useGameRoomsStates()
  const { storeGameRooms } = useGameRoomsControllers()
  const router = useRouter()
  const engineRef = useRef<Worker | null>(null)
  const isSearchingRef = useRef(false)
  const staleSearchRef = useRef(0)
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    activeLevel: 2,
    activeMode: 'solo',
    isInviting: false,
    isEngineReady: false,
    isThinking: false,
    isSettingsOpen: false,
    isSoundOn: true,
    cue: null as GameAudioCue | null,
    pagination: { currentPage: 1, perPage: 64, totalItem: 64, totalPage: 1 },
  })
  const data = useMemo(() => {
    const getPieceValue = (piece: string) => ({ q: 9, r: 5, b: 3, n: 3, p: 1 })[piece] ?? 0
    const getScore = (mine: string[], theirs: string[]) =>
      mine.reduce((sum, piece) => sum + getPieceValue(piece), 0) -
      theirs.reduce((sum, piece) => sum + getPieceValue(piece), 0)

    const game = chessGame.data
    const board = game?.board ?? []
    const advantage = getScore(game?.capturedByPlayer ?? [], game?.capturedByEngine ?? [])
    const isAutoMode = filters.activeMode === 'auto'
    const isEngineDriven = isAutoMode && !!game?.moveTotal

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.chess,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: board,
      isLoading: chessGame.status === 'loading',
      isError: chessGame.status === 'error',
      isEmpty: chessGame.status === 'success' && !board.length,
      emptyTitle: 'Board unavailable',
      emptySubtitle: 'Reload the page to start a new game.',
      emptyImage: '',
      pagination: filters.pagination,
      levels: LEVELS.map((level) => ({ id: level.id, label: level.label })),
      modes: MODES,
      activeLevel: filters.activeLevel,
      activeMode: filters.activeMode,
      isEngineDriven,
      moveTotal: game?.moveTotal ?? 0,
      isEngineReady: filters.isEngineReady,
      isThinking: filters.isThinking,
      isSettingsOpen: filters.isSettingsOpen,
      isInviting: filters.isInviting,
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
      advantage,
      lastMove: game?.lastMove ?? null,
      capturedByPlayer: game?.capturedByPlayer ?? [],
      capturedByEngine: game?.capturedByEngine ?? [],
      isLocked:
        !game ||
        !filters.isEngineReady ||
        game.isFinished ||
        game.turn !== 'w' ||
        filters.isThinking ||
        isEngineDriven ||
        !!game.pendingPromotion,
      isUndoDisabled: !game || !game.moveTotal || !!game.pendingPromotion,
      isPromotionOpen: !!game?.pendingPromotion,
      isFinished: !!game?.isFinished,
      resultTitle: game?.resultTitle ?? '',
      resultSubtitle: game?.resultSubtitle ?? '',
    }
  }, [chessGame, filters, text, activeLocale])
  const submitChessSquare = (square: string) => {
    const game = chessGame.data
    if (!game || data.isLocked) return

    const getCell = (target: string) => game.board.find((cell) => cell.square === target) ?? null

    const cell = getCell(square)
    if (game.selected && cell?.isTarget) {
      setChessMove(game.selected, square)
      return
    }
    setChessSelect(square)
  }
  const submitChessPromotion = (piece: string) => {
    setChessPromotion(piece)
  }
  const editChessLevel = (levelId: number) => {
    setFilters((prev) => ({ ...prev, activeLevel: levelId }))
  }
  const editChessMode = (modeId: string) => {
    setFilters((prev) => ({ ...prev, activeMode: modeId }))
  }
  const submitChessInvite = () => {
    setFilters((prev) => ({ ...prev, isInviting: true }))
    storeGameRooms.mutate({ game: 'chess', name: 'Pemain 1' })
  }
  const editChessSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const loadChessSettings = () => {
    setFilters((prev) => ({ ...prev, isSettingsOpen: true }))
  }
  const clearChessSettings = () => {
    setFilters((prev) => ({ ...prev, isSettingsOpen: false }))
  }
  const clearChessSearch = () => {
    // Pencarian engine yang masih jalan dihentikan, dan bestmove-nya diabaikan karena posisinya sudah berubah.
    if (!isSearchingRef.current) return
    isSearchingRef.current = false
    staleSearchRef.current += 1
    engineRef.current?.postMessage('stop')
    setFilters((prev) => ({ ...prev, isThinking: false }))
  }
  const loadChessUndo = () => {
    clearChessSearch()
    setChessUndo()
  }
  const clearChessGame = () => {
    clearChessSearch()
    setFilters((prev) => ({ ...prev, isSettingsOpen: false }))
    setChessRestart()
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
    // Sesi permainan berakhir begitu pemain benar-benar keluar dari halaman.
    window.location.href = '/'
  }
  useEffect(() => {
    // Pilihan bahasa baru dibaca di peramban supaya hasil render server tetap sama.
    setLocaleInit()
  }, [setLocaleInit])
  useEffect(() => {
    setChessInit()
  }, [setChessInit])
  useEffect(() => {
    // Ruangan baru langsung dibuka setelah server mengirim kode dan kursi tuan rumah.
    const room = gameRooms.data
    if (!filters.isInviting || !room?.code || !room.token) return
    try {
      window.sessionStorage.setItem(`game-room-${room.code}`, room.token)
    } catch {
      /* penyimpanan bisa ditolak peramban, kursi tetap dikirim lewat permintaan gabung. */
    }
    router.push(`/chess/${room.code}`)
  }, [gameRooms.data, filters.isInviting, router])
  useEffect(() => {
    const game = chessGame.data
    if (!game) return
    const getCue = (kind: GameAudioCue['kind']): GameAudioCue => ({ id: Date.now(), kind })
    if (game.isFinished) {
      const kind = game.resultTitle.includes('You win') ? 'win' : 'lose'
      setFilters((prev) => (prev.cue?.kind === kind ? prev : { ...prev, cue: getCue(kind) }))
      return
    }
    const capturedTotal = game.capturedByPlayer.length + game.capturedByEngine.length
    setFilters((prev) => {
      if (!game.moveTotal || prev.cue?.id === game.moveTotal) return prev
      return { ...prev, cue: { id: game.moveTotal + capturedTotal * 1000, kind: capturedTotal ? 'capture' : 'move' } }
    })
  }, [chessGame])
  useEffect(() => {
    const worker = new Worker('/engine/stockfish-18-lite-single.js')
    worker.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data : ''
      if (line.startsWith('uciok')) worker.postMessage('isready')
      if (line.startsWith('readyok')) setFilters((prev) => ({ ...prev, isEngineReady: true }))
      if (line.startsWith('bestmove')) {
        if (staleSearchRef.current > 0) {
          staleSearchRef.current -= 1
          return
        }
        isSearchingRef.current = false
        const move = line.split(' ')[1]
        setFilters((prev) => ({ ...prev, isThinking: false }))
        if (move && move !== '(none)') {
          setChessMove(move.slice(0, 2), move.slice(2, 4), move.length > 4 ? move[4] : undefined)
        }
      }
    }
    worker.postMessage('uci')
    engineRef.current = worker

    return () => {
      worker.terminate()
      engineRef.current = null
    }
  }, [setChessMove])
  useEffect(() => {
    const game = chessGame.data
    const worker = engineRef.current
    if (!game || !worker || !filters.isEngineReady) return
    if (game.isFinished || filters.isThinking || game.pendingPromotion) return

    // Mode auto: langkah pertama tetap milik pemain, sisanya engine memainkan kedua warna.
    const isEngineTurn = game.turn === 'b' || (filters.activeMode === 'auto' && game.moveTotal > 0)
    if (!isEngineTurn) return

    const level = LEVELS[filters.activeLevel]
    setFilters((prev) => ({ ...prev, isThinking: true }))
    isSearchingRef.current = true
    worker.postMessage(`setoption name Skill Level value ${level.skill}`)
    worker.postMessage(`position fen ${game.fen}`)
    worker.postMessage(`go depth ${level.depth} movetime ${level.movetime}`)
  }, [chessGame, filters.isEngineReady, filters.isThinking, filters.activeLevel, filters.activeMode])

  return (
    <div className="flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-[#0a0a0b] p-3 sm:p-5">
      <div className="flex h-full w-full max-w-[480px] flex-col gap-3">
        <ChessHeader
          onLoadChessExit={loadChessExit}
          isInviteLoading={data.isInviting}
          onSubmitChessInvite={submitChessInvite}
          isUndoDisabled={data.isUndoDisabled}
          onLoadChessUndo={loadChessUndo}
          onLoadChessGuide={loadChessGuide}
          onLoadChessSettings={loadChessSettings}
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

        <ChessCaptured
          label="Opponent"
          pieces={data.capturedByEngine}
          color="w"
          advantage={data.advantage < 0 ? -data.advantage : 0}
        />

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {data.isLoading ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">Preparing board…</p>
          ) : (
            <ChessBoard
              board={data.data}
              lastMove={data.lastMove}
              isLocked={data.isLocked}
              onSubmitChessSquare={submitChessSquare}
            />
          )}
        </main>

        <ChessCaptured
          label="You"
          pieces={data.capturedByPlayer}
          color="b"
          advantage={data.advantage > 0 ? data.advantage : 0}
        />

      </div>

      {data.isSettingsOpen ? (
        <ChessSettings
          modes={data.modes}
          activeMode={data.activeMode}
          levels={data.levels}
          activeLevel={data.activeLevel}
          isUndoDisabled={data.isUndoDisabled}
          isSoundOn={data.isSoundOn}
          onEditChessSound={editChessSound}
          onEditChessMode={editChessMode}
          onEditChessLevel={editChessLevel}
          onLoadChessUndo={loadChessUndo}
          onClearChessGame={clearChessGame}
          onClearChessSettings={clearChessSettings}
        />
      ) : null}

      {data.isPromotionOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#f2ede1]">Promote pawn</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {PROMOTION_CHOICES.map((choice) => (
                <button
                  key={choice.piece}
                  type="button"
                  aria-label={choice.label}
                  onClick={() => submitChessPromotion(choice.piece)}
                  className="rounded-xl border border-[#3a3a42] py-3 text-2xl leading-none text-[#f2ede1] transition-colors hover:border-[#f2ede1]"
                >
                  {choice.glyph}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {data.isFinished ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Game over</p>
            <p className="mt-2 text-2xl font-black uppercase leading-none text-[#f2ede1]">{data.resultTitle}</p>
            <p className="mt-2 text-[13px] font-medium text-[#9aa3b2]">{data.resultSubtitle}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loadChessUndo}
                className="rounded-xl border border-[#3a3a42] py-3 text-[13px] font-semibold text-[#f2ede1] transition-colors hover:border-[#f2ede1]"
              >
                Undo move
              </button>
              <button
                type="button"
                onClick={clearChessGame}
                className="rounded-xl bg-[#f2ede1] py-3 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
              >
                Play again
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi permainan ini akan diakhiri dan kemajuanmu tidak disimpan."
          cancelLabel="Batal"
          confirmLabel="Keluar"
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

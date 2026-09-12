'use client'

import { useEffect, useMemo, useState } from 'react'
import type { UnoColor } from '../types/unoTypes'
import { useUnoStates } from '../states/unoStates'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import { useRouter } from 'next/router'
import { useGameRoomsStates } from '@/features/game-rooms/states/gameRoomsStates'
import { useGameRoomsControllers } from '@/features/game-rooms/controllers/gameRoomsControllers'
import UnoHeader from './UnoHeader'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import UnoBoard from './UnoBoard'
import UnoHand from './UnoHand'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameGuide from '@/shared/components/reusable/GameGuide'

const BOT_TONE = ['bg-[#ffd23f]', 'bg-[#7c3aed]', 'bg-[#23a94a]']
const COLOR_CHOICES: Array<{ color: UnoColor; label: string; tone: string }> = [
  { color: 'red', label: 'Red', tone: 'bg-[#e8202a]' },
  { color: 'yellow', label: 'Yellow', tone: 'bg-[#f7c600]' },
  { color: 'green', label: 'Green', tone: 'bg-[#23a94a]' },
  { color: 'blue', label: 'Blue', tone: 'bg-[#2f5ce0]' },
]

export default function UnoPlay() {
  const {
    unoGame,
    setUnoInit,
    setUnoPlayCard,
    setUnoPlayCards,
    setUnoPickColor,
    setUnoDrawCard,
    setUnoPass,
    setUnoCallUno,
    setUnoBotTurn,
    setUnoRestart,
  } = useUnoStates()
  const { gameRooms } = useGameRoomsStates()
  const { storeGameRooms } = useGameRoomsControllers()
  const router = useRouter()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    isSoundOn: true,
    isInviting: false,
    cue: null as GameAudioCue | null,
    isSelectMode: false,
    selectedCardIds: [] as string[],
  })
  const data = useMemo(() => {
    const game = unoGame.data
    const players = game?.players ?? []
    const human = players[0]
    const topCard = game?.discardPile[game.discardPile.length - 1] ?? null
    const isMyTurn = !!game && game.currentPlayer === 0 && game.winnerId === null
    const handCards = (human?.hand ?? []).map((card) => ({ card }))
    const getSelectedValue = () => {
      const firstId = filters.selectedCardIds[0]
      if (!firstId) return ''
      return handCards.find((item) => item.card.id === firstId)?.card.value ?? ''
    }
    const pendingDrawTotal = game?.pendingDrawTotal ?? 0
    const hasCounterCard = (human?.hand ?? []).some((card) => card.value === 'draw2' || card.value === 'wild4')

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.uno,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: handCards,
      isLoading: unoGame.status === 'loading',
      isError: unoGame.status === 'error',
      isEmpty: unoGame.status === 'success' && !handCards.length,
      emptyTitle: 'Out of cards',
      emptySubtitle: 'You have no cards left, the game is over.',
      emptyImage: '',
      pagination: { currentPage: 1, perPage: 7, totalItem: handCards.length, totalPage: 1 },
      roomCode: game?.roomCode ?? '------',
      turnName: game?.winnerId !== null && game ? 'SELESAI' : (players[game?.currentPlayer ?? 0]?.name ?? '-'),
      drawTotal: game?.drawPile.length ?? 0,
      discardTotal: game?.discardPile.length ?? 0,
      opponents: players.slice(1).map((player, index) => ({
        id: player.id,
        name: player.name,
        cardTotal: player.hand.length,
        tone: BOT_TONE[index % BOT_TONE.length],
        isActive: game?.currentPlayer === player.id && game?.winnerId === null,
      })),
      topCard,
      activeColor: game?.activeColor ?? 'red',
      lastAction: game?.lastAction ?? '',
      cardTotal: human?.hand.length ?? 0,
      isMyTurn,
      isDrawDisabled: !isMyTurn || (pendingDrawTotal > 0 ? hasCounterCard : !!game?.hasDrawnThisTurn),
      isPassVisible: isMyTurn && !!game?.hasDrawnThisTurn,
      pendingDrawTotal,
      isUnoVisible: isMyTurn && (human?.hand.length ?? 0) === 2,
      hasCalledUno: !!human?.hasCalledUno,
      isColorPickerOpen: !!game?.pendingWildCardId,
      isFinished: !!game && game.winnerId !== null,
      winnerName: game && game.winnerId !== null ? (players[game.winnerId]?.name ?? '') : '',
      isWinner: game?.winnerId === 0,
      isSoundOn: filters.isSoundOn,
      isInviting: filters.isInviting,
      cue: filters.cue,
      isSelectMode: filters.isSelectMode,
      isSelectDisabled: !isMyTurn || pendingDrawTotal > 0,
      selectedCardIds: filters.selectedCardIds,
      selectedValue: getSelectedValue(),
      isMultiConfirmDisabled: filters.selectedCardIds.length < 2,
    }
  }, [unoGame, filters, text, activeLocale])
  const submitUnoCard = (cardId: string) => {
    setUnoPlayCard(cardId)
  }
  const loadUnoSelect = () => {
    if (data.isSelectDisabled) return
    setFilters((prev) => ({ ...prev, isSelectMode: true, selectedCardIds: [] }))
  }
  const editUnoSelect = (cardId: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedCardIds: prev.selectedCardIds.includes(cardId)
        ? prev.selectedCardIds.filter((id) => id !== cardId)
        : [...prev.selectedCardIds, cardId],
    }))
  }
  const submitUnoCards = () => {
    if (filters.selectedCardIds.length < 2) return
    setUnoPlayCards(filters.selectedCardIds)
    setFilters((prev) => ({ ...prev, isSelectMode: false, selectedCardIds: [] }))
  }
  const clearUnoSelect = () => {
    setFilters((prev) => ({ ...prev, isSelectMode: false, selectedCardIds: [] }))
  }
  const submitUnoColor = (color: UnoColor) => {
    setUnoPickColor(color)
  }
  const submitUnoCall = () => {
    setUnoCallUno()
  }
  const loadUnoDraw = () => {
    setUnoDrawCard()
  }
  const loadUnoPass = () => {
    setUnoPass()
  }
  const submitUnoInvite = () => {
    setFilters((prev) => ({ ...prev, isInviting: true }))
    storeGameRooms.mutate({ game: 'uno', name: 'Pemain 1' })
  }
  const editUnoSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const clearUnoGame = () => {
    setUnoRestart()
  }

  const loadUnoGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: true }))
  }
  const clearUnoGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: false }))
  }
  const editUnoLocale = (locale: string) => {
    setLocale(locale as LocaleCode)
  }
  const loadUnoExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearUnoExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitUnoExit = () => {
    // Sesi permainan berakhir begitu pemain benar-benar keluar dari halaman.
    window.location.href = '/'
  }
  useEffect(() => {
    // Pilihan bahasa baru dibaca di peramban supaya hasil render server tetap sama.
    setLocaleInit()
  }, [setLocaleInit])
  useEffect(() => {
    // Ruangan baru langsung dibuka setelah server mengirim kode dan kursi tuan rumah.
    const room = gameRooms.data
    if (!filters.isInviting || !room?.code || !room.token) return
    try {
      window.sessionStorage.setItem(`game-room-${room.code}`, room.token)
    } catch {
      /* penyimpanan bisa ditolak peramban, kursi tetap dikirim lewat permintaan gabung. */
    }
    router.push(`/uno/${room.code}`)
  }, [gameRooms.data, filters.isInviting, router])
  useEffect(() => {
    setUnoInit()
  }, [setUnoInit])
  useEffect(() => {
    const game = unoGame.data
    if (!game) return
    const getCue = (kind: GameAudioCue['kind']): GameAudioCue => ({ id: Date.now(), kind })
    if (game.winnerId !== null) {
      const kind = game.winnerId === 0 ? 'win' : 'lose'
      setFilters((prev) => (prev.cue?.kind === kind ? prev : { ...prev, cue: getCue(kind) }))
      return
    }
    setFilters((prev) => {
      const id = game.discardPile.length
      if (!id || prev.cue?.id === id) return prev
      return { ...prev, cue: { id, kind: 'move' } }
    })
  }, [unoGame])
  useEffect(() => {
    // Mode pilih kartu kembar dibatalkan begitu giliran berpindah supaya tidak menunjuk kartu basi.
    if (!data.isMyTurn) {
      setFilters((prev) => (prev.isSelectMode ? { ...prev, isSelectMode: false, selectedCardIds: [] } : prev))
    }
  }, [data.isMyTurn])
  useEffect(() => {
    const game = unoGame.data
    if (!game || game.winnerId !== null || game.currentPlayer === 0) return
    const timer = window.setTimeout(() => setUnoBotTurn(), 900)
    return () => window.clearTimeout(timer)
  }, [unoGame, setUnoBotTurn])

  return (
    <div className="flex h-[100dvh] w-full items-stretch justify-center overflow-hidden bg-[#0a0a0b] p-2 sm:p-4">
      <div className="flex h-full w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[#26262b] bg-[#0f0f11]">
        <GameAudio
          isActive
          isMusicOn={data.isSoundOn}
          isSoundOn={data.isSoundOn}
          bassScale={[123.47, 123.47, 164.81, 146.83]}
          leadScale={[493.88, 587.33, 739.99, 659.25, 587.33, 493.88, 440, 587.33]}
          stepDuration={0.3}
          cue={data.cue}
        />

        <UnoHeader
          onLoadUnoExit={loadUnoExit}
          roomCode={data.roomCode}
          turnName={data.turnName}
          isSoundOn={data.isSoundOn}
          isInviteVisible
          isInviteLoading={data.isInviting}
          onSubmitUnoInvite={submitUnoInvite}
          onLoadUnoGuide={loadUnoGuide}
          onEditUnoSound={editUnoSound}
        />

        {data.isLoading ? (
          <div className="flex flex-1 items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">
            Preparing the table…
          </div>
        ) : (
          <UnoBoard
            opponents={data.opponents}
            topCard={data.topCard}
            activeColor={data.activeColor}
            lastAction={data.lastAction}
            drawTotal={data.drawTotal}
            isDrawDisabled={data.isDrawDisabled}
            onLoadUnoDraw={loadUnoDraw}
          />
        )}

        <UnoHand
          cards={data.data}
          cardTotal={data.cardTotal}
          isDrawDisabled={data.isDrawDisabled}
          isPassVisible={data.isPassVisible}
          isUnoVisible={data.isUnoVisible}
          hasCalledUno={data.hasCalledUno}
          isSelectMode={data.isSelectMode}
          isSelectDisabled={data.isSelectDisabled}
          selectedCardIds={data.selectedCardIds}
          selectedValue={data.selectedValue}
          isMultiConfirmDisabled={data.isMultiConfirmDisabled}
          pendingDrawTotal={data.pendingDrawTotal}
          onSubmitUnoCard={submitUnoCard}
          onLoadUnoDraw={loadUnoDraw}
          onLoadUnoPass={loadUnoPass}
          onSubmitUnoCall={submitUnoCall}
          onLoadUnoSelect={loadUnoSelect}
          onEditUnoSelect={editUnoSelect}
          onSubmitUnoCards={submitUnoCards}
          onClearUnoSelect={clearUnoSelect}
        />
      </div>

      {data.isColorPickerOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#f2ede1]">Pick a color</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {COLOR_CHOICES.map((choice) => (
                <button
                  key={choice.color}
                  type="button"
                  onClick={() => submitUnoColor(choice.color)}
                  className={`rounded-xl py-3 text-[11px] font-semibold uppercase tracking-wide text-[#f2ede1] transition-opacity active:opacity-80 ${choice.tone}`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {data.isFinished ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Permainan selesai</p>
            <p className="mt-2 text-3xl font-black uppercase leading-none text-[#f2ede1] [font-family:'Arial_Black','Archivo_Black',system-ui]">
              {data.isWinner ? 'You win!' : `${data.winnerName} wins`}
            </p>
            <button
              type="button"
              onClick={clearUnoGame}
              className="mt-6 w-full rounded-xl bg-[#f2ede1] py-3 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
            >
              Main lagi
            </button>
          </div>
        </div>
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi permainan ini akan diakhiri dan kemajuanmu tidak disimpan."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          onClearGameExit={clearUnoExit}
          onSubmitGameExit={submitUnoExit}
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
          onEditLocale={editUnoLocale}
          onClearGameGuide={clearUnoGuide}
        />
      ) : null}
    </div>
  )
}

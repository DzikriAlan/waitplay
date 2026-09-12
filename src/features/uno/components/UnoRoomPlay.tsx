'use client'

import { useEffect, useMemo, useState } from 'react'
import type { UnoCard, UnoColor } from '../types/unoTypes'
import { useGameRoomsStates } from '@/features/game-rooms/states/gameRoomsStates'
import { useGameRoomsControllers } from '@/features/game-rooms/controllers/gameRoomsControllers'
import GameRoomsInvite from '@/features/game-rooms/components/GameRoomsInvite'
import GameTurnStatus from '@/shared/components/reusable/GameTurnStatus'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import UnoHeader from './UnoHeader'
import UnoBoard from './UnoBoard'
import UnoHand from './UnoHand'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameGuide from '@/shared/components/reusable/GameGuide'

const OPPONENT_TONE = ['bg-[#ffd23f]', 'bg-[#7c3aed]', 'bg-[#23a94a]']
const COLOR_CHOICES: Array<{ color: UnoColor; label: string; tone: string }> = [
  { color: 'red', label: 'Merah', tone: 'bg-[#e8202a]' },
  { color: 'yellow', label: 'Kuning', tone: 'bg-[#f7c600]' },
  { color: 'green', label: 'Hijau', tone: 'bg-[#23a94a]' },
  { color: 'blue', label: 'Biru', tone: 'bg-[#2f5ce0]' },
]

interface Props {
  code: string
}

export default function UnoRoomPlay({ code }: Props) {
  const { gameRooms, setGameRooms, setGetGameRooms } = useGameRoomsStates()
  const { storeGameRoomsJoin, storeGameRoomsStart, storeGameRoomsMove, storeGameRoomsLeave, storeGameRoomsSeats } =
    useGameRoomsControllers()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    pendingWildCardId: '',
    isCopied: false,
    isSoundOn: true,
    inviteUrl: '',
    cue: null as GameAudioCue | null,
    isSelectMode: false,
    selectedCardIds: [] as string[],
    pagination: { currentPage: 1, perPage: 0, totalItem: 0, totalPage: 1 },
  })
  const data = useMemo(() => {
    const room = gameRooms.data
    const uno = room?.uno ?? null
    const seat = room?.seat ?? ''
    const hand = (uno?.hand ?? []) as UnoCard[]

    const getSeatLabel = (value: string) => `Pemain ${value.replace('p', '')}`
    const getSelectedValue = () => {
      const firstId = filters.selectedCardIds[0]
      if (!firstId) return ''
      return hand.find((item) => item.id === firstId)?.value ?? ''
    }
    const getOpponents = () =>
      (uno?.opponents ?? []).map((opponent, index) => ({
        id: index,
        name: getSeatLabel(opponent.seat),
        cardTotal: opponent.cardTotal,
        tone: OPPONENT_TONE[index % OPPONENT_TONE.length],
        isActive: room?.turn === opponent.seat,
      }))
    const getResultLabel = (winner: string) => {
      if (room?.leftSeat && room.leftSeat !== seat) return 'Lawan keluar, permainan diakhiri'
      if (room?.leftSeat && room.leftSeat === seat) return 'Kamu keluar dari permainan'
      if (!winner) return ''
      return winner === seat ? 'Kamu menang!' : `${getSeatLabel(winner)} menang`
    }

    const isPlaying = room?.status === 'playing'
    const isMyTurn = isPlaying && !!seat && room?.turn === seat
    const isHost = !!seat && seat === room?.hostSeat
    const pendingDrawTotal = uno?.pendingDrawTotal ?? 0
    const hasCounterCard = hand.some((card) => card.value === 'draw2' || card.value === 'wild4')

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.uno,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: hand.map((card) => ({ card })),
      isLoading: gameRooms.status === 'loading' && !room,
      isError: gameRooms.status === 'error',
      isEmpty: gameRooms.status === 'empty',
      emptyTitle: 'Ruangan tidak ditemukan',
      emptySubtitle: 'Periksa kembali tautan undangan yang kamu terima.',
      emptyImage: '',
      pagination: { ...filters.pagination, perPage: hand.length, totalItem: hand.length },
      code,
      seat,
      seatLabel: seat ? getSeatLabel(seat) : 'Penonton',
      turnLabel: isMyTurn ? 'Giliranmu' : 'Giliran lawan',
      // Penanda besar dipakai supaya pemain tahu kenapa kartu belum bisa dibuang.
      statusLabel: !seat
        ? 'Ruangan penuh, kamu menonton'
        : isMyTurn
          ? pendingDrawTotal > 0
            ? `Timpa dengan +2/+4 atau tarik ${pendingDrawTotal} kartu`
            : 'Giliranmu, buang kartu'
          : (room?.rivalOnlineTotal ?? 0) > 0
            ? 'Menunggu langkah lawan'
            : 'Menunggu lawan tersambung',
      isWaiting: isPlaying && !isMyTurn,
      opponents: getOpponents(),
      topCard: (uno?.topCard ?? null) as UnoCard | null,
      activeColor: (uno?.activeColor ?? 'red') as UnoColor,
      lastAction: uno?.lastAction ?? '',
      drawTotal: uno?.drawTotal ?? 0,
      cardTotal: hand.length,
      hasCalledUno: uno?.hasCalledUno ?? false,
      isDrawDisabled:
        !isMyTurn || storeGameRoomsMove.isPending || (pendingDrawTotal > 0 ? hasCounterCard : !!uno?.hasDrawnThisTurn),
      isPassVisible: isMyTurn && !!uno?.hasDrawnThisTurn,
      pendingDrawTotal,
      isUnoVisible: isPlaying && hand.length === 2,
      isColorPickerOpen: !!filters.pendingWildCardId,
      isLobbyOpen: !!room && room.status === 'lobby',
      isStartVisible: isHost,
      seatOptions: room?.seatOptions ?? [],
      isSeatEditable: isHost,
      isSeatLoading: storeGameRoomsSeats.isPending,
      isStartDisabled: (room?.playerTotal ?? 0) < 2 || storeGameRoomsStart.isPending,
      playerTotal: room?.playerTotal ?? 0,
      seatTotal: room?.seatTotal ?? 4,
      inviteUrl: filters.inviteUrl,
      isCopied: filters.isCopied,
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
      isFinished: room?.status === 'finished',
      leftSeat: room?.leftSeat ?? '',
      isLeftByRival: !!room?.leftSeat && room.leftSeat !== seat,
      resultLabel: getResultLabel(room?.winner ?? ''),
      isMyTurn,
      isSelectMode: filters.isSelectMode,
      isSelectDisabled: !isMyTurn || pendingDrawTotal > 0,
      selectedCardIds: filters.selectedCardIds,
      selectedValue: getSelectedValue(),
      isMultiConfirmDisabled: filters.selectedCardIds.length < 2 || storeGameRoomsMove.isPending,
    }
  }, [gameRooms, filters, code, storeGameRoomsMove.isPending, storeGameRoomsStart.isPending, storeGameRoomsSeats.isPending, text, activeLocale])
  const submitUnoCard = (cardId: string) => {
    const room = gameRooms.data
    if (!room || !data.isMyTurn) return

    const getCard = (id: string) => (room.uno?.hand ?? []).find((item) => item.id === id)
    const card = getCard(cardId)
    if (!card) return

    if (card.value === 'wild' || card.value === 'wild4') {
      setFilters((prev) => ({ ...prev, pendingWildCardId: cardId }))
      return
    }
    const getPredictedRoom = () => ({
      ...room,
      uno: room.uno ? { ...room.uno, hand: room.uno.hand.filter((item) => item.id !== cardId) } : room.uno,
    })

    setGameRooms({ status: 'success', data: getPredictedRoom() })
    storeGameRoomsMove.mutate({ code, token: room.token, action: 'play', cardId })
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
    const room = gameRooms.data
    const cardIds = filters.selectedCardIds
    if (!room || !data.isMyTurn || cardIds.length < 2) return

    const getPredictedRoom = () => ({
      ...room,
      uno: room.uno ? { ...room.uno, hand: room.uno.hand.filter((item) => !cardIds.includes(item.id)) } : room.uno,
    })

    setGameRooms({ status: 'success', data: getPredictedRoom() })
    storeGameRoomsMove.mutate({ code, token: room.token, action: 'play', cardIds })
    setFilters((prev) => ({ ...prev, isSelectMode: false, selectedCardIds: [] }))
  }
  const clearUnoSelect = () => {
    setFilters((prev) => ({ ...prev, isSelectMode: false, selectedCardIds: [] }))
  }
  const submitUnoColor = (color: UnoColor) => {
    const room = gameRooms.data
    if (!room || !filters.pendingWildCardId) return
    storeGameRoomsMove.mutate({
      code,
      token: room.token,
      action: 'play',
      cardId: filters.pendingWildCardId,
      color,
    })
    setFilters((prev) => ({ ...prev, pendingWildCardId: '' }))
  }
  const submitUnoCall = () => {
    const room = gameRooms.data
    if (!room) return
    storeGameRoomsMove.mutate({ code, token: room.token, action: 'uno' })
  }
  const loadUnoDraw = () => {
    const room = gameRooms.data
    if (!room || data.isDrawDisabled) return
    storeGameRoomsMove.mutate({ code, token: room.token, action: 'draw' })
  }
  const loadUnoPass = () => {
    const room = gameRooms.data
    if (!room) return
    storeGameRoomsMove.mutate({ code, token: room.token, action: 'pass' })
  }
  const submitGameRoomsStart = () => {
    const room = gameRooms.data
    if (!room) return
    storeGameRoomsStart.mutate({ code, token: room.token })
  }
  const editGameRoomsSeats = (seatTotal: number) => {
    const room = gameRooms.data
    if (!room) return
    storeGameRoomsSeats.mutate({ code, token: room.token, seatTotal })
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
  const editUnoSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const clearUnoRoom = () => {
    window.location.href = data.isLeftByRival ? '/' : '/uno'
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
    setFilters((prev) => ({ ...prev, inviteUrl: `${window.location.origin}/uno/${code}` }))
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
    // Kartu masuk ke tumpukan buangan dan kemenangan/kekalahan dijadikan penanda bunyi, sama seperti
    // mode solo vs bot, supaya ruangan daring tidak lagi bisu.
    const room = gameRooms.data
    if (!room) return
    const getCue = (kind: GameAudioCue['kind']): GameAudioCue => ({ id: Date.now(), kind })
    if (room.status === 'finished' && room.winner) {
      const kind = room.winner === room.seat ? 'win' : 'lose'
      setFilters((prev) => (prev.cue?.kind === kind ? prev : { ...prev, cue: getCue(kind) }))
      return
    }
    const id = room.uno?.discardTotal ?? 0
    setFilters((prev) => {
      if (!id || prev.cue?.id === id) return prev
      return { ...prev, cue: { id, kind: 'move' } }
    })
  }, [gameRooms.data])
  useEffect(() => {
    // Mode pilih kartu kembar dibatalkan begitu giliran berpindah supaya tidak menunjuk kartu basi.
    if (!data.isMyTurn) {
      setFilters((prev) => (prev.isSelectMode ? { ...prev, isSelectMode: false, selectedCardIds: [] } : prev))
    }
  }, [data.isMyTurn])

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
          roomCode={data.code}
          turnName={data.turnLabel}
          isSoundOn={data.isSoundOn}
          onLoadUnoGuide={loadUnoGuide}
          onEditUnoSound={editUnoSound}
        />

        <GameTurnStatus label={data.statusLabel} isWaiting={data.isWaiting} className="mx-3 mt-2" />

        {data.isLoading ? (
          <div className="flex flex-1 items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">
            Menyiapkan meja…
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

      {data.isLobbyOpen ? (
        <GameRoomsInvite
          code={data.code}
          inviteUrl={data.inviteUrl}
          playerTotal={data.playerTotal}
          seatTotal={data.seatTotal}
          isCopied={data.isCopied}
          seatOptions={data.seatOptions}
          isSeatEditable={data.isSeatEditable}
          isSeatLoading={data.isSeatLoading}
          onEditGameRoomsSeats={editGameRoomsSeats}
          isStartVisible={data.isStartVisible}
          isStartDisabled={data.isStartDisabled}
          onSubmitGameRoomsInvite={submitGameRoomsInvite}
          onSubmitGameRoomsStart={submitGameRoomsStart}
        />
      ) : null}

      {data.isColorPickerOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Pilih warna</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {COLOR_CHOICES.map((choice) => (
                <button
                  key={choice.color}
                  type="button"
                  aria-label={choice.label}
                  onClick={() => submitUnoColor(choice.color)}
                  className={`h-12 rounded-xl transition-opacity active:opacity-80 ${choice.tone}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {data.isFinished ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Permainan selesai</p>
            <p className="mt-2 text-2xl font-black uppercase leading-none text-[#f2ede1]">{data.resultLabel}</p>
            <button
              type="button"
              onClick={clearUnoRoom}
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

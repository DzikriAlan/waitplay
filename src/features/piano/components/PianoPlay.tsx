'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePianoStates } from '../states/pianoStates'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import GameTurnStatus from '@/shared/components/reusable/GameTurnStatus'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import GameGuide from '@/shared/components/reusable/GameGuide'
import PianoAudio, { type PianoAudioCue } from './PianoAudio'
import PianoHeader from './PianoHeader'
import PianoSongs from './PianoSongs'
import PianoBoard from './PianoBoard'
import PianoResult from './PianoResult'

const LANE_KEYS: Record<string, number> = {
  d: 0,
  f: 1,
  j: 2,
  k: 3,
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
}
const JUDGEMENT_LIFE = 420

export default function PianoPlay() {
  const {
    pianoLibrary,
    pianoGame,
    setPianoInit,
    setPianoSong,
    setPianoTick,
    setPianoHit,
    setPianoPause,
    setPianoResume,
    setPianoRestart,
    setPianoReset,
  } = usePianoStates()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const [filters, setFilters] = useState({
    isGuideOpen: false,
    isExitOpen: false,
    isSoundOn: true,
    lastJudgementId: 0,
    judgementLabel: '',
    judgementKind: '',
    judgementLane: -1,
    cue: null as PianoAudioCue | null,
    pagination: { currentPage: 1, perPage: 0, totalItem: 0, totalPage: 1 },
  })
  const data = useMemo(() => {
    // Nilai tampilan dirapikan sekali di sini supaya papan hanya menerima angka siap pakai.
    const getAccuracyLabel = (value: number) => `${Math.round(value * 100)}%`
    const getStatusLabel = (isPlaying: boolean, countdown: number, isOver: boolean) => {
      if (!isPlaying) return 'Pilih lagu untuk mulai bermain'
      if (isOver) return 'Lagu selesai'
      if (countdown) return 'Bersiap…'
      return 'Tekan tepat saat nada menyentuh garis'
    }

    const songs = pianoLibrary.data?.songs ?? []
    const game = pianoGame.data
    const isPlaying = !!game
    const isOver = !!game?.isOver
    const countdown = game?.countdown ?? 0

    return {
      isGuideOpen: filters.isGuideOpen,
      guide: text.guide,
      guideText: text.guide.games.piano,
      activeLocale,
      switchLabel: text.locale.switch,
      isExitOpen: filters.isExitOpen,
      data: songs,
      isLoading: pianoLibrary.status === 'loading',
      isError: pianoLibrary.status === 'error',
      isEmpty: pianoLibrary.status === 'success' && !songs.length,
      emptyTitle: 'Daftar lagu kosong',
      emptySubtitle: 'Muat ulang halaman untuk mengambil daftar lagu.',
      emptyImage: '',
      pagination: { ...filters.pagination, perPage: songs.length, totalItem: songs.length },
      songs,
      lanes: game?.lanes ?? [],
      tiles: game?.tiles ?? [],
      track: game?.track ?? [],
      trackKey: game?.trackKey ?? '',
      elapsed: game?.elapsed ?? 0,
      songTitle: game?.songTitle ?? '',
      songArtist: game?.songArtist ?? '',
      score: game?.score ?? 0,
      bestScore: game?.bestScore ?? 0,
      combo: game?.combo ?? 0,
      bestCombo: game?.bestCombo ?? 0,
      perfectTotal: game?.perfectTotal ?? 0,
      goodTotal: game?.goodTotal ?? 0,
      missTotal: game?.missTotal ?? 0,
      accuracyLabel: getAccuracyLabel(game?.accuracy ?? 0),
      progress: game?.progress ?? 0,
      countdown,
      judgementId: game?.judgement?.id ?? 0,
      judgementKind: game?.judgement?.kind ?? '',
      judgementFrequency: game?.judgement?.frequency ?? 0,
      judgementNoteLabel: game?.judgement?.label ?? '',
      judgementLabel: filters.judgementLabel,
      judgementFlashKind: filters.judgementKind,
      judgementLane: game?.judgement?.lane ?? -1,
      activeLane: filters.judgementLane,
      statusLabel: getStatusLabel(isPlaying, countdown, isOver),
      isWaiting: !isPlaying || isOver,
      isPlaying,
      isPaused: !!game?.isPaused,
      isOver,
      resultLabel: (game?.missTotal ?? 0) ? 'Lagu selesai' : 'Tanpa meleset',
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
    }
  }, [pianoLibrary, pianoGame, filters, text, activeLocale])
  const submitPianoSong = (songId: string) => {
    setFilters((prev) => ({ ...prev, judgementLabel: '', judgementKind: '', judgementLane: -1, cue: null, lastJudgementId: 0 }))
    setPianoSong(songId)
  }
  const submitPianoHit = (lane: number) => {
    setPianoHit(lane)
  }
  const editPianoSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const clearPianoGame = () => {
    setFilters((prev) => ({ ...prev, judgementLabel: '', judgementKind: '', judgementLane: -1, cue: null, lastJudgementId: 0 }))
    setPianoRestart()
  }
  const loadPianoSongs = () => {
    setFilters((prev) => ({ ...prev, judgementLabel: '', judgementKind: '', judgementLane: -1, cue: null, lastJudgementId: 0 }))
    setPianoReset()
  }
  const loadPianoGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: true }))
  }
  const clearPianoGuide = () => {
    setFilters((prev) => ({ ...prev, isGuideOpen: false }))
  }
  const editPianoLocale = (locale: string) => {
    setLocale(locale as LocaleCode)
  }
  const loadPianoExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearPianoExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitPianoExit = () => {
    // Sesi permainan berakhir begitu pemain benar-benar keluar dari halaman.
    window.location.href = '/'
  }
  useEffect(() => {
    // Pilihan bahasa baru dibaca di peramban supaya hasil render server tetap sama.
    setLocaleInit()
  }, [setLocaleInit])
  useEffect(() => {
    setPianoInit()
  }, [setPianoInit])
  useEffect(() => {
    // Nada bergerak setiap gambar layar supaya jatuhnya terlihat mulus di semua peranti.
    if (!data.isPlaying || data.isOver || data.isPaused) return
    let frameId = 0
    const loadPianoFrame = () => {
      setPianoTick()
      frameId = window.requestAnimationFrame(loadPianoFrame)
    }
    frameId = window.requestAnimationFrame(loadPianoFrame)
    return () => window.cancelAnimationFrame(frameId)
  }, [data.isPlaying, data.isOver, data.isPaused, setPianoTick])
  useEffect(() => {
    // Papan tetap bisa dimainkan dengan papan ketik di layar lebar.
    const loadKeyboard = (event: KeyboardEvent) => {
      if (event.repeat) return
      const lane = LANE_KEYS[event.key.toLowerCase()]
      if (lane === undefined) return
      event.preventDefault()
      setPianoHit(lane)
    }

    window.addEventListener('keydown', loadKeyboard)
    return () => window.removeEventListener('keydown', loadKeyboard)
  }, [setPianoHit])
  useEffect(() => {
    // Papan dihentikan sementara selama panduan atau konfirmasi keluar sedang terbuka.
    if (filters.isGuideOpen || filters.isExitOpen) {
      setPianoPause()
      return
    }
    setPianoResume()
  }, [filters.isGuideOpen, filters.isExitOpen, setPianoPause, setPianoResume])
  useEffect(() => {
    if (!data.judgementId || data.judgementId === filters.lastJudgementId) return
    setFilters((prev) => ({
      ...prev,
      lastJudgementId: data.judgementId,
      judgementLabel: data.judgementNoteLabel,
      judgementKind: data.judgementKind,
      judgementLane: data.judgementKind === 'miss' ? -1 : data.judgementLane,
      cue: { id: data.judgementId, kind: data.judgementKind, frequency: data.judgementFrequency },
    }))
  }, [
    data.judgementId,
    data.judgementKind,
    data.judgementFrequency,
    data.judgementNoteLabel,
    data.judgementLane,
    filters.lastJudgementId,
  ])
  useEffect(() => {
    // Penanda ketukan dan sorotan tuts hilang sendiri sesaat setelah ketukan terakhir.
    if (!filters.lastJudgementId) return
    const timer = window.setTimeout(
      () =>
        setFilters((prev) =>
          prev.judgementLabel || prev.judgementLane >= 0
            ? { ...prev, judgementLabel: '', judgementKind: '', judgementLane: -1 }
            : prev,
        ),
      JUDGEMENT_LIFE,
    )
    return () => window.clearTimeout(timer)
  }, [filters.lastJudgementId])
  useEffect(() => {
    if (!data.isOver) return
    setFilters((prev) => (prev.cue?.kind === 'win' ? prev : { ...prev, cue: { id: Date.now(), kind: 'win', frequency: 0 } }))
  }, [data.isOver])

  return (
    <div className="flex h-[100dvh] w-full touch-none items-stretch justify-center overflow-hidden overscroll-none bg-[#0a0a0b] p-2 sm:p-4">
      <div className="flex h-full w-full max-w-[480px] flex-col gap-3">
        <PianoHeader
          onLoadPianoExit={loadPianoExit}
          isSoundOn={data.isSoundOn}
          onLoadPianoGuide={loadPianoGuide}
          onEditPianoSound={editPianoSound}
        />

        <PianoAudio
          isActive
          isSoundOn={data.isSoundOn}
          isPlaying={data.isPlaying}
          isPaused={data.isPaused}
          elapsed={data.elapsed}
          track={data.track}
          trackKey={data.trackKey}
          cue={data.cue}
        />

        <GameTurnStatus label={data.statusLabel} isWaiting={data.isWaiting} className="h-[38px] py-0" />

        <main className="flex min-h-0 flex-1 items-stretch justify-center">
          {data.isLoading ? (
            <p className="self-center text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">
              Menyiapkan lagu…
            </p>
          ) : null}

          {!data.isLoading && !data.isPlaying ? (
            <PianoSongs
              songs={data.songs}
              emptyTitle={data.emptyTitle}
              emptySubtitle={data.emptySubtitle}
              isEmpty={data.isEmpty}
              onSubmitPianoSong={submitPianoSong}
            />
          ) : null}

          {!data.isLoading && data.isPlaying ? (
            <PianoBoard
              lanes={data.lanes}
              tiles={data.tiles}
              countdown={data.countdown}
              combo={data.combo}
              progress={data.progress}
              judgementLabel={data.judgementLabel}
              judgementKind={data.judgementFlashKind}
              activeLane={data.activeLane}
              songTitle={data.songTitle}
              songArtist={data.songArtist}
              isPaused={data.isPaused}
              onSubmitPianoHit={submitPianoHit}
            />
          ) : null}
        </main>

        <footer className="grid shrink-0 grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Skor</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.score}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Akurasi</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.accuracyLabel}</span>
          </div>
          {data.isPlaying ? (
            <button
              type="button"
              onClick={loadPianoSongs}
              className="rounded-xl bg-[#f2ede1] py-2 text-[12px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
            >
              Ganti lagu
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
              <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Lagu</span>
              <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.songs.length}</span>
            </div>
          )}
        </footer>
      </div>

      {data.isOver ? (
        <PianoResult
          resultLabel={data.resultLabel}
          songTitle={data.songTitle}
          score={data.score}
          bestScore={data.bestScore}
          accuracyLabel={data.accuracyLabel}
          bestCombo={data.bestCombo}
          perfectTotal={data.perfectTotal}
          goodTotal={data.goodTotal}
          missTotal={data.missTotal}
          onClearPianoGame={clearPianoGame}
          onLoadPianoSongs={loadPianoSongs}
        />
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi permainan ini akan diakhiri dan kemajuanmu tidak disimpan."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          onClearGameExit={clearPianoExit}
          onSubmitGameExit={submitPianoExit}
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
          onEditLocale={editPianoLocale}
          onClearGameGuide={clearPianoGuide}
        />
      ) : null}
    </div>
  )
}

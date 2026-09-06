'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRubikStates } from '../states/rubikStates'
import type { RubikTurnKey } from '@/shared/lib/rubikEngine'
import GameAudio, { type GameAudioCue } from '@/shared/components/reusable/GameAudio'
import GameTurnStatus from '@/shared/components/reusable/GameTurnStatus'
import GameExitConfirm from '@/shared/components/reusable/GameExitConfirm'
import RubikHeader from './RubikHeader'
import RubikControls from './RubikControls'
import RubikResult from './RubikResult'

// Three.js hanya dibutuhkan setelah kubusnya benar-benar digambar, jadi dipisah dari muatan awal
// halaman supaya pengunjung tidak mengunduh dan mengurai pustaka tiga dimensi lebih dulu.
const RubikCube = dynamic(() => import('./RubikCube'), { ssr: false })

export default function RubikPlay() {
  const { rubikGame, setRubikInit, setRubikTurn, setRubikScramble, setRubikRestart } = useRubikStates()
  const [filters, setFilters] = useState({
    isExitOpen: false,
    isSoundOn: true,
    isScrambled: false,
    startedAt: 0,
    elapsed: 0,
    cue: null as GameAudioCue | null,
    pagination: { currentPage: 1, perPage: 0, totalItem: 0, totalPage: 1 },
  })
  const data = useMemo(() => {
    const game = rubikGame.data
    const facelets = game?.facelets ?? []

    const getTimeLabel = (seconds: number) => {
      const minute = Math.floor(seconds / 60)
      const second = seconds % 60
      return `${minute}:${String(second).padStart(2, '0')}`
    }
    const isSolved = !!game?.isSolved
    const isFinished = isSolved && filters.isScrambled

    return {
      isExitOpen: filters.isExitOpen,
      data: facelets,
      isLoading: rubikGame.status === 'loading',
      isError: rubikGame.status === 'error',
      isEmpty: rubikGame.status === 'success' && !facelets.length,
      emptyTitle: 'Kubus belum siap',
      emptySubtitle: 'Muat ulang halaman untuk memulai permainan baru.',
      emptyImage: '',
      pagination: { ...filters.pagination, perPage: facelets.length, totalItem: facelets.length },
      facelets,
      turn: game?.turn ?? null,
      moveTotal: game?.moveTotal ?? 0,
      scrambleTotal: game?.scrambleTotal ?? 0,
      timeLabel: getTimeLabel(filters.elapsed),
      // Penanda besar dipakai supaya pemain tahu kubus sedang dinilai rapi atau masih teracak.
      statusLabel: isFinished
        ? 'Kubus berhasil dirapikan'
        : filters.isScrambled
          ? 'Rapikan setiap sisi kubus'
          : 'Tekan acak untuk mulai bermain',
      hintLabel: 'Geser permukaan kubus untuk memutar lapisannya',
      scrambleLabel: filters.isScrambled ? 'Acak ulang' : 'Acak kubus',
      isWaiting: !filters.isScrambled,
      isFinished,
      isScrambled: filters.isScrambled,
      resultLabel: 'Selesai',
      isSoundOn: filters.isSoundOn,
      cue: filters.cue,
    }
  }, [rubikGame, filters])
  const submitRubikTurn = (turn: RubikTurnKey, isPrime: boolean) => {
    setRubikTurn(turn, isPrime)
    setFilters((prev) => ({ ...prev, cue: { id: Date.now(), kind: 'move' } }))
  }
  const editRubikSound = () => {
    setFilters((prev) => ({ ...prev, isSoundOn: !prev.isSoundOn }))
  }
  const submitRubikScramble = () => {
    setRubikScramble()
    setFilters((prev) => ({ ...prev, isScrambled: true, startedAt: Date.now(), elapsed: 0, cue: null }))
  }
  const clearRubikGame = () => {
    setRubikRestart()
    setFilters((prev) => ({ ...prev, isScrambled: false, startedAt: 0, elapsed: 0, cue: null }))
  }

  const loadRubikExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: true }))
  }
  const clearRubikExit = () => {
    setFilters((prev) => ({ ...prev, isExitOpen: false }))
  }
  const submitRubikExit = () => {
    // Sesi permainan berakhir begitu pemain benar-benar keluar dari halaman.
    window.location.href = '/'
  }
  useEffect(() => {
    setRubikInit()
  }, [setRubikInit])
  useEffect(() => {
    // Waktu hanya berjalan setelah kubus diacak dan berhenti begitu semua sisi rapi.
    if (!filters.isScrambled || !filters.startedAt || data.isFinished) return
    const timer = window.setInterval(() => {
      setFilters((prev) => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startedAt) / 1000) }))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [filters.isScrambled, filters.startedAt, data.isFinished])
  useEffect(() => {
    if (!data.isFinished) return
    setFilters((prev) => (prev.cue?.kind === 'win' ? prev : { ...prev, cue: { id: Date.now(), kind: 'win' } }))
  }, [data.isFinished])

  return (
    <div className="flex h-[100dvh] w-full touch-none items-stretch justify-center overflow-hidden overscroll-none bg-[#0a0a0b] p-2 sm:p-4">
      <div className="flex h-full w-full max-w-[480px] flex-col gap-3">
        <RubikHeader onLoadRubikExit={loadRubikExit} isSoundOn={data.isSoundOn} onEditRubikSound={editRubikSound} />

        <GameAudio
          isActive
          isMusicOn={data.isSoundOn}
          isSoundOn={data.isSoundOn}
          bassScale={[130.81, 146.83, 174.61, 146.83]}
          leadScale={[523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440, 493.88]}
          stepDuration={0.3}
          cue={data.cue}
        />

        <GameTurnStatus label={data.statusLabel} isWaiting={data.isWaiting} />

        <main className="flex min-h-0 flex-1 items-stretch justify-center">
          {data.isLoading || !data.facelets.length ? (
            <p className="self-center text-xs font-semibold uppercase tracking-[0.3em] text-[#a29d93]">
              Menyiapkan kubus…
            </p>
          ) : (
            <div className="h-full w-full overflow-hidden rounded-2xl border border-[#26262b] bg-[#121214]">
              <RubikCube
                isActive
                facelets={data.facelets}
                turn={data.turn}
                onSubmitRubikTurn={submitRubikTurn}
              />
            </div>
          )}
        </main>

        <RubikControls
          hintLabel={data.hintLabel}
          scrambleLabel={data.scrambleLabel}
          onSubmitRubikScramble={submitRubikScramble}
        />

        <footer className="grid shrink-0 grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Langkah</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.moveTotal}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] py-2">
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Waktu</span>
            <span className="text-[13px] font-black leading-none text-[#f2ede1]">{data.timeLabel}</span>
          </div>
          <button
            type="button"
            onClick={clearRubikGame}
            className="rounded-xl bg-[#f2ede1] py-2 text-[12px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
          >
            Reset
          </button>
        </footer>
      </div>

      {data.isFinished ? (
        <RubikResult
          resultLabel={data.resultLabel}
          moveTotal={data.moveTotal}
          timeLabel={data.timeLabel}
          scrambleTotal={data.scrambleTotal}
          onClearRubikGame={submitRubikScramble}
        />
      ) : null}
      {data.isExitOpen ? (
        <GameExitConfirm
          title="Keluar dari permainan?"
          subtitle="Sesi permainan ini akan diakhiri dan kemajuanmu tidak disimpan."
          cancelLabel="Batal"
          confirmLabel="Keluar"
          onClearGameExit={clearRubikExit}
          onSubmitGameExit={submitRubikExit}
        />
      ) : null}
    </div>
  )
}

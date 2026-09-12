'use client'

import GameSoundToggle from '@/shared/components/reusable/GameSoundToggle'

interface Props {
  onLoadChessExit: () => void
  seatLabel: string
  turnLabel: string
  moveTotal: number
  code: string
  isSoundOn: boolean
  onLoadChessGuide: () => void
  onEditChessSound: () => void
}

export default function ChessRoomHeader({
  onLoadChessExit,
  seatLabel,
  turnLabel,
  moveTotal,
  code,
  isSoundOn,
  onLoadChessGuide,
  onEditChessSound,
}: Props) {
  return (
    <header className="flex min-h-[48px] shrink-0 items-stretch gap-2">
      <button
        type="button"
        onClick={onLoadChessExit}
        aria-label="Kembali ke catur solo"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#26262b] bg-[#121214] px-2 transition-colors hover:border-[#43434d] sm:px-3"
      >
        <span className="text-[10px] leading-none text-[#a29d93]">&#9664;</span>
        <span className="text-sm font-black uppercase leading-none tracking-tighter text-[#f2ede1] sm:text-base">
          Chess
        </span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-[#26262b] bg-[#121214] px-2 sm:px-3">
        <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">{seatLabel}</span>
        <span className="truncate text-[8px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">{turnLabel}</span>
        <span className="shrink-0 text-sm font-black leading-none text-[#f0b429]">{moveTotal}</span>
      </div>

      <button
        type="button"
        aria-label="Panduan permainan"
        onClick={onLoadChessGuide}
        className="flex w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] text-[#f2ede1] transition-colors hover:border-[#43434d]"
      >
        <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.4a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.9.7-.9 1.3v.5" strokeLinecap="round" />
          <path d="M12 17h.01" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] px-2 py-2 sm:px-3">
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Ruangan</span>
        <span className="text-[13px] font-black leading-none text-[#f2ede1]">{code}</span>
      </div>

      <GameSoundToggle isSoundOn={isSoundOn} className="w-[38px] shrink-0" onEditGameSound={onEditChessSound} />
    </header>
  )
}

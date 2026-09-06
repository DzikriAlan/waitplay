'use client'

import GameSoundToggle from '@/shared/components/reusable/GameSoundToggle'

interface Props {
  onLoadPianoExit: () => void
  isSoundOn: boolean
  onLoadPianoGuide: () => void
  onEditPianoSound: () => void
}

export default function PianoHeader({ onLoadPianoExit, isSoundOn, onLoadPianoGuide, onEditPianoSound }: Props) {
  return (
    <header className="shrink-0 space-y-3">
      <div className="flex min-h-[48px] items-stretch gap-2">
        <button
          type="button"
          onClick={onLoadPianoExit}
          aria-label="Back to Waitplay Game Collection"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#26262b] bg-[#121214] px-2 transition-colors hover:border-[#43434d] sm:px-3"
        >
          <span className="text-[10px] leading-none text-[#a29d93]">&#9664;</span>
          <span className="text-sm font-black uppercase leading-none tracking-tighter text-[#f2ede1] sm:text-base">
            Piano
          </span>
        </button>

        <div className="flex-1" />

        <button
          type="button"
          aria-label="Panduan permainan"
          onClick={onLoadPianoGuide}
          className="flex w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] text-[#f2ede1] transition-colors hover:border-[#43434d]"
        >
          <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.6 9.4a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.9.7-.9 1.3v.5" strokeLinecap="round" />
            <path d="M12 17h.01" strokeLinecap="round" />
          </svg>
        </button>

        <GameSoundToggle isSoundOn={isSoundOn} className="w-[38px] shrink-0" onEditGameSound={onEditPianoSound} />
      </div>
    </header>
  )
}

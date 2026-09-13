'use client'


interface Props {
  onLoadChessExit: () => void
  isInviteLoading?: boolean
  onSubmitChessInvite?: () => void
  isUndoDisabled: boolean
  onLoadChessUndo: () => void
  onLoadChessGuide: () => void
  onLoadChessSettings: () => void
}

export default function ChessHeader({
  onLoadChessExit,
  isInviteLoading = false,
  onSubmitChessInvite,
  isUndoDisabled,
  onLoadChessUndo,
  onLoadChessGuide,
  onLoadChessSettings,
}: Props) {
  return (
    <header className="flex shrink-0 items-center gap-2">
      <button
          type="button"
          onClick={onLoadChessExit}
        aria-label="Back to Waitplay Game Collection"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#26262b] bg-[#121214] px-3 py-2 transition-colors hover:border-[#43434d]"
      >
        <span className="text-[10px] leading-none text-[#a29d93]">&#9664;</span>
        <span className="text-base font-black uppercase leading-none tracking-tighter text-[#f2ede1]">Chess</span>
      </button>

      <button
        type="button"
        disabled={isInviteLoading}
        onClick={onSubmitChessInvite}
        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#26262b] bg-[#121214] px-2 py-2 text-[#f2ede1] transition-colors hover:border-[#43434d] disabled:opacity-45"
      >
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" strokeLinecap="round" />
          <path d="M18 8v6M21 11h-6" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
          {isInviteLoading ? 'Menyiapkan…' : 'Main berdua'}
        </span>
      </button>

      {/* Undo ditaruh di topbar supaya langsung terlihat tanpa harus membuka pengaturan. */}
      <button
        type="button"
        aria-label="Undo move"
        disabled={isUndoDisabled}
        onClick={onLoadChessUndo}
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] text-[#f2ede1] transition-colors hover:border-[#43434d] disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 14 4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Panduan permainan"
        onClick={onLoadChessGuide}
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] text-[#f2ede1] transition-colors hover:border-[#43434d]"
      >
        <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.4a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.9.7-.9 1.3v.5" strokeLinecap="round" />
          <path d="M12 17h.01" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Open settings"
        onClick={onLoadChessSettings}
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#26262b] bg-[#121214] text-[#f2ede1] transition-colors hover:border-[#43434d]"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3.4" />
          <path
            d="M19.1 14.4a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V21a2 2 0 1 1-4 0v-.06a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.03H3a2 2 0 1 1 0-4h.06a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.08 3.6V3a2 2 0 1 1 4 0v.06a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1.03H21a2 2 0 1 1 0 4h-.06a1.7 1.7 0 0 0-1.55 1.03z"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  )
}

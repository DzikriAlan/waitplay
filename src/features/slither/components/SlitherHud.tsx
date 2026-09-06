'use client'

interface LeaderRow {
  playerId: string
  name: string
  score: number
  isSelf: boolean
}

interface Props {
  score: number
  isDead: boolean
  isFullscreen: boolean
  leaderboard: LeaderRow[]
  onSubmitSlitherRespawn: () => void
  onLoadSlitherExit: () => void
  onEditSlitherFullscreen: () => void
}

export default function SlitherHud({
  score,
  isDead,
  isFullscreen,
  leaderboard,
  onSubmitSlitherRespawn,
  onLoadSlitherExit,
  onEditSlitherFullscreen,
}: Props) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        {leaderboard.length ? (
          <div className="pointer-events-auto w-fit rounded-xl border border-[#26262b] bg-[#121214]/90 px-3 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#a29d93]">Papan skor</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {leaderboard.map((row, index) => (
                <li
                  key={row.playerId}
                  className={`flex items-center gap-2 rounded-md px-1 text-[11px] ${
                    row.isSelf ? 'bg-[#f2ede1]/10 text-[#f2ede1]' : 'text-[#a29d93]'
                  }`}
                >
                  <span className="w-4 text-right font-black">{index + 1}</span>
                  <span className="max-w-[120px] truncate font-semibold">{row.name}</span>
                  <span className="ml-auto font-black">{row.score}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            onClick={onEditSlitherFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3a42] bg-[#121214]/90 text-[#f2ede1]"
          >
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              {isFullscreen ? (
                <path d="M9 4v5H4M15 4v5h5M15 20v-5h5M9 20v-5H4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={onLoadSlitherExit}
            className="rounded-full border border-[#3a3a42] bg-[#121214]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ede1]"
          >
            Keluar
          </button>
        </div>
      </div>

      {isDead ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-[320px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
            <p className="text-base font-black uppercase tracking-tight text-[#f2ede1]">Ular kamu mati</p>
            <p className="mt-2 text-[12px] text-[#9aa3b2]">Skor akhir {score}. Coba lagi dari tengah arena.</p>
            <button
              type="button"
              onClick={onSubmitSlitherRespawn}
              className="mt-5 w-full rounded-xl bg-[#f2ede1] py-3 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
            >
              Main lagi
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

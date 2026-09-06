'use client'

interface LeaderRow {
  playerId: string
  name: string
  score: number
  isSelf: boolean
}

interface Props {
  score: number
  roomCode: string
  playersOnline: number
  isSolo: boolean
  isDead: boolean
  leaderboard: LeaderRow[]
  onSubmitSlitherRespawn: () => void
  onLoadSlitherExit: () => void
}

export default function SlitherHud({
  score,
  roomCode,
  playersOnline,
  isSolo,
  isDead,
  leaderboard,
  onSubmitSlitherRespawn,
  onLoadSlitherExit,
}: Props) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-auto rounded-xl border border-[#26262b] bg-[#121214]/90 px-3 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#a29d93]">Skor</p>
            <p className="text-[18px] font-black leading-none text-[#f2ede1]">{score}</p>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onLoadSlitherExit}
              className="rounded-full border border-[#3a3a42] bg-[#121214]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2ede1]"
            >
              Keluar
            </button>
            <div className="rounded-xl border border-[#26262b] bg-[#121214]/90 px-3 py-2 text-right">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#a29d93]">
                Ruangan {roomCode}
              </p>
              <p className="text-[11px] font-bold text-[#f2ede1]">
                {isSolo ? 'Solo' : `${playersOnline} pemain online`}
              </p>
            </div>
          </div>
        </div>

        {leaderboard.length ? (
          <div className="pointer-events-auto w-fit rounded-xl border border-[#26262b] bg-[#121214]/90 px-3 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#a29d93]">Papan skor</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {leaderboard.map((row, index) => (
                <li
                  key={row.playerId}
                  className={`flex items-center gap-2 text-[11px] ${row.isSelf ? 'text-[#f2ede1]' : 'text-[#a29d93]'}`}
                >
                  <span className="w-4 text-right font-black">{index + 1}</span>
                  <span className="max-w-[120px] truncate font-semibold">{row.name}</span>
                  <span className="ml-auto font-black">{row.score}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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

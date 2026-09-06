'use client'

interface Props {
  resultLabel: string
  songTitle: string
  score: number
  bestScore: number
  accuracyLabel: string
  bestCombo: number
  perfectTotal: number
  goodTotal: number
  missTotal: number
  onClearPianoGame: () => void
  onLoadPianoSongs: () => void
}

export default function PianoResult({
  resultLabel,
  songTitle,
  score,
  bestScore,
  accuracyLabel,
  bestCombo,
  perfectTotal,
  goodTotal,
  missTotal,
  onClearPianoGame,
  onLoadPianoSongs,
}: Props) {
  const stats = [
    { id: 'perfect', label: 'Tepat', value: String(perfectTotal) },
    { id: 'good', label: 'Bagus', value: String(goodTotal) },
    { id: 'miss', label: 'Meleset', value: String(missTotal) },
    { id: 'combo', label: 'Rentetan', value: `${bestCombo}x` },
    { id: 'accuracy', label: 'Akurasi', value: accuracyLabel },
    { id: 'best', label: 'Terbaik', value: String(bestScore) },
  ]

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-2xl border border-[#26262b] bg-[#121214] p-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">{resultLabel}</p>
        <p className="mt-2 truncate text-2xl font-black uppercase leading-none text-[#f2ede1]">{songTitle}</p>
        <p className="mt-3 text-4xl font-black leading-none text-[#f0b429]">{score}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div key={stat.id} className="rounded-xl border border-[#26262b] bg-[#0a0a0b] px-1 py-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">{stat.label}</p>
              <p className="mt-1 text-[13px] font-black leading-none text-[#f2ede1]">{stat.value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClearPianoGame}
          className="mt-6 w-full rounded-xl bg-[#f2ede1] py-3 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
        >
          Main lagi
        </button>
        <button
          type="button"
          onClick={onLoadPianoSongs}
          className="mt-2 w-full rounded-xl border border-[#26262b] bg-[#0a0a0b] py-3 text-[13px] font-semibold text-[#f2ede1] transition-colors hover:border-[#43434d]"
        >
          Pilih lagu lain
        </button>
      </div>
    </div>
  )
}

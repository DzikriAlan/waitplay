'use client'

import type { PianoLane, PianoTile } from '../types/pianoTypes'

interface Props {
  lanes: PianoLane[]
  tiles: PianoTile[]
  countdown: number
  combo: number
  progress: number
  judgementLabel: string
  judgementKind: string
  activeLane: number
  songTitle: string
  songArtist: string
  isPaused: boolean
  onSubmitPianoHit: (lane: number) => void
}

export default function PianoBoard({
  lanes,
  tiles,
  countdown,
  combo,
  progress,
  judgementLabel,
  judgementKind,
  activeLane,
  songTitle,
  songArtist,
  isPaused,
  onSubmitPianoHit,
}: Props) {
  const judgementTone = judgementKind === 'miss' ? 'text-[#e0452a]' : 'text-[#f0b429]'
  const laneKeys = ['D', 'F', 'J', 'K']

  const getTileStyle = (tile: PianoTile) => ({
    bottom: `${(1 - tile.offset) * 100}%`,
    height: `${tile.length * 100}%`,
    backgroundColor: tile.tone,
    opacity: tile.isMissed ? 0.3 : 1,
  })
  const getKeyTone = (lane: PianoLane) =>
    activeLane === lane.index ? 'bg-[#f0b429] translate-y-[2px]' : 'bg-[#f2ede1]'

  return (
    <div className="flex h-full w-full flex-col gap-2 rounded-2xl border border-[#26262b] bg-[#121214] p-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black leading-tight text-[#f2ede1]">{songTitle}</p>
          <p className="truncate text-[9px] leading-tight text-[#a29d93]">{songArtist}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Rentetan</p>
          <p className="text-[13px] font-black leading-none text-[#f0b429]">{combo}x</p>
        </div>
      </div>

      <div className="h-[3px] shrink-0 overflow-hidden rounded-full bg-[#0a0a0b]">
        <span className="block h-full rounded-full bg-[#f0b429]" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0a0a0b]">
        <div className="grid h-full w-full grid-cols-4 gap-[2px]">
          {lanes.map((lane) => (
            <button
              key={lane.index}
              type="button"
              aria-label={`Ketuk jalur nada ${lane.label}`}
              onPointerDown={() => onSubmitPianoHit(lane.index)}
              className="flex h-full flex-col overflow-hidden bg-[#141416]"
            >
              <span className="relative block min-h-0 flex-1 overflow-hidden">
                {tiles
                  .filter((tile) => tile.lane === lane.index)
                  .map((tile) => (
                    <span
                      key={tile.id}
                      style={getTileStyle(tile)}
                      className="absolute inset-x-[3px] block rounded-[4px] shadow-[0_0_10px_rgba(0,0,0,0.45)]"
                    />
                  ))}
              </span>

              <span className="block h-[3px] w-full shrink-0 bg-[#f2ede1]/70" />

              <span
                className={`flex h-[54px] w-full shrink-0 flex-col items-center justify-end pb-2 transition-transform ${getKeyTone(lane)}`}
              >
                <span className="block h-[6px] w-full" style={{ backgroundColor: lane.tone }} />
                <span className="mt-auto text-[11px] font-black leading-none text-[#0a0a0b]">{lane.label}</span>
                <span className="mt-[3px] text-[8px] font-semibold uppercase tracking-[0.14em] text-[#5f5b53]">
                  {laneKeys[lane.index]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {judgementLabel ? (
          <p
            className={`pointer-events-none absolute inset-x-0 bottom-[26%] text-center text-[15px] font-black uppercase tracking-[0.18em] ${judgementTone}`}
          >
            {judgementLabel}
          </p>
        ) : null}

        {countdown ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#0a0a0b]/80 text-4xl font-black leading-none text-[#f2ede1]">
              {countdown}
            </span>
          </div>
        ) : null}

        {isPaused && !countdown ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0a0a0b]/80">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a29d93]">Jeda</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

'use client'

import type { PianoSongCard } from '../types/pianoTypes'

interface Props {
  songs: PianoSongCard[]
  emptyTitle: string
  emptySubtitle: string
  isEmpty: boolean
  onSubmitPianoSong: (songId: string) => void
}

export default function PianoSongs({ songs, emptyTitle, emptySubtitle, isEmpty, onSubmitPianoSong }: Props) {
  if (isEmpty) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-[#26262b] bg-[#121214] px-6 text-center">
        <p className="text-[13px] font-black uppercase tracking-tight text-[#f2ede1]">{emptyTitle}</p>
        <p className="text-[11px] leading-snug text-[#a29d93]">{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#26262b] bg-[#121214]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#26262b] px-4 py-3">
        <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">Pilih lagu</p>
        <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">{songs.length} lagu</p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {songs.map((song) => (
          <button
            key={song.id}
            type="button"
            onClick={() => onSubmitPianoSong(song.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#26262b] bg-[#0a0a0b] p-3 text-left transition-colors hover:border-[#43434d]"
          >
            <span
              className="flex h-[38px] w-[38px] shrink-0 items-end justify-center gap-[2px] rounded-lg p-[5px]"
              style={{ backgroundColor: song.tone }}
              aria-hidden="true"
            >
              <span className="block h-full w-[4px] rounded-[1px] bg-[#f2ede1]" />
              <span className="block h-full w-[4px] rounded-[1px] bg-[#141416]" />
              <span className="block h-full w-[4px] rounded-[1px] bg-[#f2ede1]" />
              <span className="block h-full w-[4px] rounded-[1px] bg-[#141416]" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-black leading-tight text-[#f2ede1]">{song.title}</span>
              <span className="block truncate text-[10px] leading-tight text-[#a29d93]">{song.artist}</span>
              <span className="mt-1 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-[2px] text-[8px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0b]"
                  style={{ backgroundColor: song.accent }}
                >
                  {song.levelLabel}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">
                  {song.durationLabel} · {song.noteTotal} nada
                </span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-[8px] font-semibold uppercase tracking-[0.14em] text-[#a29d93]">Terbaik</span>
              <span className="block text-[13px] font-black leading-none text-[#f0b429]">{song.bestScore}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

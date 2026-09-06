'use client'

import Link from 'next/link'
import { SLITHER_SKINS } from '@/shared/lib/slitherEngine'
import SlitherPreview from './SlitherPreview'

interface Props {
  name: string
  roomCode: string
  isJoinDisabled: boolean
  skinIndex: number
  onEditSlitherName: (value: string) => void
  onEditSlitherSkin: (index: number) => void
  onEditSlitherRoom: (value: string) => void
  onSubmitSlitherSolo: () => void
  onSubmitSlitherGlobal: () => void
  onSubmitSlitherCreate: () => void
  onSubmitSlitherJoin: () => void
}

export default function SlitherLobby({
  name,
  roomCode,
  isJoinDisabled,
  skinIndex,
  onEditSlitherName,
  onEditSlitherSkin,
  onEditSlitherRoom,
  onSubmitSlitherSolo,
  onSubmitSlitherGlobal,
  onSubmitSlitherCreate,
  onSubmitSlitherJoin,
}: Props) {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center overflow-hidden overscroll-none bg-[#0a0a0b] px-3 py-3 text-[#f2ede1] sm:px-4">
      <div className="flex max-h-full w-full max-w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#26262b] bg-[#121214] p-3 sm:p-4">
        <Link href="/" className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a29d93]">
          &larr; Waitplay
        </Link>
        <p className="mt-1.5 shrink-0 text-xl font-black uppercase leading-none tracking-tighter sm:text-2xl">
          Slither 3D
        </p>
        <p className="mt-1 shrink-0 text-[10px] leading-snug text-[#a29d93] sm:text-[11px]">
          Kendalikan ular, makan buah dan sayur untuk memanjang, lalu hindari badan ular lain.
        </p>

        <label className="mt-2 shrink-0 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">
          Nama
        </label>
        <input
          value={name}
          maxLength={14}
          onChange={(event) => onEditSlitherName(event.target.value)}
          placeholder="Namamu"
          className="mt-1.5 shrink-0 w-full rounded-xl border border-[#26262b] bg-[#0a0a0b] px-3 py-1.5 text-[13px] outline-none focus:border-[#f2ede1]"
        />

        <SlitherPreview skinIndex={skinIndex} />

        <p className="mt-2 shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">
          Warna ular
        </p>
        <div className="mt-1.5 shrink-0 flex flex-wrap gap-1.5">
          {SLITHER_SKINS.map((skin, index) => {
            const isActive = index === skinIndex
            // Corak dua warna ditampilkan sebagai belang tegas, bukan gradasi yang meleber.
            const stripes = skin.bands
              .map((color, band) => {
                const from = (band / skin.bands.length) * 100
                const to = ((band + 1) / skin.bands.length) * 100
                return `${color} ${from}% ${to}%`
              })
              .join(', ')
            const swatch =
              skin.bands.length > 1
                ? { backgroundImage: `linear-gradient(135deg, ${stripes})` }
                : { backgroundColor: skin.bands[0] }
            return (
              <button
                key={skin.label}
                type="button"
                title={skin.label}
                aria-label={skin.label}
                aria-pressed={isActive}
                onClick={() => onEditSlitherSkin(index)}
                style={swatch}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  isActive ? 'scale-110 border-[#f2ede1]' : 'border-[#3a3a42] hover:border-[#f2ede1]'
                }`}
              />
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSubmitSlitherSolo}
          className="mt-2 shrink-0 w-full rounded-xl bg-[#f2ede1] py-2 text-[12px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80"
        >
          Main vs Komputer
        </button>
        <button
          type="button"
          onClick={onSubmitSlitherGlobal}
          className="mt-1.5 shrink-0 w-full rounded-xl border border-[#f2ede1] py-2 text-[12px] font-semibold text-[#f2ede1] transition-colors hover:bg-[#f2ede1] hover:text-[#0a0a0b]"
        >
          Main online (global)
        </button>

        <div className="mt-2 shrink-0 border-t border-[#26262b] pt-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">
            Ruangan privat
          </p>
          <button
            type="button"
            onClick={onSubmitSlitherCreate}
            className="mt-1.5 w-full rounded-xl border border-[#3a3a42] py-2 text-[11px] font-semibold transition-colors hover:border-[#f2ede1]"
          >
            Buat ruangan baru
          </button>
          <div className="mt-1.5 flex gap-2">
            <input
              value={roomCode}
              maxLength={5}
              onChange={(event) => onEditSlitherRoom(event.target.value)}
              placeholder="ABCDE"
              className="w-full rounded-xl border border-[#26262b] bg-[#0a0a0b] px-3 py-1.5 text-[13px] uppercase tracking-[0.3em] outline-none focus:border-[#f2ede1]"
            />
            <button
              type="button"
              disabled={isJoinDisabled}
              onClick={onSubmitSlitherJoin}
              className="shrink-0 rounded-xl border border-[#3a3a42] px-4 py-1.5 text-[11px] font-semibold transition-colors hover:border-[#f2ede1] disabled:opacity-40"
            >
              Gabung
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

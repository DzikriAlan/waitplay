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
    <div className="flex h-[100dvh] w-full justify-center overflow-y-auto overscroll-contain bg-[#0a0a0b] px-4 py-4 text-[#f2ede1] sm:px-5 sm:py-8">
      <div className="my-auto w-full max-w-[380px] shrink-0 rounded-2xl border border-[#26262b] bg-[#121214] p-4 sm:p-6">
        <Link href="/" className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a29d93]">
          &larr; Waitplay
        </Link>
        <p className="mt-2 text-2xl font-black uppercase leading-none tracking-tighter sm:mt-3 sm:text-3xl">
          Slither 3D
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-[#a29d93] sm:mt-2 sm:text-[12px]">
          Kendalikan ular, makan buah dan sayur untuk memanjang, lalu hindari badan ular lain.
          Tahan untuk ngebut.
        </p>

        <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a29d93] sm:mt-5">
          Nama
        </label>
        <input
          value={name}
          maxLength={14}
          onChange={(event) => onEditSlitherName(event.target.value)}
          placeholder="Namamu"
          className="mt-2 w-full rounded-xl border border-[#26262b] bg-[#0a0a0b] px-3 py-2 text-[13px] outline-none focus:border-[#f2ede1]"
        />

        <SlitherPreview skinIndex={skinIndex} />

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a29d93] sm:mt-4">
          Warna ular
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
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
                className={`h-8 w-8 rounded-full border-2 transition-transform sm:h-9 sm:w-9 ${
                  isActive ? 'scale-110 border-[#f2ede1]' : 'border-[#3a3a42] hover:border-[#f2ede1]'
                }`}
              />
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSubmitSlitherSolo}
          className="mt-3 w-full rounded-xl bg-[#f2ede1] py-2.5 text-[13px] font-semibold text-[#0a0a0b] transition-opacity active:opacity-80 sm:mt-4 sm:py-3"
        >
          Main vs Komputer
        </button>
        <button
          type="button"
          onClick={onSubmitSlitherGlobal}
          className="mt-2 w-full rounded-xl border border-[#f2ede1] py-2.5 text-[13px] font-semibold text-[#f2ede1] transition-colors hover:bg-[#f2ede1] hover:text-[#0a0a0b] sm:py-3"
        >
          Main online (global)
        </button>

        <div className="mt-4 border-t border-[#26262b] pt-4 sm:mt-5 sm:pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a29d93]">
            Ruangan privat
          </p>
          <button
            type="button"
            onClick={onSubmitSlitherCreate}
            className="mt-2 w-full rounded-xl border border-[#3a3a42] py-2.5 text-[12px] font-semibold transition-colors hover:border-[#f2ede1]"
          >
            Buat ruangan baru
          </button>
          <div className="mt-2 flex gap-2">
            <input
              value={roomCode}
              maxLength={5}
              onChange={(event) => onEditSlitherRoom(event.target.value)}
              placeholder="ABCDE"
              className="w-full rounded-xl border border-[#26262b] bg-[#0a0a0b] px-3 py-2 text-[13px] uppercase tracking-[0.3em] outline-none focus:border-[#f2ede1]"
            />
            <button
              type="button"
              disabled={isJoinDisabled}
              onClick={onSubmitSlitherJoin}
              className="shrink-0 rounded-xl border border-[#3a3a42] px-4 py-2 text-[12px] font-semibold transition-colors hover:border-[#f2ede1] disabled:opacity-40"
            >
              Gabung
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

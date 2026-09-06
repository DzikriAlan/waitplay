'use client'

import { useState } from 'react'
import LocaleToggle from '@/shared/components/reusable/LocaleToggle'
import AuthStatus from '@/features/auth/components/AuthStatus'

interface Props {
  activeLocale: string
  switchLabel: string
  menuLabel?: string
  onEditStoreLocale: (locale: string) => void
}

export default function StoreHeader({
  activeLocale,
  switchLabel,
  menuLabel = 'Menu',
  onEditStoreLocale,
}: Props) {
  const [filters, setFilters] = useState({ isMenuOpen: false })

  const editStoreMenu = () => {
    setFilters((prev) => ({ ...prev, isMenuOpen: !prev.isMenuOpen }))
  }
  const clearStoreMenu = () => {
    setFilters((prev) => ({ ...prev, isMenuOpen: false }))
  }
  const editStoreLocale = (locale: string) => {
    onEditStoreLocale(locale)
    clearStoreMenu()
  }

  return (
    <header className="flex shrink-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[38px] font-black uppercase leading-[0.82] tracking-[-0.04em] text-[#f2ede1] min-[360px]:text-[46px] sm:text-[56px] lg:text-[68px]">
          Waitplay
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] text-[#f2ede1]/85 sm:mt-2 sm:text-[12px] sm:tracking-[0.4em]">
          Game Collection
        </p>
      </div>

      {/* Di layar lebar semuanya tampil sejajar. */}
      <div className="mt-1 hidden shrink-0 items-center gap-3 sm:flex">
        <AuthStatus />
        <LocaleToggle activeLocale={activeLocale} switchLabel={switchLabel} onEditLocale={onEditStoreLocale} />
      </div>

      {/* Di layar sempit judulnya sudah memakan tempat, jadi menunya dilipat jadi hamburger. */}
      <div className="relative mt-1 shrink-0 sm:hidden">
        <button
          type="button"
          aria-label={menuLabel}
          aria-expanded={filters.isMenuOpen}
          onClick={editStoreMenu}
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
            filters.isMenuOpen ? 'border-[#f2ede1] bg-[#f2ede1]' : 'border-[#3a3a42] bg-[#131316]'
          }`}
        >
          <span className="flex flex-col gap-[3px]">
            {[0, 1, 2].map((bar) => (
              <span
                key={bar}
                className={`block h-[2px] w-4 rounded-full ${
                  filters.isMenuOpen ? 'bg-[#0a0a0b]' : 'bg-[#f2ede1]'
                }`}
              />
            ))}
          </span>
        </button>

        {filters.isMenuOpen ? (
          <>
            <button
              type="button"
              aria-label={menuLabel}
              onClick={clearStoreMenu}
              className="fixed inset-0 z-30 cursor-default"
            />
            <div className="absolute right-0 z-40 mt-2 flex w-max flex-col items-end gap-3 rounded-2xl border border-[#26262b] bg-[#121214] p-3 shadow-lg">
              <AuthStatus />
              <LocaleToggle
                activeLocale={activeLocale}
                switchLabel={switchLabel}
                onEditLocale={editStoreLocale}
              />
            </div>
          </>
        ) : null}
      </div>
    </header>
  )
}

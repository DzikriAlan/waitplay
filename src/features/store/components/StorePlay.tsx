'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StoreGame } from '../types/storeTypes'
import { useStoreStates } from '../states/storeStates'
import { useLocaleStates } from '@/shared/states/localeStates'
import type { LocaleCode } from '@/shared/states/localeStates'
import StoreHeader from './StoreHeader'
import StoreFilter from './StoreFilter'
import StoreSection from './StoreSection'
import StoreTile from './StoreTile'
import StoreRow from './StoreRow'
import StoreAbout from './StoreAbout'

const LIST_TOTAL = 3

export default function StorePlay() {
  const { storeCatalog, setStoreCategory, setStoreHistory, setStoreHistoryInit, setStoreReset } = useStoreStates()
  const { activeLocale, text, setLocale, setLocaleInit } = useLocaleStates()
  const railRef = useRef<HTMLDivElement | null>(null)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [filters, setFilters] = useState({
    activeRail: {
      isScrollable: false,
      isEnd: false,
    },
    activeSlider: {
      isScrollable: false,
      isEnd: false,
    },
    pagination: {
      currentPage: 1,
      perPage: 0,
      totalItem: 0,
      totalPage: 1,
    },
  })
  const data = useMemo(() => {
    const getCategoryGames = (games: StoreGame[], activeCategory: string) =>
      games.filter((game) => activeCategory === 'all' || game.category === activeCategory)
    const getHistoryGames = (games: StoreGame[], historyIds: string[]) =>
      historyIds.map((id) => games.find((game) => game.id === id)).filter((game): game is StoreGame => !!game)

    const catalog = storeCatalog.data
    const activeCategory = catalog?.activeCategory ?? 'all'
    const games = getCategoryGames(catalog?.games ?? [], activeCategory)
    const history = getHistoryGames(catalog?.games ?? [], catalog?.historyIds ?? [])
    // Daftar dibagi per halaman berisi tiga baris, halaman berikutnya digeser mendatar.
    const getPages = (items: StoreGame[]) => {
      const pages: StoreGame[][] = []
      for (let start = 0; start < items.length; start += LIST_TOTAL) {
        pages.push(items.slice(start, start + LIST_TOTAL))
      }
      return pages
    }
    const pages = getPages(games)

    return {
      data: games,
      isLoading: storeCatalog.status === 'loading',
      isError: storeCatalog.status === 'error',
      isEmpty: storeCatalog.status === 'success' && !games.length,
      emptyTitle: text.store.emptyTitle,
      emptySubtitle: text.store.emptySubtitle,
      emptyImage: '',
      pagination: { ...filters.pagination, perPage: games.length, totalItem: games.length },
      categories: catalog?.categories ?? [],
      activeCategory,
      history,
      pages,
      isHistoryVisible: !!history.length,
      isRailScrollable: filters.activeRail.isScrollable,
      isRailEnd: filters.activeRail.isEnd,
      isSliderScrollable: filters.activeSlider.isScrollable,
      isSliderEnd: filters.activeSlider.isEnd,
      text,
      activeLocale,
    }
  }, [storeCatalog, filters, text, activeLocale])
  const loadStoreRail = useCallback(() => {
    const getRailState = (element: HTMLDivElement | null) => {
      if (!element) return { isScrollable: false, isEnd: false }
      const room = element.scrollWidth - element.clientWidth
      if (room <= 4) return { isScrollable: false, isEnd: false }
      return { isScrollable: true, isEnd: element.scrollLeft >= room - 4 }
    }

    setFilters((prev) => ({
      ...prev,
      activeRail: getRailState(railRef.current),
      activeSlider: getRailState(sliderRef.current),
    }))
  }, [])
  const loadStoreRailNext = () => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: data.isRailEnd ? -rail.scrollWidth : rail.clientWidth * 0.8, behavior: 'smooth' })
  }
  const loadStoreSliderNext = () => {
    const slider = sliderRef.current
    if (!slider) return
    // Satu geseran memindahkan tepat satu halaman berisi tiga baris permainan.
    slider.scrollBy({ left: data.isSliderEnd ? -slider.scrollWidth : slider.clientWidth, behavior: 'smooth' })
  }
  const editStoreCategory = (categoryId: string) => {
    setStoreCategory(categoryId)
  }
  const editStoreLocale = (locale: string) => {
    setLocale(locale as LocaleCode)
  }
  const submitStoreGame = (gameId: string) => {
    setStoreHistory(gameId)
  }
  const clearStoreFilter = () => {
    setStoreReset()
  }

  useEffect(() => {
    // Riwayat dan pilihan bahasa baru dibaca di peramban supaya hasil render server tetap sama.
    setStoreHistoryInit()
    setLocaleInit()
  }, [setStoreHistoryInit, setLocaleInit])
  useEffect(() => {
    loadStoreRail()
    const observer = new ResizeObserver(loadStoreRail)
    if (railRef.current) observer.observe(railRef.current)
    if (sliderRef.current) observer.observe(sliderRef.current)
    return () => observer.disconnect()
  }, [loadStoreRail, data.history.length, data.pages.length])

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#0a0a0b] text-[#f2ede1]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 py-6 sm:gap-7 sm:px-8 sm:py-8 lg:px-12 lg:py-9">
        <StoreHeader
          activeLocale={data.activeLocale}
          switchLabel={data.text.locale.switch}
          onEditStoreLocale={editStoreLocale}
        />

        <StoreFilter
          categories={data.categories}
          activeCategory={data.activeCategory}
          onEditStoreCategory={editStoreCategory}
        />

        <section className="flex flex-col gap-1.5">
          <StoreSection
            title={data.text.store.games}
            actionLabel={data.isSliderEnd ? data.text.store.scrollGamesBack : data.text.store.scrollGames}
            isActionDisabled={!data.isSliderScrollable}
            isActionFlipped={data.isSliderEnd}
            onLoadStoreSection={loadStoreSliderNext}
          />

          {data.isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#26262b] bg-[#121214] px-6 py-10 text-center">
              <p className="text-base font-black uppercase tracking-tight text-[#f2ede1]">{data.emptyTitle}</p>
              <p className="text-[13px] font-medium text-[#9aa3b2]">{data.emptySubtitle}</p>
              <button
                type="button"
                onClick={clearStoreFilter}
                className="mt-3 rounded-full border border-[#f2ede1] px-4 py-2 text-[12px] font-medium text-[#f2ede1] transition-colors hover:bg-[#f2ede1] hover:text-[#0a0a0b]"
              >
                {data.text.store.emptyAction}
              </button>
            </div>
          ) : (
            <div
              ref={sliderRef}
              onScroll={loadStoreRail}
              className="flex snap-x snap-mandatory overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {data.pages.map((page) => (
                <div
                  key={page[0].id}
                  // Di ponsel section berikutnya sengaja mengintip di tepi layar, di desktop tampil tiga section.
                  className="flex w-[89%] shrink-0 snap-start flex-col divide-y divide-[#1c1c20] pr-3 sm:w-[62%] lg:w-1/3"
                >
                  {page.map((game) => (
                    <StoreRow
                      key={game.id}
                      game={game}
                      playLabel={data.text.store.play}
                      soonLabel={data.text.store.soon}
                      minuteUnit={data.text.unit.minute}
                      playerUnit={data.text.unit.player}
                      playersUnit={data.text.unit.players}
                      onSubmitStoreGame={submitStoreGame}
                    />
                  ))}
                </div>
              ))}

              {/* Pengganjal akhir supaya section terakhir tetap bisa rapat ke tepi kiri saat digeser. */}
              <span aria-hidden="true" className="w-[12%] shrink-0 sm:w-[38%] lg:w-0" />
            </div>
          )}
        </section>

        {data.isHistoryVisible ? (
          <section className="flex flex-col gap-2">
            <StoreSection
              title={data.text.store.history}
              actionLabel={data.isRailEnd ? data.text.store.scrollHistoryBack : data.text.store.scrollHistory}
              isActionDisabled={!data.isRailScrollable}
              isActionFlipped={data.isRailEnd}
              onLoadStoreSection={loadStoreRailNext}
            />

            <div
              ref={railRef}
              onScroll={loadStoreRail}
              className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
            >
              {data.history.map((game) => (
                <StoreTile key={game.id} game={game} onSubmitStoreGame={submitStoreGame} />
              ))}
            </div>
          </section>
        ) : null}

        <StoreAbout about={data.text.about} />
      </div>
    </div>
  )
}

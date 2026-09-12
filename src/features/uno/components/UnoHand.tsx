'use client'

import type { UnoCard as UnoCardType } from '../types/unoTypes'
import UnoCard from './UnoCard'

interface HandCard {
  card: UnoCardType
}

interface Props {
  cards: HandCard[]
  cardTotal: number
  isDrawDisabled: boolean
  isPassVisible: boolean
  isUnoVisible: boolean
  hasCalledUno: boolean
  isSelectMode: boolean
  isSelectDisabled: boolean
  selectedCardIds: string[]
  selectedValue: string
  isMultiConfirmDisabled: boolean
  pendingDrawTotal: number
  onSubmitUnoCard: (cardId: string) => void
  onLoadUnoDraw: () => void
  onLoadUnoPass: () => void
  onSubmitUnoCall: () => void
  onLoadUnoSelect: () => void
  onEditUnoSelect: (cardId: string) => void
  onSubmitUnoCards: () => void
  onClearUnoSelect: () => void
}

export default function UnoHand({
  cards,
  cardTotal,
  isDrawDisabled,
  isPassVisible,
  isUnoVisible,
  hasCalledUno,
  isSelectMode,
  isSelectDisabled,
  selectedCardIds,
  selectedValue,
  isMultiConfirmDisabled,
  pendingDrawTotal,
  onSubmitUnoCard,
  onLoadUnoDraw,
  onLoadUnoPass,
  onSubmitUnoCall,
  onLoadUnoSelect,
  onEditUnoSelect,
  onSubmitUnoCards,
  onClearUnoSelect,
}: Props) {
  const getOverlap = (total: number) => {
    if (total <= 5) return -6
    if (total <= 8) return -18
    if (total <= 12) return -28
    return -34
  }

  const overlap = getOverlap(cards.length)
  const middle = (cards.length - 1) / 2

  return (
    <section className="shrink-0 border-t border-[#26262b] bg-[#121214] px-2 pb-3 pt-2">
      <div className="flex items-center justify-center gap-1">
        <span className="rounded bg-[#e0452a] px-2 text-[9px] font-semibold uppercase text-[#f2ede1]">
          Anda
        </span>
        <span className="rounded bg-[#26262b] px-[6px] text-[10px] font-semibold text-[#f2ede1]">{cardTotal}</span>
        {!isSelectMode ? (
          <button
            type="button"
            disabled={isSelectDisabled}
            onClick={onLoadUnoSelect}
            className="rounded bg-[#26262b] px-2 text-[9px] font-semibold uppercase tracking-wide text-[#a29d93] transition-colors hover:text-[#f2ede1] disabled:opacity-30"
          >
            Pilih kembar
          </button>
        ) : null}
      </div>

      {isSelectMode ? (
        <p className="pb-1 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f0b429]">
          {selectedCardIds.length
            ? `${selectedCardIds.length} kartu angka ${selectedValue} dipilih`
            : 'Ketuk kartu angka yang ingin dipasangkan'}
        </p>
      ) : null}

      <div className="flex min-h-[104px] items-end justify-center pb-4 pt-4">
        {cards.map((item, index) => (
          <span
            key={item.card.id}
            style={{
              marginLeft: index === 0 ? 0 : overlap,
              transform: `rotate(${(index - middle) * 2.5}deg)`,
              transformOrigin: 'bottom center',
              zIndex: index,
            }}
            className="relative"
          >
            <UnoCard
              card={item.card}
              isSelectMode={isSelectMode}
              isSelected={selectedCardIds.includes(item.card.id)}
              selectedValue={selectedValue}
              onSubmitUnoCard={onSubmitUnoCard}
              onEditUnoSelect={onEditUnoSelect}
            />
          </span>
        ))}
      </div>

      {isSelectMode ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClearUnoSelect}
            className="rounded-xl border border-[#3a3a42] py-2 text-[10px] font-semibold uppercase tracking-wide text-[#f2ede1] transition-colors hover:border-[#f2ede1]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isMultiConfirmDisabled}
            onClick={onSubmitUnoCards}
            className="rounded-xl bg-[#f0b429] py-2 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0b] transition-opacity active:opacity-80 disabled:opacity-30"
          >
            Buang {selectedCardIds.length} kartu
          </button>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isDrawDisabled}
            onClick={onLoadUnoDraw}
            className="rounded-xl bg-[#f2ede1] py-2 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0b] transition-opacity active:opacity-80 disabled:opacity-30"
          >
            {pendingDrawTotal > 0 ? `Draw ${pendingDrawTotal} cards` : 'Draw card'}
          </button>
          <button
            type="button"
            disabled={!isPassVisible}
            onClick={onLoadUnoPass}
            className="rounded-xl border border-[#3a3a42] py-2 text-[10px] font-semibold uppercase tracking-wide text-[#f2ede1] transition-colors hover:border-[#f2ede1] disabled:opacity-30"
          >
            Pass
          </button>
          <button
            type="button"
            disabled={!isUnoVisible || hasCalledUno}
            onClick={onSubmitUnoCall}
            className="rounded-xl bg-[#f0b429] py-2 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0b] transition-opacity active:opacity-80 disabled:opacity-30"
          >
            {hasCalledUno ? 'UNO ✓' : 'UNO!'}
          </button>
        </div>
      )}
    </section>
  )
}

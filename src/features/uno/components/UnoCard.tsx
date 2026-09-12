'use client'

import type { UnoCard as UnoCardType } from '../types/unoTypes'

const NON_NUMBER_VALUES = new Set(['skip', 'reverse', 'draw2', 'wild', 'wild4'])

interface Props {
  card: UnoCardType | null
  isBack?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isSelectMode?: boolean
  isSelected?: boolean
  // Kosong berarti belum ada kartu terpilih, jadi kartu angka apa pun boleh jadi pilihan pertama.
  selectedValue?: string
  onSubmitUnoCard?: (cardId: string) => void
  onEditUnoSelect?: (cardId: string) => void
}

const COLOR_TONE: Record<string, string> = {
  red: 'bg-[#e8202a]',
  yellow: 'bg-[#f7c600]',
  green: 'bg-[#23a94a]',
  blue: 'bg-[#2f5ce0]',
  wild: 'bg-[#111114]',
}

const SIZE_TONE = {
  xs: 'w-6 h-9 text-[10px]',
  sm: 'w-9 h-14 text-base',
  md: 'w-[52px] h-[78px] text-xl',
  lg: 'w-[76px] h-[114px] text-4xl',
}

// Label sudut diberi jarak dari tepi kartu, mengikuti ukuran kartunya.
const CORNER_TONE = {
  xs: { text: 'text-[6px]', start: 'left-[4px] top-[3px]', end: 'bottom-[3px] right-[4px]' },
  sm: { text: 'text-[8px]', start: 'left-[5px] top-[4px]', end: 'bottom-[4px] right-[5px]' },
  md: { text: 'text-[9px]', start: 'left-[7px] top-[6px]', end: 'bottom-[6px] right-[7px]' },
  lg: { text: 'text-[12px]', start: 'left-[10px] top-[8px]', end: 'bottom-[8px] right-[10px]' },
}

export default function UnoCard({
  card,
  isBack = false,
  size = 'md',
  isSelectMode = false,
  isSelected = false,
  selectedValue = '',
  onSubmitUnoCard,
  onEditUnoSelect,
}: Props) {
  const frame = `relative shrink-0 overflow-hidden rounded-lg border-[3px] ${SIZE_TONE[size]} ${isSelected ? 'ring-4 ring-[#f0b429] ring-offset-2 ring-offset-[#121214] -translate-y-3' : ''}`

  const getCornerLabel = (value: string) => {
    if (value === 'skip') return '⊘'
    if (value === 'reverse') return '⇄'
    if (value === 'draw2') return '+2'
    if (value === 'wild4') return '+4'
    if (value === 'wild') return '★'
    return value
  }

  const getFaceContent = () => {
    if (!card) return null
    if (card.value === 'wild' || card.value === 'wild4') {
      return (
        <span className="grid h-1/2 w-1/2 grid-cols-2 overflow-hidden rounded-[3px] border-2 border-[#0a0a0b]">
          <span className="bg-[#e8202a]" />
          <span className="bg-[#f7c600]" />
          <span className="bg-[#2f5ce0]" />
          <span className="bg-[#23a94a]" />
        </span>
      )
    }
    return (
      <span className="font-black leading-none text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.65)]">
        {getCornerLabel(card.value)}
      </span>
    )
  }

  if (isBack || !card) {
    return (
      <span className={`${frame} flex items-center justify-center border-[#3a3a42] bg-[#141416]`}>
        <span className="-rotate-12 text-[9px] font-black tracking-tighter text-[#f2ede1]">UNO</span>
      </span>
    )
  }

  const tone = COLOR_TONE[card.color ?? 'wild']
  const corner = CORNER_TONE[size]
  const face = (
    <span className={`${frame} flex items-center justify-center border-[#f2ede1] bg-[#f2ede1] shadow-[0_2px_10px_rgba(0,0,0,0.55)]`}>
      <span className={`absolute inset-[3px] rounded-[3px] ${tone}`} />
      <span className={`absolute ${corner.start} ${corner.text} font-black leading-none text-white`}>
        {getCornerLabel(card.value)}
      </span>
      <span className={`absolute ${corner.end} ${corner.text} rotate-180 font-black leading-none text-white`}>
        {getCornerLabel(card.value)}
      </span>
      <span className="relative flex h-full w-full items-center justify-center">{getFaceContent()}</span>
    </span>
  )

  if (!onSubmitUnoCard) return face

  // Kartu angka polos boleh jadi pilihan pertama; setelah ada pilihan, hanya angka yang sama yang ikut bisa dipilih.
  const isNumberCard = !NON_NUMBER_VALUES.has(card.value)
  const isSelectable = isNumberCard && (!selectedValue || card.value === selectedValue)
  const isDimmed = isSelectMode && !isSelected && !isSelectable

  const submitUnoTap = () => {
    if (isSelectMode) {
      if (isSelectable) onEditUnoSelect?.(card.id)
      return
    }
    onSubmitUnoCard(card.id)
  }

  return (
    <button
      type="button"
      aria-label={`Play card ${card.color ?? 'wild'} ${card.value}`}
      onClick={submitUnoTap}
      className={`shrink-0 transition-transform hover:-translate-y-3 active:-translate-y-1 ${isDimmed ? 'opacity-40' : ''}`}
    >
      {face}
    </button>
  )
}

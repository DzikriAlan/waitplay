import type { UnoCard, UnoColor, UnoValue } from '@/features/uno/types/unoTypes'

export type UnoRoomPlayer = {
  seat: string
  hand: UnoCard[]
  hasCalledUno: boolean
}

export type UnoRoomState = {
  players: UnoRoomPlayer[]
  drawPile: UnoCard[]
  discardPile: UnoCard[]
  activeColor: UnoColor
  currentSeat: string
  direction: number
  hasDrawnThisTurn: boolean
  // Total kartu yang wajib ditarik dari tumpukan +2/+4 yang belum ditimpa; 0 berarti tidak ada tumpukan aktif.
  pendingDrawTotal: number
  lastAction: string
}

export type UnoRoomMove = {
  action: string
  cardId?: string
  cardIds?: string[]
  color?: string
}

export type UnoRoomResolvedMove = {
  state: UnoRoomState
  turn: string
  moveTotal: number
  isFinished: boolean
  winner: string
}

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const NUMBERS: UnoValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTIONS: UnoValue[] = ['skip', 'reverse', 'draw2']
const HAND_SIZE = 7

const getShuffled = <Item>(items: Item[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const holder = copy[index]
    copy[index] = copy[swap]
    copy[swap] = holder
  }
  return copy
}

const getDeck = () => {
  const deck: UnoCard[] = []
  let serial = 0
  const getCard = (color: UnoColor | null, value: UnoValue) => {
    serial += 1
    return { id: `${color ?? 'wild'}-${value}-${serial}`, color, value }
  }

  COLORS.forEach((color) => {
    deck.push(getCard(color, '0'))
    NUMBERS.forEach((value) => {
      deck.push(getCard(color, value))
      deck.push(getCard(color, value))
    })
    ACTIONS.forEach((value) => {
      deck.push(getCard(color, value))
      deck.push(getCard(color, value))
    })
  })
  for (let index = 0; index < 4; index += 1) {
    deck.push(getCard(null, 'wild'))
    deck.push(getCard(null, 'wild4'))
  }
  return getShuffled(deck)
}

export const getUnoRoomIsPlayable = (card: UnoCard, activeColor: UnoColor, topCard: UnoCard | undefined) => {
  if (card.value === 'wild' || card.value === 'wild4') return true
  if (card.color === activeColor) return true
  return !!topCard && topCard.value === card.value
}

// Hanya kartu angka polos (bukan aksi maupun wild) yang boleh dibuang berpasangan dalam satu giliran.
const NON_NUMBER_VALUES = new Set<UnoValue>(['skip', 'reverse', 'draw2', 'wild', 'wild4'])
export const getUnoRoomIsPlainNumber = (value: UnoValue) => !NON_NUMBER_VALUES.has(value)

const getRefilledPiles = (drawPile: UnoCard[], discardPile: UnoCard[]) => {
  if (drawPile.length) return { drawPile, discardPile }
  const top = discardPile[discardPile.length - 1]
  const rest = discardPile.slice(0, -1).map((card) => ({
    ...card,
    color: card.value === 'wild' || card.value === 'wild4' ? null : card.color,
  }))
  return { drawPile: getShuffled(rest), discardPile: top ? [top] : [] }
}

const getDrawnCards = (drawPile: UnoCard[], discardPile: UnoCard[], total: number) => {
  let pile = drawPile
  let discard = discardPile
  const drawn: UnoCard[] = []
  for (let index = 0; index < total; index += 1) {
    const refilled = getRefilledPiles(pile, discard)
    pile = refilled.drawPile
    discard = refilled.discardPile
    const card = pile[pile.length - 1]
    if (!card) break
    pile = pile.slice(0, -1)
    drawn.push(card)
  }
  return { drawPile: pile, discardPile: discard, drawn }
}

const getSeatIndex = (state: UnoRoomState, seat: string) => state.players.findIndex((player) => player.seat === seat)

const getNextSeat = (state: UnoRoomState, seat: string, step: number) => {
  const total = state.players.length
  const index = getSeatIndex(state, seat)
  const next = (((index + state.direction * step) % total) + total) % total
  return state.players[next].seat
}

// Kartu dibagikan di server supaya isi tangan lawan tidak pernah dikirim ke klien lain.
export const getUnoRoomNewState = (seats: string[]): UnoRoomState => {
  let deck = getDeck()
  const players = seats.map((seat) => {
    const hand = deck.slice(-HAND_SIZE)
    deck = deck.slice(0, -HAND_SIZE)
    return { seat, hand, hasCalledUno: false }
  })

  let starter = deck[deck.length - 1]
  while (starter && (starter.value === 'wild' || starter.value === 'wild4')) {
    deck = [starter, ...deck.slice(0, -1)]
    starter = deck[deck.length - 1]
  }
  deck = deck.slice(0, -1)

  return {
    players,
    drawPile: deck,
    discardPile: starter ? [starter] : [],
    activeColor: starter?.color ?? 'red',
    currentSeat: seats[0] ?? 'p1',
    direction: 1,
    hasDrawnThisTurn: false,
    pendingDrawTotal: 0,
    lastAction: 'Permainan dimulai',
  }
}

const getAppliedPlay = (state: UnoRoomState, seat: string, cards: UnoCard[], chosenColor: UnoColor | null) => {
  const players = state.players.map((player) => ({ ...player, hand: [...player.hand] }))
  const index = players.findIndex((player) => player.seat === seat)
  const actor = players[index]

  // Kartu angka sama boleh dibuang bersamaan dalam satu giliran; hanya kartu terakhir yang
  // menentukan warna aktif berikutnya.
  const card = cards[cards.length - 1]
  const cardIds = new Set(cards.map((item) => item.id))
  actor.hand = actor.hand.filter((item) => !cardIds.has(item.id))
  let drawPile = state.drawPile
  let discardPile = [
    ...state.discardPile,
    ...cards.map((item, cardIndex) => ({
      ...item,
      color: cardIndex === cards.length - 1 ? (chosenColor ?? item.color) : item.color,
    })),
  ]
  let direction = state.direction
  let step = 1
  let lastAction =
    cards.length > 1 ? `${seat} membuang ${cards.length} kartu angka ${card.value}` : `${seat} membuang ${card.value}`

  if (card.value === 'reverse') {
    direction = players.length > 2 ? -direction : direction
    step = players.length > 2 ? 1 : 2
    lastAction = `${seat} membalik arah`
  }
  if (card.value === 'skip') {
    step = 2
    lastAction = `${seat} melewati pemain berikutnya`
  }
  // Kartu +2 dan +4 saling bisa ditimpa: tarikannya ditunda dan ditumpuk, giliran jatuh ke korban
  // supaya dia boleh menimpa dengan +2/+4 miliknya sendiri sebelum akhirnya menarik semuanya.
  let pendingDrawTotal = state.pendingDrawTotal
  if (card.value === 'draw2' || card.value === 'wild4') {
    const addedDraw = card.value === 'wild4' ? 4 : 2
    pendingDrawTotal += addedDraw
    step = 1
    lastAction = `${seat} menumpuk +${addedDraw}, total tarik ${pendingDrawTotal}`
  }

  // Lupa meneriakkan UNO membuat pemain menarik dua kartu tambahan.
  if (actor.hand.length === 1 && !actor.hasCalledUno) {
    const penalty = getDrawnCards(drawPile, discardPile, 2)
    drawPile = penalty.drawPile
    discardPile = penalty.discardPile
    actor.hand = [...actor.hand, ...penalty.drawn]
    lastAction = `${seat} lupa bilang UNO, menarik 2 kartu`
  }
  if (actor.hand.length !== 1) actor.hasCalledUno = false

  const winner = actor.hand.length ? '' : seat
  const nextState: UnoRoomState = {
    ...state,
    players,
    drawPile,
    discardPile,
    activeColor: chosenColor ?? card.color ?? state.activeColor,
    direction,
    hasDrawnThisTurn: false,
    pendingDrawTotal: winner ? 0 : pendingDrawTotal,
    currentSeat: seat,
    lastAction: winner ? `${seat} menang!` : lastAction,
  }
  nextState.currentSeat = winner ? seat : getNextSeat(nextState, seat, step)
  return { state: nextState, winner }
}

export const getUnoRoomAppliedMove = (
  state: UnoRoomState,
  seat: string,
  move: UnoRoomMove,
  moveTotal: number,
): UnoRoomResolvedMove | null => {
  if (getSeatIndex(state, seat) < 0) return null

  const player = state.players.find((item) => item.seat === seat)
  if (!player) return null

  // Teriakan UNO boleh dilakukan kapan saja saat kartu tinggal dua.
  if (move.action === 'uno') {
    if (player.hand.length !== 2) return null
    const players = state.players.map((item) =>
      item.seat === seat ? { ...item, hasCalledUno: true } : { ...item, hand: [...item.hand] },
    )
    return {
      state: { ...state, players, lastAction: `${seat} bilang UNO!` },
      turn: state.currentSeat,
      moveTotal,
      isFinished: false,
      winner: '',
    }
  }

  if (state.currentSeat !== seat) return null

  if (move.action === 'play') {
    const ids = move.cardIds?.length ? move.cardIds : move.cardId ? [move.cardId] : []
    const uniqueIds = Array.from(new Set(ids))
    if (!uniqueIds.length || uniqueIds.length !== ids.length) return null

    const cards = uniqueIds
      .map((id) => player.hand.find((item) => item.id === id))
      .filter((item): item is UnoCard => !!item)
    if (cards.length !== uniqueIds.length) return null

    // Selama tumpukan +2/+4 aktif, hanya kartu +2/+4 tunggal yang boleh dibuang untuk menimpanya;
    // kecocokan warna atau angka dengan kartu teratas tidak berlaku di sini.
    if (state.pendingDrawTotal > 0) {
      if (cards.length !== 1 || (cards[0].value !== 'draw2' && cards[0].value !== 'wild4')) return null
      const isWild4 = cards[0].value === 'wild4'
      const chosenColor = COLORS.includes(move.color as UnoColor) ? (move.color as UnoColor) : null
      if (isWild4 && !chosenColor) return null

      const applied = getAppliedPlay(state, seat, cards, isWild4 ? chosenColor : null)
      return {
        state: applied.state,
        turn: applied.state.currentSeat,
        moveTotal: moveTotal + 1,
        isFinished: !!applied.winner,
        winner: applied.winner,
      }
    }

    const topCard = state.discardPile[state.discardPile.length - 1]
    if (!getUnoRoomIsPlayable(cards[0], state.activeColor, topCard)) return null

    // Hanya kartu angka polos yang boleh dibuang bersamaan, dan seluruhnya wajib angka yang sama.
    if (cards.length > 1 && !cards.every((item) => getUnoRoomIsPlainNumber(item.value) && item.value === cards[0].value)) {
      return null
    }

    const isWild = cards.length === 1 && (cards[0].value === 'wild' || cards[0].value === 'wild4')
    const chosenColor = COLORS.includes(move.color as UnoColor) ? (move.color as UnoColor) : null
    if (isWild && !chosenColor) return null

    const applied = getAppliedPlay(state, seat, cards, isWild ? chosenColor : null)
    return {
      state: applied.state,
      turn: applied.state.currentSeat,
      moveTotal: moveTotal + 1,
      isFinished: !!applied.winner,
      winner: applied.winner,
    }
  }

  if (move.action === 'draw') {
    // Tumpukan +2/+4 aktif hanya bisa diterima kalau tangan pemain benar-benar tidak punya
    // kartu penimpa; kalau punya, dia wajib memakainya lewat action "play".
    if (state.pendingDrawTotal > 0) {
      const hasCounter = player.hand.some((item) => item.value === 'draw2' || item.value === 'wild4')
      if (hasCounter) return null

      const result = getDrawnCards(state.drawPile, state.discardPile, state.pendingDrawTotal)
      const players = state.players.map((item) =>
        item.seat === seat
          ? { ...item, hand: [...item.hand, ...result.drawn], hasCalledUno: false }
          : { ...item, hand: [...item.hand] },
      )
      const nextState: UnoRoomState = {
        ...state,
        players,
        drawPile: result.drawPile,
        discardPile: result.discardPile,
        hasDrawnThisTurn: false,
        pendingDrawTotal: 0,
        currentSeat: seat,
        lastAction: `${seat} menarik ${state.pendingDrawTotal} kartu tumpukan`,
      }
      nextState.currentSeat = getNextSeat(nextState, seat, 1)
      return { state: nextState, turn: nextState.currentSeat, moveTotal: moveTotal + 1, isFinished: false, winner: '' }
    }

    if (state.hasDrawnThisTurn) return null
    const result = getDrawnCards(state.drawPile, state.discardPile, 1)
    const players = state.players.map((item) =>
      item.seat === seat
        ? { ...item, hand: [...item.hand, ...result.drawn], hasCalledUno: false }
        : { ...item, hand: [...item.hand] },
    )
    const drawn = result.drawn[0]
    const topCard = result.discardPile[result.discardPile.length - 1]
    const isPlayable = !!drawn && getUnoRoomIsPlayable(drawn, state.activeColor, topCard)
    const nextState: UnoRoomState = {
      ...state,
      players,
      drawPile: result.drawPile,
      discardPile: result.discardPile,
      hasDrawnThisTurn: true,
      currentSeat: seat,
      lastAction: isPlayable ? `${seat} menarik kartu dan masih bisa membuang` : `${seat} menarik kartu`,
    }
    if (!isPlayable) {
      nextState.currentSeat = getNextSeat(nextState, seat, 1)
      nextState.hasDrawnThisTurn = false
    }
    return { state: nextState, turn: nextState.currentSeat, moveTotal: moveTotal + 1, isFinished: false, winner: '' }
  }

  if (move.action === 'pass') {
    if (!state.hasDrawnThisTurn) return null
    const nextState: UnoRoomState = { ...state, hasDrawnThisTurn: false, lastAction: `${seat} melewati giliran` }
    nextState.currentSeat = getNextSeat(nextState, seat, 1)
    return { state: nextState, turn: nextState.currentSeat, moveTotal: moveTotal + 1, isFinished: false, winner: '' }
  }

  return null
}

// Setiap pemain hanya menerima kartunya sendiri, lawan cukup jumlah kartunya.
export const getUnoRoomView = (state: UnoRoomState, seat: string | null) => {
  const topCard = state.discardPile[state.discardPile.length - 1] ?? null
  const own = state.players.find((player) => player.seat === seat)
  return {
    hand: own ? own.hand : [],
    hasCalledUno: own ? own.hasCalledUno : false,
    opponents: state.players
      .filter((player) => player.seat !== seat)
      .map((player) => ({ seat: player.seat, cardTotal: player.hand.length, hasCalledUno: player.hasCalledUno })),
    topCard,
    activeColor: state.activeColor,
    drawTotal: state.drawPile.length,
    discardTotal: state.discardPile.length,
    hasDrawnThisTurn: state.hasDrawnThisTurn,
    pendingDrawTotal: state.pendingDrawTotal,
    lastAction: state.lastAction,
  }
}

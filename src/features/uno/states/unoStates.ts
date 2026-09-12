import { create } from 'zustand'
import type { DataUnoGame, UnoCard, UnoColor, UnoGame, UnoPlayer, UnoValue } from '../types/unoTypes'

interface UnoStore {
  unoGame: UnoGame
  setUnoInit: () => void
  setUnoPlayCard: (cardId: string) => void
  setUnoPlayCards: (cardIds: string[]) => void
  setUnoPickColor: (color: UnoColor) => void
  setUnoDrawCard: () => void
  setUnoPass: () => void
  setUnoCallUno: () => void
  setUnoBotTurn: () => void
  setUnoRestart: () => void
}

const COLORS: UnoColor[] = ['red', 'yellow', 'green', 'blue']
const NUMBERS: UnoValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTIONS: UnoValue[] = ['skip', 'reverse', 'draw2']
const HAND_SIZE = 7
const BOT_NAMES = ['Budi', 'Sinta', 'Rama']

export const useUnoStates = create<UnoStore>((set, get) => {
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

  const getRoomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let index = 0; index < 6; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return code
  }

  const getIsPlayable = (card: UnoCard, activeColor: UnoColor, topCard: UnoCard | undefined) => {
    if (card.value === 'wild' || card.value === 'wild4') return true
    if (card.color === activeColor) return true
    return !!topCard && topCard.value === card.value
  }

  // Hanya kartu angka polos (bukan aksi maupun wild) yang boleh dibuang berpasangan dalam satu giliran.
  const getIsPlainNumber = (value: UnoValue) => ![...ACTIONS, 'wild', 'wild4'].includes(value)

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

  const getNextPlayer = (current: number, direction: number, total: number, step: number) =>
    (((current + direction * step) % total) + total) % total

  const getNewGame = () => {
    let deck = getDeck()
    const players: UnoPlayer[] = [
      { id: 0, name: 'You', isHuman: true, hand: [], hasCalledUno: false },
      ...BOT_NAMES.map((name, index) => ({
        id: index + 1,
        name,
        isHuman: false,
        hand: [],
        hasCalledUno: false,
      })),
    ]

    players.forEach((player) => {
      player.hand = deck.slice(-HAND_SIZE)
      deck = deck.slice(0, -HAND_SIZE)
    })

    let starter = deck[deck.length - 1]
    while (starter && (starter.value === 'wild' || starter.value === 'wild4')) {
      deck = [starter, ...deck.slice(0, -1)]
      starter = deck[deck.length - 1]
    }
    deck = deck.slice(0, -1)

    const data: DataUnoGame = {
      roomCode: getRoomCode(),
      players,
      drawPile: deck,
      discardPile: starter ? [starter] : [],
      activeColor: starter?.color ?? 'red',
      currentPlayer: 0,
      direction: 1,
      pendingWildCardId: null,
      hasDrawnThisTurn: false,
      pendingDrawTotal: 0,
      winnerId: null,
      lastAction: 'Game started. Your turn!',
    }
    return data
  }

  const getAppliedPlay = (data: DataUnoGame, playerIndex: number, cards: UnoCard[], chosenColor: UnoColor | null) => {
    const players = data.players.map((player) => ({ ...player, hand: [...player.hand] }))
    const actor = players[playerIndex]
    const total = players.length

    // Kartu angka sama boleh dibuang bersamaan dalam satu giliran; hanya kartu terakhir yang
    // menentukan warna aktif berikutnya.
    const card = cards[cards.length - 1]
    const cardIds = new Set(cards.map((item) => item.id))
    actor.hand = actor.hand.filter((item) => !cardIds.has(item.id))
    const discardPile = [
      ...data.discardPile,
      ...cards.map((item, cardIndex) => ({
        ...item,
        color: cardIndex === cards.length - 1 ? (chosenColor ?? item.color) : item.color,
      })),
    ]
    let drawPile = data.drawPile
    let workingDiscard = discardPile
    let direction = data.direction
    let step = 1
    let lastAction =
      cards.length > 1 ? `${actor.name} played ${cards.length} cards of ${card.value}` : `${actor.name} played ${card.value}`

    if (card.value === 'reverse') {
      direction = total > 2 ? -direction : direction
      step = total > 2 ? 1 : 2
      lastAction = `${actor.name} reversed the direction`
    }
    if (card.value === 'skip') {
      step = 2
      lastAction = `${actor.name} skipped the next player`
    }
    // Kartu +2 dan +4 saling bisa ditimpa: tarikannya ditunda dan ditumpuk, giliran jatuh ke korban
    // supaya dia boleh menimpa dengan +2/+4 miliknya sendiri sebelum akhirnya menarik semuanya.
    let pendingDrawTotal = data.pendingDrawTotal
    if (card.value === 'draw2' || card.value === 'wild4') {
      const addedDraw = card.value === 'wild4' ? 4 : 2
      pendingDrawTotal += addedDraw
      step = 1
      lastAction = `${actor.name} stacks +${addedDraw}, ${pendingDrawTotal} to draw`
    }

    if (actor.hand.length === 1 && !actor.hasCalledUno) {
      const penalty = getDrawnCards(drawPile, workingDiscard, 2)
      drawPile = penalty.drawPile
      workingDiscard = penalty.discardPile
      actor.hand = [...actor.hand, ...penalty.drawn]
      lastAction = `${actor.name} forgot to call UNO, draws 2 cards`
    }
    if (actor.hand.length !== 1) actor.hasCalledUno = false

    const winnerId = actor.hand.length ? null : actor.id
    const activeColor = chosenColor ?? card.color ?? data.activeColor

    return {
      ...data,
      players,
      drawPile,
      discardPile: workingDiscard,
      activeColor,
      direction,
      currentPlayer: winnerId === null ? getNextPlayer(playerIndex, direction, total, step) : playerIndex,
      pendingWildCardId: null,
      hasDrawnThisTurn: false,
      pendingDrawTotal: winnerId === null ? pendingDrawTotal : 0,
      winnerId,
      lastAction: winnerId === null ? lastAction : `${actor.name} wins!`,
    }
  }

  const getBotChoice = (data: DataUnoGame, player: UnoPlayer) => {
    const topCard = data.discardPile[data.discardPile.length - 1]
    const playable = player.hand.filter((card) => getIsPlayable(card, data.activeColor, topCard))
    if (!playable.length) return null

    const getColorScore = (color: UnoColor) => player.hand.filter((card) => card.color === color).length
    const getPriority = (card: UnoCard) => {
      if (card.value === 'wild4') return 1
      if (card.value === 'draw2' || card.value === 'skip' || card.value === 'reverse') return 3
      if (card.value === 'wild') return 2
      return 4
    }

    const sorted = [...playable].sort((left, right) => {
      const priority = getPriority(right) - getPriority(left)
      if (priority !== 0) return priority
      return getColorScore(right.color ?? 'red') - getColorScore(left.color ?? 'red')
    })
    const card = sorted[0]
    const chosenColor =
      card.value === 'wild' || card.value === 'wild4'
        ? [...COLORS].sort((left, right) => getColorScore(right) - getColorScore(left))[0]
        : null
    return { card, chosenColor }
  }

  return {
    unoGame: {
      status: 'loading',
      statusTitle: 'Preparing the table',
      statusSubtitle: 'Please wait a moment.',
      data: null,
    },

    setUnoInit: () =>
      set({
        unoGame: { status: 'success', statusTitle: '', statusSubtitle: '', data: getNewGame() },
      }),

    setUnoRestart: () =>
      set({
        unoGame: { status: 'success', statusTitle: '', statusSubtitle: '', data: getNewGame() },
      }),

    setUnoPlayCard: (cardId) => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.pendingWildCardId) return

      const getRejected = (message: string) =>
        set((state) => ({ unoGame: { ...state.unoGame, data: { ...data, lastAction: message } } }))

      if (data.currentPlayer !== 0) {
        getRejected('Wait for your turn')
        return
      }

      const player = data.players[0]
      const card = player.hand.find((item) => item.id === cardId)
      if (!card) return

      if (data.pendingDrawTotal > 0) {
        if (card.value !== 'draw2' && card.value !== 'wild4') {
          getRejected('You must play a +2/+4 or draw the stack first')
          return
        }
        if (card.value === 'wild4') {
          set((state) => ({ unoGame: { ...state.unoGame, data: { ...data, pendingWildCardId: card.id } } }))
          return
        }
        set((state) => ({ unoGame: { ...state.unoGame, data: getAppliedPlay(data, 0, [card], null) } }))
        return
      }

      const topCard = data.discardPile[data.discardPile.length - 1]
      if (!getIsPlayable(card, data.activeColor, topCard)) {
        getRejected('That card does not match the color or number')
        return
      }

      if (card.value === 'wild' || card.value === 'wild4') {
        set((state) => ({ unoGame: { ...state.unoGame, data: { ...data, pendingWildCardId: card.id } } }))
        return
      }

      set((state) => ({ unoGame: { ...state.unoGame, data: getAppliedPlay(data, 0, [card], null) } }))
    },

    setUnoPlayCards: (cardIds) => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.pendingWildCardId) return

      const getRejected = (message: string) =>
        set((state) => ({ unoGame: { ...state.unoGame, data: { ...data, lastAction: message } } }))

      if (data.currentPlayer !== 0) {
        getRejected('Wait for your turn')
        return
      }

      if (data.pendingDrawTotal > 0) {
        getRejected('You must play a +2/+4 or draw the stack first')
        return
      }

      const player = data.players[0]
      const uniqueIds = Array.from(new Set(cardIds))
      const cards = uniqueIds
        .map((id) => player.hand.find((item) => item.id === id))
        .filter((item): item is UnoCard => !!item)
      if (cards.length < 2 || cards.length !== uniqueIds.length) return

      const topCard = data.discardPile[data.discardPile.length - 1]
      if (!getIsPlayable(cards[0], data.activeColor, topCard)) {
        getRejected('That card does not match the color or number')
        return
      }
      if (!cards.every((item) => getIsPlainNumber(item.value) && item.value === cards[0].value)) {
        getRejected('Cards must share the same number')
        return
      }

      set((state) => ({ unoGame: { ...state.unoGame, data: getAppliedPlay(data, 0, cards, null) } }))
    },

    setUnoPickColor: (color) => {
      const data = get().unoGame.data
      if (!data || !data.pendingWildCardId) return
      const card = data.players[0].hand.find((item) => item.id === data.pendingWildCardId)
      if (!card) return
      set((state) => ({ unoGame: { ...state.unoGame, data: getAppliedPlay(data, 0, [card], color) } }))
    },

    setUnoDrawCard: () => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.currentPlayer !== 0) return

      if (data.pendingDrawTotal > 0) {
        const player = data.players[0]
        const hasCounter = player.hand.some((item) => item.value === 'draw2' || item.value === 'wild4')
        if (hasCounter) return

        const result = getDrawnCards(data.drawPile, data.discardPile, data.pendingDrawTotal)
        const players = data.players.map((item) => ({ ...item, hand: [...item.hand] }))
        players[0].hand = [...players[0].hand, ...result.drawn]
        players[0].hasCalledUno = false

        set((state) => ({
          unoGame: {
            ...state.unoGame,
            data: {
              ...data,
              players,
              drawPile: result.drawPile,
              discardPile: result.discardPile,
              hasDrawnThisTurn: false,
              pendingDrawTotal: 0,
              currentPlayer: getNextPlayer(0, data.direction, players.length, 1),
              lastAction: `You drew ${data.pendingDrawTotal} stacked cards`,
            },
          },
        }))
        return
      }

      if (data.hasDrawnThisTurn) return

      const result = getDrawnCards(data.drawPile, data.discardPile, 1)
      const players = data.players.map((player) => ({ ...player, hand: [...player.hand] }))
      players[0].hand = [...players[0].hand, ...result.drawn]
      players[0].hasCalledUno = false
      const topCard = result.discardPile[result.discardPile.length - 1]
      const drawn = result.drawn[0]
      const isPlayable = !!drawn && getIsPlayable(drawn, data.activeColor, topCard)

      set((state) => ({
        unoGame: {
          ...state.unoGame,
          data: {
            ...data,
            players,
            drawPile: result.drawPile,
            discardPile: result.discardPile,
            hasDrawnThisTurn: true,
            currentPlayer: isPlayable ? 0 : getNextPlayer(0, data.direction, players.length, 1),
            lastAction: isPlayable ? 'You drew a card and can still play it' : 'You drew a card',
          },
        },
      }))
    },

    setUnoPass: () => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.currentPlayer !== 0 || !data.hasDrawnThisTurn) return
      set((state) => ({
        unoGame: {
          ...state.unoGame,
          data: {
            ...data,
            hasDrawnThisTurn: false,
            currentPlayer: getNextPlayer(0, data.direction, data.players.length, 1),
            lastAction: 'You passed your turn',
          },
        },
      }))
    },

    setUnoCallUno: () => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.players[0].hand.length !== 2) return
      const players = data.players.map((player) => ({ ...player, hand: [...player.hand] }))
      players[0].hasCalledUno = true
      set((state) => ({
        unoGame: { ...state.unoGame, data: { ...data, players, lastAction: 'You called UNO!' } },
      }))
    },

    setUnoBotTurn: () => {
      const data = get().unoGame.data
      if (!data || data.winnerId !== null || data.currentPlayer === 0) return

      const index = data.currentPlayer
      const player = data.players[index]

      if (data.pendingDrawTotal > 0) {
        const getColorScore = (color: UnoColor) => player.hand.filter((item) => item.color === color).length
        const counter = player.hand.find((item) => item.value === 'draw2' || item.value === 'wild4')

        if (counter) {
          const chosenColor = counter.value === 'wild4' ? [...COLORS].sort((left, right) => getColorScore(right) - getColorScore(left))[0] : null
          set((state) => ({
            unoGame: { ...state.unoGame, data: getAppliedPlay(data, index, [counter], chosenColor) },
          }))
          return
        }

        const result = getDrawnCards(data.drawPile, data.discardPile, data.pendingDrawTotal)
        const players = data.players.map((item) => ({ ...item, hand: [...item.hand] }))
        players[index].hand = [...players[index].hand, ...result.drawn]
        players[index].hasCalledUno = false
        set((state) => ({
          unoGame: {
            ...state.unoGame,
            data: {
              ...data,
              players,
              drawPile: result.drawPile,
              discardPile: result.discardPile,
              hasDrawnThisTurn: false,
              pendingDrawTotal: 0,
              currentPlayer: getNextPlayer(index, data.direction, players.length, 1),
              lastAction: `${player.name} draws ${data.pendingDrawTotal} stacked cards`,
            },
          },
        }))
        return
      }

      const choice = getBotChoice(data, player)

      if (choice) {
        const players = data.players.map((item) => ({ ...item, hand: [...item.hand] }))
        players[index].hasCalledUno = players[index].hand.length === 2
        const withCall = { ...data, players }
        set((state) => ({
          unoGame: { ...state.unoGame, data: getAppliedPlay(withCall, index, [choice.card], choice.chosenColor) },
        }))
        return
      }

      const result = getDrawnCards(data.drawPile, data.discardPile, 1)
      const players = data.players.map((item) => ({ ...item, hand: [...item.hand] }))
      players[index].hand = [...players[index].hand, ...result.drawn]
      players[index].hasCalledUno = false
      const topCard = result.discardPile[result.discardPile.length - 1]
      const drawn = result.drawn[0]

      if (drawn && getIsPlayable(drawn, data.activeColor, topCard)) {
        const drawnData = { ...data, players, drawPile: result.drawPile, discardPile: result.discardPile }
        const chosenColor =
          drawn.value === 'wild' || drawn.value === 'wild4'
            ? [...COLORS].sort(
                (left, right) =>
                  players[index].hand.filter((card) => card.color === right).length -
                  players[index].hand.filter((card) => card.color === left).length,
              )[0]
            : null
        set((state) => ({
          unoGame: { ...state.unoGame, data: getAppliedPlay(drawnData, index, [drawn], chosenColor) },
        }))
        return
      }

      set((state) => ({
        unoGame: {
          ...state.unoGame,
          data: {
            ...data,
            players,
            drawPile: result.drawPile,
            discardPile: result.discardPile,
            currentPlayer: getNextPlayer(index, data.direction, players.length, 1),
            lastAction: `${player.name} draws a card`,
          },
        },
      }))
    },
  }
})

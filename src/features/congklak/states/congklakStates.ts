import { create } from 'zustand'
import type { CongklakGame, CongklakHole, CongklakSide, DataCongklakGame } from '../types/congklakTypes'

interface CongklakStore {
  congklakGame: CongklakGame
  setCongklakInit: () => void
  setCongklakSow: (holeIndex: number) => void
  setCongklakStep: () => void
  setCongklakBot: () => void
  setCongklakUndo: () => void
  setCongklakRestart: () => void
}

type CongklakContext = {
  board: number[]
  side: CongklakSide
  hand: number
  cursor: number
}

type CongklakSnapshot = {
  board: number[]
  turn: CongklakSide
  moveTotal: number
}

const HOLE_TOTAL = 7
const SEED_TOTAL = 7
const PLAYER_STORE = 7
const BOT_STORE = 15
const RING_TOTAL = 16
const UNDO_TOTAL = 3

export const useCongklakStates = create<CongklakStore>((set) => {
  let board: number[] = []
  let turn: CongklakSide = 'player'
  let hand = 0
  let cursor = -1
  let isSowing = false
  let moveTotal = 0
  let captureTotal = 0
  let undoLeft = UNDO_TOTAL
  let winner = ''
  let isFinished = false
  let history: CongklakSnapshot[] = []

  const getNewBoard = () => {
    const next = new Array<number>(RING_TOTAL).fill(SEED_TOTAL)
    next[PLAYER_STORE] = 0
    next[BOT_STORE] = 0
    return next
  }

  const getStoreIndex = (side: CongklakSide) => (side === 'player' ? PLAYER_STORE : BOT_STORE)

  const getIsOwnHole = (side: CongklakSide, index: number) =>
    side === 'player' ? index < PLAYER_STORE : index > PLAYER_STORE && index < BOT_STORE

  const getSideTotal = (source: number[], side: CongklakSide) => {
    const start = side === 'player' ? 0 : PLAYER_STORE + 1
    let total = 0
    for (let step = 0; step < HOLE_TOTAL; step += 1) total += source[start + step]
    return total
  }

  // Biji berjalan berlawanan arah jarum jam dan melewati rumah milik lawan.
  const getNextIndex = (side: CongklakSide, index: number) => {
    const next = (index + 1) % RING_TOTAL
    if (next === getStoreIndex(side === 'player' ? 'bot' : 'player')) return (next + 1) % RING_TOTAL
    return next
  }

  const updateSteppedContext = (context: CongklakContext) => {
    context.cursor = getNextIndex(context.side, context.cursor)
    context.board[context.cursor] += 1
    context.hand -= 1
    if (context.hand > 0) return { isDone: false, capture: 0 }

    // Berhenti di rumah sendiri berarti pemain mendapat giliran tambahan.
    if (context.cursor === getStoreIndex(context.side)) return { isDone: true, capture: 0, isExtraTurn: true }

    // Lubang yang masih berisi membuat biji diambil kembali dan disebar lagi.
    if (context.board[context.cursor] > 1) {
      context.hand = context.board[context.cursor]
      context.board[context.cursor] = 0
      return { isDone: false, capture: 0 }
    }

    // Berhenti di lubang kosong milik sendiri berarti menembak isi lubang seberang.
    const opposite = RING_TOTAL - 2 - context.cursor
    if (getIsOwnHole(context.side, context.cursor) && context.board[opposite] > 0) {
      const capture = context.board[opposite] + context.board[context.cursor]
      context.board[getStoreIndex(context.side)] += capture
      context.board[context.cursor] = 0
      context.board[opposite] = 0
      return { isDone: true, capture }
    }
    return { isDone: true, capture: 0 }
  }

  const updateFinishedBoard = (source: number[], side: CongklakSide) => {
    // Permainan berakhir saat pemain yang mendapat giliran kehabisan biji, atau lebih awal begitu
    // sisa biji di seluruh bidak sudah tidak cukup untuk mengejar selisih skor yang ada — pemenangnya
    // sudah pasti berapa pun jalannya sisa permainan, jadi tidak perlu dituntaskan sampai bidak kosong.
    const remainingSeeds = getSideTotal(source, 'player') + getSideTotal(source, 'bot')
    const isAlreadyDecided =
      source[PLAYER_STORE] > source[BOT_STORE] + remainingSeeds || source[BOT_STORE] > source[PLAYER_STORE] + remainingSeeds
    if (getSideTotal(source, side) && !isAlreadyDecided) return false
    const sides: CongklakSide[] = ['player', 'bot']
    sides.forEach((item) => {
      const start = item === 'player' ? 0 : PLAYER_STORE + 1
      for (let step = 0; step < HOLE_TOTAL; step += 1) {
        source[getStoreIndex(item)] += source[start + step]
        source[start + step] = 0
      }
    })
    return true
  }

  const getWinner = (source: number[]) => {
    if (source[PLAYER_STORE] === source[BOT_STORE]) return 'draw'
    return source[PLAYER_STORE] > source[BOT_STORE] ? 'player' : 'bot'
  }

  const getHole = (index: number): CongklakHole => ({
    index,
    seedTotal: board[index],
    side: index <= PLAYER_STORE ? 'player' : 'bot',
    isStore: index === PLAYER_STORE || index === BOT_STORE,
    isPlayable: turn === 'player' && !isSowing && !isFinished && index < PLAYER_STORE && board[index] > 0,
    isActive: cursor === index && isSowing,
  })

  const getData = (): DataCongklakGame => {
    const holes = board.map((seed, index) => getHole(index))
    return {
      holes,
      playerHoles: holes.slice(0, HOLE_TOTAL),
      botHoles: holes.slice(PLAYER_STORE + 1, BOT_STORE),
      playerStore: holes[PLAYER_STORE],
      botStore: holes[BOT_STORE],
      turn,
      moveTotal,
      undoLeft,
      handTotal: hand,
      captureTotal,
      isSowing,
      isFinished,
      winner,
    }
  }

  const updateGame = () =>
    set({ congklakGame: { status: 'success', statusTitle: '', statusSubtitle: '', data: getData() } })

  const updateNewGame = () => {
    board = getNewBoard()
    turn = 'player'
    hand = 0
    cursor = -1
    isSowing = false
    moveTotal = 0
    captureTotal = 0
    undoLeft = UNDO_TOTAL
    winner = ''
    isFinished = false
    history = []
    updateGame()
  }

  const updateStartedMove = (side: CongklakSide, holeIndex: number) => {
    if (isSowing || isFinished || turn !== side) return
    if (!getIsOwnHole(side, holeIndex) || !board[holeIndex]) return

    // Riwayat hanya menyimpan langkah pemain supaya undo kembali ke giliran pemain.
    if (side === 'player') history = [...history, { board: [...board], turn, moveTotal }].slice(-UNDO_TOTAL)
    hand = board[holeIndex]
    board[holeIndex] = 0
    cursor = holeIndex
    isSowing = true
    moveTotal += 1
    updateGame()
  }

  const getBestBotHole = () => {
    const candidates: Array<{ holeIndex: number; score: number }> = []
    for (let step = 0; step < HOLE_TOTAL; step += 1) {
      const holeIndex = PLAYER_STORE + 1 + step
      if (!board[holeIndex]) continue

      const context: CongklakContext = { board: [...board], side: 'bot', hand: board[holeIndex], cursor: holeIndex }
      context.board[holeIndex] = 0
      let guard = 0
      let result = updateSteppedContext(context)
      while (!result.isDone && guard < 800) {
        result = updateSteppedContext(context)
        guard += 1
      }

      const storeGain = context.board[BOT_STORE] - board[BOT_STORE]
      const rivalGain = context.board[PLAYER_STORE] - board[PLAYER_STORE]
      const score = storeGain * 2 - rivalGain + (result.isExtraTurn ? 6 : 0)
      candidates.push({ holeIndex, score })
    }
    if (!candidates.length) return -1
    return candidates.sort((left, right) => right.score - left.score)[0].holeIndex
  }

  return {
    congklakGame: {
      status: 'loading',
      statusTitle: 'Menyiapkan papan',
      statusSubtitle: 'Mohon tunggu sebentar.',
      data: null,
    },

    setCongklakInit: () => updateNewGame(),
    setCongklakRestart: () => updateNewGame(),

    setCongklakSow: (holeIndex) => updateStartedMove('player', holeIndex),

    setCongklakBot: () => {
      const holeIndex = getBestBotHole()
      if (holeIndex < 0) return
      updateStartedMove('bot', holeIndex)
    },

    setCongklakStep: () => {
      if (!isSowing) return

      const context: CongklakContext = { board, side: turn, hand, cursor }
      const result = updateSteppedContext(context)
      hand = context.hand
      cursor = context.cursor
      captureTotal += result.capture
      if (!result.isDone) {
        updateGame()
        return
      }

      isSowing = false
      if (!result.isExtraTurn) turn = turn === 'player' ? 'bot' : 'player'
      if (updateFinishedBoard(board, turn)) {
        isFinished = true
        winner = getWinner(board)
      }
      updateGame()
    },

    setCongklakUndo: () => {
      const snapshot = history[history.length - 1]
      if (!snapshot || isSowing || isFinished || !undoLeft) return

      board = [...snapshot.board]
      turn = snapshot.turn
      moveTotal = snapshot.moveTotal
      hand = 0
      cursor = -1
      undoLeft -= 1
      history = history.slice(0, -1)
      updateGame()
    },
  }
})

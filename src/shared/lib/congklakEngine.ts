export type CongklakSeat = 'host' | 'guest'

export type CongklakResolvedMove = {
  board: number[]
  frames: number[][]
  turn: CongklakSeat
  moveTotal: number
  captureTotal: number
  isFinished: boolean
  winner: string
}

export const CONGKLAK_HOLE_TOTAL = 7
export const CONGKLAK_SEED_TOTAL = 7
export const CONGKLAK_HOST_STORE = 7
export const CONGKLAK_GUEST_STORE = 15
export const CONGKLAK_RING_TOTAL = 16

const getStoreIndex = (seat: CongklakSeat) => (seat === 'host' ? CONGKLAK_HOST_STORE : CONGKLAK_GUEST_STORE)

const getRivalSeat = (seat: CongklakSeat): CongklakSeat => (seat === 'host' ? 'guest' : 'host')

// Biji berjalan berlawanan arah jarum jam dan melewati rumah milik lawan.
const getNextIndex = (seat: CongklakSeat, index: number) => {
  const next = (index + 1) % CONGKLAK_RING_TOTAL
  if (next === getStoreIndex(getRivalSeat(seat))) return (next + 1) % CONGKLAK_RING_TOTAL
  return next
}

const getSideStart = (seat: CongklakSeat) => (seat === 'host' ? 0 : CONGKLAK_HOST_STORE + 1)

export const getCongklakIsOwnHole = (seat: CongklakSeat, index: number) =>
  seat === 'host'
    ? index >= 0 && index < CONGKLAK_HOST_STORE
    : index > CONGKLAK_HOST_STORE && index < CONGKLAK_GUEST_STORE

export const getCongklakSideTotal = (board: number[], seat: CongklakSeat) => {
  const start = getSideStart(seat)
  let total = 0
  for (let step = 0; step < CONGKLAK_HOLE_TOTAL; step += 1) total += board[start + step]
  return total
}

export const getCongklakNewBoard = () => {
  const board = new Array<number>(CONGKLAK_RING_TOTAL).fill(CONGKLAK_SEED_TOTAL)
  board[CONGKLAK_HOST_STORE] = 0
  board[CONGKLAK_GUEST_STORE] = 0
  return board
}

const getSweptBoard = (board: number[]) => {
  const seats: CongklakSeat[] = ['host', 'guest']
  seats.forEach((seat) => {
    const start = getSideStart(seat)
    for (let step = 0; step < CONGKLAK_HOLE_TOTAL; step += 1) {
      board[getStoreIndex(seat)] += board[start + step]
      board[start + step] = 0
    }
  })
}

const getWinner = (board: number[]) => {
  if (board[CONGKLAK_HOST_STORE] === board[CONGKLAK_GUEST_STORE]) return 'draw'
  return board[CONGKLAK_HOST_STORE] > board[CONGKLAK_GUEST_STORE] ? 'host' : 'guest'
}

export const getCongklakIsMoveAllowed = (board: number[], seat: CongklakSeat, holeIndex: number) =>
  getCongklakIsOwnHole(seat, holeIndex) && board[holeIndex] > 0

// Satu langkah diselesaikan penuh di server supaya kedua pemain melihat papan yang sama.
export const getCongklakResolvedMove = (
  board: number[],
  seat: CongklakSeat,
  holeIndex: number,
  moveTotal: number,
): CongklakResolvedMove => {
  const next = [...board]
  let hand = next[holeIndex]
  let cursor = holeIndex
  let captureTotal = 0
  let isExtraTurn = false
  next[holeIndex] = 0
  // Tiap tahap direkam supaya klien bisa menaburkan biji satu per satu, bukan melompat ke hasil.
  const frames: number[][] = [[...next]]

  for (let guard = 0; guard < 4096 && hand > 0; guard += 1) {
    cursor = getNextIndex(seat, cursor)
    next[cursor] += 1
    hand -= 1
    frames.push([...next])
    if (hand > 0) continue

    // Berhenti di rumah sendiri berarti pemain mendapat giliran tambahan.
    if (cursor === getStoreIndex(seat)) {
      isExtraTurn = true
      break
    }
    // Lubang yang masih berisi membuat biji diambil kembali dan disebar lagi.
    if (next[cursor] > 1) {
      hand = next[cursor]
      next[cursor] = 0
      frames.push([...next])
      continue
    }
    // Berhenti di lubang kosong milik sendiri berarti menembak isi lubang seberang.
    const opposite = CONGKLAK_RING_TOTAL - 2 - cursor
    if (getCongklakIsOwnHole(seat, cursor) && next[opposite] > 0) {
      captureTotal = next[opposite] + next[cursor]
      next[getStoreIndex(seat)] += captureTotal
      next[cursor] = 0
      next[opposite] = 0
      frames.push([...next])
    }
  }

  const turn = isExtraTurn ? seat : getRivalSeat(seat)
  // Permainan berakhir saat pemain yang mendapat giliran kehabisan biji, atau lebih awal begitu
  // sisa biji di seluruh bidak sudah tidak cukup untuk mengejar selisih skor yang ada — pemenangnya
  // sudah pasti berapa pun jalannya sisa permainan, jadi tidak perlu dituntaskan sampai bidak kosong.
  const remainingSeeds = getCongklakSideTotal(next, 'host') + getCongklakSideTotal(next, 'guest')
  const isAlreadyDecided =
    next[CONGKLAK_HOST_STORE] > next[CONGKLAK_GUEST_STORE] + remainingSeeds ||
    next[CONGKLAK_GUEST_STORE] > next[CONGKLAK_HOST_STORE] + remainingSeeds
  const isFinished = !getCongklakSideTotal(next, turn) || isAlreadyDecided
  if (isFinished) {
    getSweptBoard(next)
    frames.push([...next])
  }

  return {
    board: next,
    frames,
    turn,
    moveTotal: moveTotal + 1,
    captureTotal,
    isFinished,
    winner: isFinished ? getWinner(next) : '',
  }
}

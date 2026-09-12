import { randomBytes } from 'crypto'
import type { CongklakSeat } from './congklakEngine'
import {
  CONGKLAK_GUEST_STORE,
  CONGKLAK_HOST_STORE,
  getCongklakIsMoveAllowed,
  getCongklakNewBoard,
  getCongklakResolvedMove,
} from './congklakEngine'
import { CHESS_ROOM_START_FEN, getChessRoomAppliedMove } from './chessRoomEngine'
import {
  getDotsAndBoxesIsMoveAllowed,
  getDotsAndBoxesNewLines,
  getDotsAndBoxesNewOwners,
  getDotsAndBoxesResolvedMove,
} from './dotsAndBoxesEngine'
import { getGomokuIsMoveAllowed, getGomokuNewCells, getGomokuResolvedMove } from './gomokuEngine'
import { getOthelloIsMoveAllowed, getOthelloNewCells, getOthelloResolvedMove } from './othelloEngine'
import { getUnoRoomAppliedMove, getUnoRoomNewState, getUnoRoomView } from './unoRoomEngine'
import type { UnoRoomState } from './unoRoomEngine'

export type GameRoomSeat = 'p1' | 'p2' | 'p3' | 'p4'

export type GameRoomPlayer = {
  seat: GameRoomSeat
  token: string
  name: string
  seenAt?: number
}

// Kursi yang pemiliknya tidak terlihat selama tiga puluh detik dianggap ditinggalkan.
export const GAME_ROOM_ABSENT_MS = 30000

export const getGameRoomIsPresent = (player: GameRoomPlayer, now = Date.now()) =>
  typeof player.seenAt === 'number' && now - player.seenAt < GAME_ROOM_ABSENT_MS

export type GameRoomRecord = {
  code: string
  game: string
  status: string
  seatTotal: number
  players: GameRoomPlayer[]
  turn: string
  state: Record<string, unknown>
  moveTotal: number
  winner: string
  updatedAt: Date
}


export type GameRoomMovePayload = {
  holeIndex?: number
  from?: string
  to?: string
  promotion?: string
  action?: string
  cardId?: string
  cardIds?: string[]
  color?: string
  lineIndex?: number
  cellIndex?: number
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SEATS: GameRoomSeat[] = ['p1', 'p2', 'p3', 'p4']

export const GAME_ROOM_SEAT_TOTAL: Record<string, number> = { congklak: 2, chess: 2, uno: 4, 'dots-and-boxes': 2, othello: 2, gomoku: 2 }
// Hanya uno yang jumlah pemainnya bisa dipilih tuan rumah; papan lain selalu berdua.
export const GAME_ROOM_SEAT_MIN: Record<string, number> = { congklak: 2, chess: 2, uno: 2, 'dots-and-boxes': 2, othello: 2, gomoku: 2 }

export const getGameRoomSeatOptions = (game: string) => {
  const min = GAME_ROOM_SEAT_MIN[game]
  const max = GAME_ROOM_SEAT_TOTAL[game]
  if (!min || !max || min === max) return []
  return Array.from({ length: max - min + 1 }, (_, step) => min + step)
}

export const getGameRoomCode = () => {
  const bytes = randomBytes(6)
  let code = ''
  for (let step = 0; step < 6; step += 1) code += CODE_ALPHABET[bytes[step] % CODE_ALPHABET.length]
  return code
}

export const getGameRoomToken = () => randomBytes(18).toString('hex')

export const getGameRoomPlayers = (value: unknown): GameRoomPlayer[] => (Array.isArray(value) ? (value as GameRoomPlayer[]) : [])

export const getGameRoomSeat = (players: GameRoomPlayer[], token: string) => {
  if (!token) return null
  const found = players.find((player) => player.token === token)
  return found ? found.seat : null
}

export const getGameRoomFreeSeat = (players: GameRoomPlayer[], seatTotal: number) =>
  SEATS.slice(0, seatTotal).find((seat) => !players.some((player) => player.seat === seat)) ?? null

// Kursi yang ditinggalkan boleh diambil alih supaya ruangan tidak terkunci oleh tab yang ditutup.
export const getGameRoomAbandonedSeat = (players: GameRoomPlayer[]) => {
  const now = Date.now()
  const absent = players.filter((player) => !getGameRoomIsPresent(player, now))
  if (!absent.length) return null
  return absent.sort((left, right) => (left.seenAt ?? 0) - (right.seenAt ?? 0))[0].seat
}

// Papan awal setiap game disiapkan di server supaya kedua pemain berangkat dari state yang sama.
export const getGameRoomNewState = (game: string) => {
  if (game === 'congklak') return { board: getCongklakNewBoard() }
  if (game === 'chess') return { fen: CHESS_ROOM_START_FEN, lastMove: null }
  if (game === 'dots-and-boxes') return { lines: getDotsAndBoxesNewLines(), owners: getDotsAndBoxesNewOwners() }
  if (game === 'othello') return { cells: getOthelloNewCells() }
  if (game === 'gomoku') return { cells: getGomokuNewCells() }
  return {}
}

// UNO baru dibagikan saat tuan rumah menekan mulai, jadi kursi yang sudah terisi yang ikut bermain.
export const getGameRoomDealtState = (game: string, seats: string[]) => {
  if (game !== 'uno') return null
  if (seats.length < 2) return null
  return getUnoRoomNewState(seats) as unknown as Record<string, unknown>
}

const getCongklakSeatSide = (seat: GameRoomSeat): CongklakSeat => (seat === 'p1' ? 'host' : 'guest')

const getCongklakAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const board = (room.state.board as number[]) ?? []
  const side = getCongklakSeatSide(seat)
  const holeIndex = Number(payload.holeIndex)
  if (!Number.isInteger(holeIndex) || !getCongklakIsMoveAllowed(board, side, holeIndex)) return null

  const resolved = getCongklakResolvedMove(board, side, holeIndex, room.moveTotal)
  return {
    // Lubang asal ikut disimpan supaya lawan bisa menaburkan biji dengan tahapan yang sama.
    state: { board: resolved.board, lastHole: holeIndex, lastSeat: seat },
    turn: resolved.turn === 'host' ? 'p1' : 'p2',
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.isFinished ? (resolved.winner === 'draw' ? 'draw' : resolved.winner === 'host' ? 'p1' : 'p2') : '',
  }
}

const getChessAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const fen = String(room.state.fen ?? '')
  const from = String(payload.from ?? '')
  const to = String(payload.to ?? '')
  if (!fen || !from || !to) return null

  const resolved = getChessRoomAppliedMove(fen, seat, { from, to, promotion: payload.promotion }, room.moveTotal)
  if (!resolved) return null

  return {
    state: { fen: resolved.fen, lastMove: resolved.lastMove },
    turn: resolved.turn,
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.winner,
  }
}

const getDotsAndBoxesAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const lines = (room.state.lines as string[]) ?? []
  const owners = (room.state.owners as string[]) ?? []
  const lineIndex = Number(payload.lineIndex)
  // Hanya dua kursi yang dipakai, jadi kursi ketiga dan keempat tidak perlu ditangani.
  if (seat !== 'p1' && seat !== 'p2') return null
  if (!lines.length || !getDotsAndBoxesIsMoveAllowed(lines, lineIndex)) return null

  const resolved = getDotsAndBoxesResolvedMove(lines, owners, seat, lineIndex, room.moveTotal)
  return {
    // Ruas terakhir ikut disimpan supaya lawan bisa menandai garis yang baru saja ditarik.
    state: { lines: resolved.lines, owners: resolved.owners, lastLine: lineIndex, lastSeat: seat },
    turn: resolved.turn as string,
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.winner,
  }
}

const getOthelloAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const cells = (room.state.cells as string[]) ?? []
  const cellIndex = Number(payload.cellIndex)
  if (seat !== 'p1' && seat !== 'p2') return null
  if (!cells.length || !getOthelloIsMoveAllowed(cells, seat, cellIndex)) return null

  const resolved = getOthelloResolvedMove(cells, seat, cellIndex, room.moveTotal)
  return {
    // Petak terakhir ikut disimpan supaya lawan bisa menandai bidak yang baru saja turun.
    state: { cells: resolved.cells, lastCell: cellIndex, lastSeat: seat },
    turn: resolved.turn as string,
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.winner,
  }
}

const getGomokuAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const cells = (room.state.cells as string[]) ?? []
  const cellIndex = Number(payload.cellIndex)
  if (seat !== 'p1' && seat !== 'p2') return null
  if (!cells.length || !getGomokuIsMoveAllowed(cells, cellIndex)) return null

  const resolved = getGomokuResolvedMove(cells, seat, cellIndex, room.moveTotal)
  return {
    state: { cells: resolved.cells, lastCell: cellIndex, lastSeat: seat, winningLine: resolved.winningLine },
    turn: resolved.turn as string,
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.winner,
  }
}

const getUnoAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  const state = room.state as unknown as UnoRoomState
  if (!state?.players?.length) return null

  const resolved = getUnoRoomAppliedMove(
    state,
    seat,
    { action: String(payload.action ?? ''), cardId: payload.cardId, cardIds: payload.cardIds, color: payload.color },
    room.moveTotal,
  )
  if (!resolved) return null

  return {
    state: resolved.state as unknown as Record<string, unknown>,
    turn: resolved.turn,
    moveTotal: resolved.moveTotal,
    status: resolved.isFinished ? 'finished' : 'playing',
    winner: resolved.winner,
  }
}

// Langkah divalidasi dan dijalankan di server, klien hanya mengirim niat langkahnya.
export const getGameRoomAppliedMove = (room: GameRoomRecord, seat: GameRoomSeat, payload: GameRoomMovePayload) => {
  if (room.status !== 'playing') return null
  // Teriakan UNO boleh di luar giliran, langkah lain wajib menunggu giliran.
  if (room.game === 'uno') return getUnoAppliedMove(room, seat, payload)
  if (room.turn !== seat) return null
  if (room.game === 'congklak') return getCongklakAppliedMove(room, seat, payload)
  if (room.game === 'chess') return getChessAppliedMove(room, seat, payload)
  if (room.game === 'dots-and-boxes') return getDotsAndBoxesAppliedMove(room, seat, payload)
  if (room.game === 'othello') return getOthelloAppliedMove(room, seat, payload)
  if (room.game === 'gomoku') return getGomokuAppliedMove(room, seat, payload)
  return null
}

// Tampilan ruangan dikirim per pemain supaya setiap klien tahu kursi miliknya sendiri.
export const getGameRoomView = (room: GameRoomRecord, seat: GameRoomSeat | null) => {
  const board = (room.state.board as number[]) ?? []
  const uno =
    room.game === 'uno' && (room.state as unknown as UnoRoomState)?.players?.length
      ? getUnoRoomView(room.state as unknown as UnoRoomState, seat)
      : null
  return {
    code: room.code,
    game: room.game,
    status: room.status,
    seat: seat ?? '',
    turn: room.turn,
    seatTotal: room.seatTotal,
    seatOptions: getGameRoomSeatOptions(room.game),
    playerTotal: room.players.length,
    // Kehadiran lawan dipakai untuk membedakan menunggu langkah dan menunggu sambungan.
    rivalOnlineTotal: room.players.filter((player) => player.seat !== seat && getGameRoomIsPresent(player)).length,
    playerNames: room.players.map((player) => player.name),
    board,
    lastHole: typeof room.state.lastHole === 'number' ? room.state.lastHole : -1,
    lastSeat: String(room.state.lastSeat ?? ''),
    fen: String(room.state.fen ?? ''),
    lines: (room.state.lines as string[]) ?? [],
    owners: (room.state.owners as string[]) ?? [],
    lastLine: typeof room.state.lastLine === 'number' ? room.state.lastLine : -1,
    cells: (room.state.cells as string[]) ?? [],
    lastCell: typeof room.state.lastCell === 'number' ? room.state.lastCell : -1,
    winningLine: (room.state.winningLine as number[]) ?? [],
    lastMove: (room.state.lastMove as { from: string; to: string } | null) ?? null,
    hostStore: board[CONGKLAK_HOST_STORE] ?? 0,
    guestStore: board[CONGKLAK_GUEST_STORE] ?? 0,
    moveTotal: room.moveTotal,
    winner: room.winner,
    leftSeat: String(room.state.leftSeat ?? ''),
    uno,
    hostSeat: room.players[0]?.seat ?? 'p1',
    updatedAt: room.updatedAt.toISOString(),
  }
}

export interface PayloadPostGameRooms {
  game: string
  name: string
}

export interface PayloadGetGameRooms {
  code: string
  token: string
}

export interface PayloadPostGameRoomsJoin {
  code: string
  token: string
  name: string
}

export interface PayloadPostGameRoomsStart {
  code: string
  token: string
}

export interface PayloadPostGameRoomsSeats {
  code: string
  token: string
  seatTotal: number
}

export interface PayloadPostGameRoomsLeave {
  code: string
  token: string
}

export interface PayloadPostGameRoomsMove {
  code: string
  token: string
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

export interface DataGameRoomsUno {
  hand: Array<{ id: string; color: string | null; value: string }>
  hasCalledUno: boolean
  opponents: Array<{ seat: string; cardTotal: number; hasCalledUno: boolean }>
  topCard: { id: string; color: string | null; value: string } | null
  activeColor: string
  drawTotal: number
  discardTotal: number
  hasDrawnThisTurn: boolean
  pendingDrawTotal: number
  lastAction: string
}

export interface DataGameRooms {
  code: string
  game: string
  status: string
  seat: string
  turn: string
  seatTotal: number
  seatOptions: number[]
  playerTotal: number
  rivalOnlineTotal: number
  playerNames: string[]
  board: number[]
  lastHole: number
  lastSeat: string
  fen: string
  lines: string[]
  owners: string[]
  lastLine: number
  cells: string[]
  lastCell: number
  winningLine: number[]
  lastMove: { from: string; to: string } | null
  hostStore: number
  guestStore: number
  moveTotal: number
  winner: string
  leftSeat: string
  uno: DataGameRoomsUno | null
  hostSeat: string
  updatedAt: string
  token: string
}

export type DataGameRoomsSeats = DataGameRooms

export type DataGameRoomsLeave = DataGameRooms

export type DataGameRoomsStart = DataGameRooms

export type DataGameRoomsJoin = DataGameRooms

export type DataGameRoomsMove = DataGameRooms

export interface GameRooms {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRooms | null
}

export interface GameRoomsSeats {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRoomsSeats | null
}

export interface GameRoomsLeave {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRoomsLeave | null
}

export interface GameRoomsStart {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRoomsStart | null
}

export interface GameRoomsJoin {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRoomsJoin | null
}

export interface GameRoomsMove {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataGameRoomsMove | null
}

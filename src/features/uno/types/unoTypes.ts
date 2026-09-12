export type UnoColor = 'red' | 'yellow' | 'green' | 'blue'

export type UnoValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4'

export type UnoCard = {
  id: string
  color: UnoColor | null
  value: UnoValue
}

export type UnoPlayer = {
  id: number
  name: string
  isHuman: boolean
  hand: UnoCard[]
  hasCalledUno: boolean
}

export interface DataUnoGame {
  roomCode: string
  players: UnoPlayer[]
  drawPile: UnoCard[]
  discardPile: UnoCard[]
  activeColor: UnoColor
  currentPlayer: number
  direction: number
  pendingWildCardId: string | null
  hasDrawnThisTurn: boolean
  // Total kartu yang wajib ditarik dari tumpukan +2/+4 yang belum ditimpa; 0 berarti tidak ada tumpukan aktif.
  pendingDrawTotal: number
  winnerId: number | null
  lastAction: string
}

export interface UnoGame {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataUnoGame | null
}

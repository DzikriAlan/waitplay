export interface PayloadGetSlitherArena {
  code: string
  playerId: string
  name: string
}

export interface DataSlitherPlayer {
  playerId: string
  name: string
  hue: number
  x: number
  y: number
  angle: number
  score: number
  alive: boolean
  segments: number[][]
  ts: number
}

export interface DataSlitherArena {
  players: DataSlitherPlayer[]
}

export interface SlitherArena {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataSlitherArena | null
}

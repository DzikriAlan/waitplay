export type PianoSong = {
  id: string
  title: string
  artist: string
  bpm: number
  tone: string
  accent: string
  levelLabel: string
  chords: string
  notation: string
}

export type PianoSongCard = {
  id: string
  title: string
  artist: string
  bpm: number
  tone: string
  accent: string
  levelLabel: string
  noteTotal: number
  durationLabel: string
  bestScore: number
}

export type PianoTrackEvent = {
  time: number
  midi: number
  level: number
  kind: string
}

export type PianoLane = {
  index: number
  label: string
  tone: string
}

export type PianoTile = {
  id: number
  lane: number
  offset: number
  length: number
  tone: string
  isMissed: boolean
}

export type PianoJudgement = {
  id: number
  kind: string
  label: string
  lane: number
  frequency: number
}

export interface DataPianoLibrary {
  songs: PianoSongCard[]
}

export interface PianoLibrary {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataPianoLibrary | null
}

export interface DataPianoGame {
  songId: string
  songTitle: string
  songArtist: string
  bpm: number
  tone: string
  accent: string
  lanes: PianoLane[]
  tiles: PianoTile[]
  track: PianoTrackEvent[]
  trackKey: string
  elapsed: number
  score: number
  bestScore: number
  combo: number
  bestCombo: number
  perfectTotal: number
  goodTotal: number
  missTotal: number
  noteTotal: number
  accuracy: number
  progress: number
  countdown: number
  judgement: PianoJudgement | null
  isPaused: boolean
  isOver: boolean
}

export interface PianoGame {
  status: string
  statusTitle: string
  statusSubtitle: string
  data: DataPianoGame | null
}

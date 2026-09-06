import { create } from 'zustand'
import type {
  DataPianoGame,
  DataPianoLibrary,
  PianoGame,
  PianoJudgement,
  PianoLane,
  PianoLibrary,
  PianoSong,
  PianoSongCard,
  PianoTile,
  PianoTrackEvent,
} from '../types/pianoTypes'
import { PIANO_SONGS } from '../static/pianoSongs'

interface PianoStore {
  pianoLibrary: PianoLibrary
  pianoGame: PianoGame
  setPianoInit: () => void
  setPianoSong: (songId: string) => void
  setPianoTick: () => void
  setPianoHit: (lane: number) => void
  setPianoPause: () => void
  setPianoResume: () => void
  setPianoRestart: () => void
  setPianoReset: () => void
}

const LANE_TOTAL = 4
// Nada muncul di puncak papan lalu butuh waktu ini untuk sampai ke garis ketuk.
const TRAVEL_TIME = 2.2
const LEAD_TIME = 3
const PERFECT_WINDOW = 0.11
const GOOD_WINDOW = 0.24
const MISS_LIFE = 0.5
const TAIL_TIME = 1.6
const PERFECT_SCORE = 100
const GOOD_SCORE = 50
const COMBO_LIMIT = 20
const COMBO_SCORE = 5
const BEST_PREFIX = 'waitplay-piano-best-'
const PITCH_STEPS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}
const PITCH_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const CHORD_ROOT_MIDI = 36
const CHORD_PAD_STEP = 24
const MAJOR_STEPS = [0, 4, 7]
const MINOR_STEPS = [0, 3, 7]

type PianoPlayNote = {
  id: number
  midi: number
  lane: number
  time: number
  span: number
  state: string
}

export const usePianoStates = create<PianoStore>((set) => {
  let song: PianoSong | null = null
  let notes: PianoPlayNote[] = []
  let lanes: PianoLane[] = []
  let laneMidi: number[] = []
  let duration = 0
  let track: PianoTrackEvent[] = []
  let trackKey = ''
  let startedAt = 0
  let pausedAt = 0
  let elapsed = -LEAD_TIME
  let score = 0
  let bestScore = 0
  let combo = 0
  let bestCombo = 0
  let perfectTotal = 0
  let goodTotal = 0
  let missTotal = 0
  let cueId = 0
  let judgement: PianoJudgement | null = null
  let isPaused = false
  let isOver = false

  const getFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

  const getStoredBest = (songId: string) => {
    if (typeof window === 'undefined') return 0
    try {
      return Number(window.localStorage.getItem(`${BEST_PREFIX}${songId}`) ?? 0) || 0
    } catch {
      return 0
    }
  }

  const updateStoredBest = (songId: string, value: number) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(`${BEST_PREFIX}${songId}`, String(value))
    } catch {
      return
    }
  }

  // Satu nada ditulis "{nada}{oktaf}:{ketukan}", misalnya "F#4:1", dan "-" berarti jeda.
  const getParsedNotes = (target: PianoSong) => {
    const secondPerBeat = 60 / target.bpm
    const parsed: { midi: number; time: number; span: number }[] = []
    let beat = 0

    target.notation.split(/\s+/).forEach((token) => {
      const matched = token.match(/^([A-G][#b]?|-)(-?\d)?(?::([\d.]+))?$/)
      if (!matched) return
      const length = Number(matched[3] ?? 1)
      if (matched[1] !== '-') {
        const octave = Number(matched[2] ?? 4)
        parsed.push({
          midi: (octave + 1) * 12 + PITCH_STEPS[matched[1]],
          time: beat * secondPerBeat,
          span: length * secondPerBeat,
        })
      }
      beat += length
    })

    return parsed
  }

  // Iringan bas, akor, dan ketukan tipis disusun dari lingkaran akor tiap lagu lalu diulang
  // sampai melodinya habis, supaya lagunya tetap terdengar utuh walau ada nada yang terlewat.
  const getTrack = (target: PianoSong, totalBeat: number) => {
    const secondPerBeat = 60 / target.bpm
    const cycle: { rootStep: number; isMinor: boolean; length: number }[] = []

    target.chords.split(/\s+/).forEach((token) => {
      const matched = token.match(/^([A-G][#b]?)(m)?(?::([\d.]+))?$/)
      if (!matched) return
      cycle.push({ rootStep: PITCH_STEPS[matched[1]], isMinor: !!matched[2], length: Number(matched[3] ?? 4) })
    })
    if (!cycle.length || !totalBeat) return []

    const events: PianoTrackEvent[] = []
    let beat = 0
    let index = 0

    while (beat < totalBeat) {
      const chord = cycle[index % cycle.length]
      const rootMidi = CHORD_ROOT_MIDI + chord.rootStep
      const steps = chord.isMinor ? MINOR_STEPS : MAJOR_STEPS

      // Bas dipetik tiap ketukan, berselang-seling dengan nada satu oktaf di atasnya.
      for (let step = 0; step < chord.length && beat + step < totalBeat; step += 1) {
        events.push({
          time: (beat + step) * secondPerBeat,
          midi: rootMidi + (step % 2 ? 12 : 0),
          level: step % 2 ? 0.07 : 0.11,
          kind: 'bass',
        })
      }
      steps.forEach((step) =>
        events.push({ time: beat * secondPerBeat, midi: rootMidi + CHORD_PAD_STEP + step, level: 0.05, kind: 'chord' }),
      )

      beat += chord.length
      index += 1
    }

    for (let step = 0; step < totalBeat; step += 1) {
      events.push({ time: step * secondPerBeat, midi: 0, level: step % 4 ? 0.02 : 0.035, kind: 'hat' })
    }

    // Ketukan aba-aba selama hitungan mundur supaya pemain sudah dapat temponya sebelum nada pertama.
    const leadTotal = Math.min(4, Math.floor(LEAD_TIME / secondPerBeat))
    for (let step = 1; step <= leadTotal; step += 1) {
      events.push({ time: -step * secondPerBeat, midi: 0, level: 0.035, kind: 'hat' })
    }

    return events.sort((first, second) => first.time - second.time)
  }

  // Empat jalur dibagi dari nada terendah sampai tertinggi supaya melodi naik-turun tetap
  // terbaca sebagai gerakan tangan dari kiri ke kanan. Pembagiannya mengikuti banyaknya
  // pemakaian tiap nada, jadi tidak ada jalur yang nyaris kosong sepanjang lagu.
  const getLaneMap = (pitches: number[]) => {
    const unique = Array.from(new Set(pitches)).sort((first, second) => first - second)
    const counter = new Map<number, number>()
    pitches.forEach((pitch) => counter.set(pitch, (counter.get(pitch) ?? 0) + 1))

    const map = new Map<number, number>()
    const target = pitches.length / LANE_TOTAL
    let lane = 0
    let filled = 0
    let lanePitchTotal = 0

    unique.forEach((pitch, index) => {
      const total = counter.get(pitch) ?? 0
      const restPitch = unique.length - index
      // Jalur ditutup begitu jatahnya terlampaui, atau begitu sisa nada tinggal pas untuk jalur berikutnya.
      const isFull = !!lanePitchTotal && filled + total / 2 > target * (lane + 1)
      const isTight = !!lanePitchTotal && restPitch <= LANE_TOTAL - lane - 1
      if (lane < LANE_TOTAL - 1 && (isFull || isTight)) {
        lane += 1
        lanePitchTotal = 0
      }
      map.set(pitch, lane)
      lanePitchTotal += 1
      filled += total
    })

    return map
  }

  const getPitchLabel = (midi: number) => `${PITCH_LABELS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`

  const getLanes = (target: PianoSong) =>
    Array.from({ length: LANE_TOTAL }, (_, index) => ({
      index,
      label: getPitchLabel(laneMidi[index]),
      tone: index % 2 === 0 ? target.tone : target.accent,
    }))

  const getEmptyData = (): DataPianoGame => ({
    songId: '',
    songTitle: '',
    songArtist: '',
    bpm: 0,
    tone: '#f0b429',
    accent: '#2ec4b6',
    lanes: [],
    tiles: [],
    track: [],
    trackKey: '',
    elapsed: 0,
    score: 0,
    bestScore: 0,
    combo: 0,
    bestCombo: 0,
    perfectTotal: 0,
    goodTotal: 0,
    missTotal: 0,
    noteTotal: 0,
    accuracy: 0,
    progress: 0,
    countdown: 0,
    judgement: null,
    isPaused: false,
    isOver: false,
  })

  const getData = (): DataPianoGame => {
    const active = song
    if (!active) return getEmptyData()

    const getTile = (note: PianoPlayNote): PianoTile => ({
      id: note.id,
      lane: note.lane,
      offset: (elapsed - (note.time - TRAVEL_TIME)) / TRAVEL_TIME,
      length: Math.max(0.05, Math.min(0.3, note.span / TRAVEL_TIME)),
      tone: lanes[note.lane]?.tone ?? active.tone,
      isMissed: note.state === 'miss',
    })

    // Nada yang terlewat masih terlihat sesaat supaya pemain tahu ketukannya kelewatan.
    const visible = notes.filter(
      (note) => note.state !== 'hit' && elapsed >= note.time - TRAVEL_TIME && elapsed <= note.time + MISS_LIFE,
    )
    const judgedTotal = perfectTotal + goodTotal + missTotal

    return {
      songId: active.id,
      songTitle: active.title,
      songArtist: active.artist,
      bpm: active.bpm,
      tone: active.tone,
      accent: active.accent,
      lanes,
      tiles: visible.map((note) => getTile(note)),
      track,
      trackKey,
      elapsed,
      score,
      bestScore,
      combo,
      bestCombo,
      perfectTotal,
      goodTotal,
      missTotal,
      noteTotal: notes.length,
      accuracy: judgedTotal ? (perfectTotal + goodTotal * 0.5) / judgedTotal : 0,
      progress: Math.max(0, Math.min(1, elapsed / (duration || 1))),
      countdown: elapsed < 0 ? Math.max(1, Math.ceil(-elapsed)) : 0,
      judgement,
      isPaused,
      isOver,
    }
  }

  const getSongCards = (): PianoSongCard[] =>
    PIANO_SONGS.map((target) => {
      const parsed = getParsedNotes(target)
      const last = parsed[parsed.length - 1]
      const totalSecond = Math.round((last ? last.time + last.span : 0) + TAIL_TIME)
      return {
        id: target.id,
        title: target.title,
        artist: target.artist,
        bpm: target.bpm,
        tone: target.tone,
        accent: target.accent,
        levelLabel: target.levelLabel,
        noteTotal: parsed.length,
        durationLabel: `${Math.floor(totalSecond / 60)}:${String(totalSecond % 60).padStart(2, '0')}`,
        bestScore: getStoredBest(target.id),
      }
    })

  const getLibraryData = (): DataPianoLibrary => ({ songs: getSongCards() })

  const updateGame = () =>
    set({ pianoGame: { status: 'success', statusTitle: '', statusSubtitle: '', data: getData() } })

  const updateLibrary = () =>
    set({ pianoLibrary: { status: 'success', statusTitle: '', statusSubtitle: '', data: getLibraryData() } })

  const updateFinishedSong = () => {
    isOver = true
    if (!song) return
    bestScore = Math.max(bestScore, score)
    updateStoredBest(song.id, bestScore)
    updateLibrary()
  }

  const updateStartedSong = (target: PianoSong) => {
    const parsed = getParsedNotes(target)
    const pitches = parsed.map((note) => note.midi)
    const laneMap = getLaneMap(pitches)
    const lowest = Math.min(...pitches)
    const highest = Math.max(...pitches)

    // Tuts di bawah jalur memakai nada tengah jalur itu supaya ketukan bebas tetap selaras.
    const getLaneMidi = (index: number) => {
      const owned = pitches.filter((pitch) => laneMap.get(pitch) === index)
      if (!owned.length) return Math.round(lowest + ((highest - lowest) * (index + 0.5)) / LANE_TOTAL)
      return owned.sort((first, second) => first - second)[Math.floor(owned.length / 2)]
    }

    song = target
    laneMidi = Array.from({ length: LANE_TOTAL }, (_, index) => getLaneMidi(index))
    lanes = getLanes(target)
    notes = parsed.map((note, index) => ({
      id: index + 1,
      midi: note.midi,
      lane: laneMap.get(note.midi) ?? 0,
      time: note.time,
      span: note.span,
      state: 'idle',
    }))
    const last = parsed[parsed.length - 1]
    const totalBeat = last ? Math.round(((last.time + last.span) * target.bpm) / 60) : 0
    duration = (last ? last.time + last.span : 0) + TAIL_TIME
    track = getTrack(target, totalBeat)
    startedAt = typeof performance === 'undefined' ? Date.now() : performance.now()
    trackKey = `${target.id}-${startedAt}`
    pausedAt = 0
    elapsed = -LEAD_TIME
    score = 0
    combo = 0
    bestCombo = 0
    perfectTotal = 0
    goodTotal = 0
    missTotal = 0
    judgement = null
    isPaused = false
    isOver = false
    bestScore = getStoredBest(target.id)
    updateGame()
  }

  const getNow = () => (typeof performance === 'undefined' ? Date.now() : performance.now())

  return {
    pianoLibrary: {
      status: 'loading',
      statusTitle: 'Menyiapkan daftar lagu',
      statusSubtitle: 'Mohon tunggu sebentar.',
      data: null,
    },

    pianoGame: {
      status: 'empty',
      statusTitle: 'Belum ada lagu dipilih',
      statusSubtitle: 'Pilih satu lagu untuk mulai bermain.',
      data: null,
    },

    setPianoInit: () => updateLibrary(),

    setPianoSong: (songId) => {
      const target = PIANO_SONGS.find((item) => item.id === songId)
      if (!target) return
      updateStartedSong(target)
    },

    setPianoTick: () => {
      if (!song || isOver || isPaused) return
      elapsed = (getNow() - startedAt) / 1000 - LEAD_TIME

      // Nada yang sudah melewati batas ketuk dihitung meleset dan memutus rentetan.
      notes.forEach((note) => {
        if (note.state !== 'idle' || elapsed <= note.time + GOOD_WINDOW) return
        note.state = 'miss'
        missTotal += 1
        combo = 0
        cueId += 1
        judgement = { id: cueId, kind: 'miss', label: 'Meleset', lane: note.lane, frequency: getFrequency(note.midi) }
      })

      if (elapsed >= duration) updateFinishedSong()
      updateGame()
    },

    setPianoHit: (lane) => {
      if (!song || isOver || isPaused) return

      const getNearestNote = () =>
        notes
          .filter(
            (note) =>
              note.lane === lane && note.state === 'idle' && Math.abs(elapsed - note.time) <= GOOD_WINDOW,
          )
          .sort((first, second) => Math.abs(elapsed - first.time) - Math.abs(elapsed - second.time))[0]

      const target = getNearestNote()
      cueId += 1

      // Ketukan di jalur kosong tetap berbunyi supaya papan terasa seperti piano sungguhan.
      if (!target) {
        judgement = { id: cueId, kind: 'free', label: '', lane, frequency: getFrequency(laneMidi[lane]) }
        updateGame()
        return
      }

      const isPerfect = Math.abs(elapsed - target.time) <= PERFECT_WINDOW
      target.state = 'hit'
      combo += 1
      bestCombo = Math.max(bestCombo, combo)
      score += (isPerfect ? PERFECT_SCORE : GOOD_SCORE) + Math.min(combo, COMBO_LIMIT) * COMBO_SCORE
      if (isPerfect) perfectTotal += 1
      else goodTotal += 1
      judgement = {
        id: cueId,
        kind: isPerfect ? 'perfect' : 'good',
        label: isPerfect ? 'Tepat' : 'Bagus',
        lane,
        frequency: getFrequency(target.midi),
      }
      updateGame()
    },

    setPianoPause: () => {
      if (!song || isOver || isPaused) return
      isPaused = true
      pausedAt = getNow()
      updateGame()
    },

    setPianoResume: () => {
      if (!song || isOver || !isPaused) return
      // Jeda tidak boleh memajukan lagu, jadi titik mulai digeser sepanjang waktu berhenti.
      startedAt += getNow() - pausedAt
      isPaused = false
      updateGame()
    },

    setPianoRestart: () => {
      if (!song) return
      updateStartedSong(song)
    },

    setPianoReset: () => {
      song = null
      notes = []
      lanes = []
      track = []
      trackKey = ''
      isOver = false
      isPaused = false
      judgement = null
      updateLibrary()
      set({
        pianoGame: {
          status: 'empty',
          statusTitle: 'Belum ada lagu dipilih',
          statusSubtitle: 'Pilih satu lagu untuk mulai bermain.',
          data: null,
        },
      })
    },
  }
})

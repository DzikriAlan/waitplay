'use client'

import { useEffect, useRef, useState } from 'react'
import type { PianoTrackEvent } from '../types/pianoTypes'

export type PianoAudioCue = {
  id: number
  kind: string
  frequency: number
}

interface Props {
  isActive: boolean
  isSoundOn: boolean
  isPlaying: boolean
  isPaused: boolean
  elapsed: number
  track: PianoTrackEvent[]
  trackKey: string
  cue: PianoAudioCue | null
}

const SCHEDULE_STEP = 60
const SCHEDULE_AHEAD = 0.4
const DRIFT_LIMIT = 0.12

export default function PianoAudio({ isActive, isSoundOn, isPlaying, isPaused, elapsed, track, trackKey, cue }: Props) {
  const audioRef = useRef<AudioContext | null>(null)
  const voiceRef = useRef<{
    postNote: (frequency: number, time: number, level: number, life: number, isMusic: boolean) => void
    postBass: (frequency: number, time: number, level: number) => void
    postHat: (time: number, level: number) => void
    postThud: (time: number) => void
  } | null>(null)
  const stateRef = useRef({
    isSoundOn: true,
    isPlaying: false,
    isPaused: false,
    elapsed: 0,
    track: [] as PianoTrackEvent[],
    trackKey: '',
  })
  const trackRef = useRef({ key: '', index: 0, offset: 0, isSynced: false })
  const playedRef = useRef(0)
  const [isAudioReady, setIsAudioReady] = useState(false)

  useEffect(() => {
    stateRef.current = { isSoundOn, isPlaying, isPaused, elapsed, track, trackKey }
  })

  useEffect(() => {
    let schedulerId = 0

    const getAudioSetup = () => {
      if (audioRef.current) return audioRef.current
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return null

      const context = new AudioContextClass()
      const soundGain = context.createGain()
      soundGain.gain.value = 0.9
      soundGain.connect(context.destination)
      const musicGain = context.createGain()
      musicGain.gain.value = 0.8
      musicGain.connect(context.destination)

      const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let index = 0; index < noiseData.length; index += 1) {
        noiseData[index] = Math.random() * 2 - 1
      }

      // Bunyi piano disusun dari nada dasar dan dua nada kelipatannya supaya terdengar
      // berdawai, lalu diredam pelan-pelan seperti senar yang berhenti bergetar.
      const postNote = (frequency: number, time: number, level: number, life: number, isMusic: boolean) => {
        const partials = [
          { ratio: 1, gain: 1, type: 'sine' as OscillatorType },
          { ratio: 2, gain: 0.34, type: 'sine' as OscillatorType },
          { ratio: 3.01, gain: 0.14, type: 'triangle' as OscillatorType },
        ]
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(Math.min(9000, frequency * 8), time)
        filter.frequency.exponentialRampToValueAtTime(Math.max(600, frequency * 2), time + life)
        filter.connect(isMusic ? musicGain : soundGain)

        partials.forEach((partial) => {
          const tone = context.createOscillator()
          const toneGain = context.createGain()
          tone.type = partial.type
          tone.frequency.setValueAtTime(frequency * partial.ratio, time)
          toneGain.gain.setValueAtTime(0.0001, time)
          toneGain.gain.exponentialRampToValueAtTime(level * partial.gain, time + 0.008)
          toneGain.gain.exponentialRampToValueAtTime(0.0001, time + life)
          tone.connect(toneGain)
          toneGain.connect(filter)
          tone.start(time)
          tone.stop(time + life + 0.05)
        })
      }

      const postBass = (frequency: number, time: number, level: number) => {
        const tone = context.createOscillator()
        const toneGain = context.createGain()
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 900
        tone.type = 'triangle'
        tone.frequency.setValueAtTime(frequency, time)
        toneGain.gain.setValueAtTime(0.0001, time)
        toneGain.gain.exponentialRampToValueAtTime(level, time + 0.02)
        toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42)
        tone.connect(filter)
        filter.connect(toneGain)
        toneGain.connect(musicGain)
        tone.start(time)
        tone.stop(time + 0.46)
      }

      const postHat = (time: number, level: number) => {
        const source = context.createBufferSource()
        const filter = context.createBiquadFilter()
        const gain = context.createGain()
        source.buffer = noiseBuffer
        filter.type = 'highpass'
        filter.frequency.value = 7000
        gain.gain.setValueAtTime(level, time)
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(musicGain)
        source.start(time)
        source.stop(time + 0.05)
      }

      const postThud = (time: number) => {
        const tone = context.createOscillator()
        const toneGain = context.createGain()
        tone.type = 'sawtooth'
        tone.frequency.setValueAtTime(120, time)
        tone.frequency.exponentialRampToValueAtTime(70, time + 0.14)
        toneGain.gain.setValueAtTime(0.0001, time)
        toneGain.gain.exponentialRampToValueAtTime(0.12, time + 0.01)
        toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
        tone.connect(toneGain)
        toneGain.connect(soundGain)
        tone.start(time)
        tone.stop(time + 0.18)
      }

      voiceRef.current = { postNote, postBass, postHat, postThud }
      audioRef.current = context
      return context
    }

    // Iringan dijadwalkan sedikit lebih awal daripada jam permainan supaya bunyinya rata,
    // lalu ditarik ulang bila jam papan dan jam suara mulai berjauhan.
    const postScheduler = () => {
      const context = audioRef.current
      const voice = voiceRef.current
      const state = stateRef.current
      const holder = trackRef.current
      if (!context || !voice) return

      if (holder.key !== state.trackKey) {
        holder.key = state.trackKey
        holder.index = 0
        holder.isSynced = false
      }
      if (!state.isPlaying || state.isPaused || !state.isSoundOn || !state.track.length) return

      const drift = context.currentTime - holder.offset - state.elapsed
      if (!holder.isSynced || Math.abs(drift) > DRIFT_LIMIT) {
        holder.offset = context.currentTime - state.elapsed
        holder.isSynced = true
      }

      while (holder.index < state.track.length && state.track[holder.index].time <= state.elapsed + SCHEDULE_AHEAD) {
        const event = state.track[holder.index]
        const time = Math.max(context.currentTime, holder.offset + event.time)
        const frequency = 440 * Math.pow(2, (event.midi - 69) / 12)
        if (event.kind === 'hat') voice.postHat(time, event.level)
        if (event.kind === 'bass') voice.postBass(frequency, time, event.level)
        if (event.kind === 'chord') voice.postNote(frequency, time, event.level, 1.8, true)
        holder.index += 1
      }
    }

    const postUnlockAudio = () => {
      const context = getAudioSetup()
      if (!context) return
      if (context.state === 'suspended') context.resume()
      setIsAudioReady(true)
      window.removeEventListener('pointerdown', postUnlockAudio)
      window.removeEventListener('keydown', postUnlockAudio)
    }

    window.addEventListener('pointerdown', postUnlockAudio)
    window.addEventListener('keydown', postUnlockAudio)
    schedulerId = window.setInterval(postScheduler, SCHEDULE_STEP)

    return () => {
      window.removeEventListener('pointerdown', postUnlockAudio)
      window.removeEventListener('keydown', postUnlockAudio)
      window.clearInterval(schedulerId)
      const context = audioRef.current
      if (!context) return
      context.close()
      audioRef.current = null
      voiceRef.current = null
    }
  }, [])

  useEffect(() => {
    const voice = voiceRef.current
    const context = audioRef.current
    if (!context || !voice || !cue || cue.id === playedRef.current) return
    playedRef.current = cue.id
    if (!isSoundOn || !isActive) return

    const now = context.currentTime
    // Nada yang terlewat tetap terdengar lirih bersama iringan supaya melodi lagunya tidak putus.
    if (cue.kind === 'miss') {
      voice.postThud(now)
      if (cue.frequency) voice.postNote(cue.frequency, now, 0.09, 1, true)
      return
    }
    if (cue.kind === 'win') {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
        voice.postNote(frequency, now + index * 0.12, 0.22, 1.2, false),
      )
      return
    }
    if (cue.kind === 'free') {
      voice.postNote(cue.frequency, now, 0.12, 0.9, false)
      return
    }
    voice.postNote(cue.frequency, now, cue.kind === 'perfect' ? 0.28 : 0.22, 1.4, false)
  }, [cue, isSoundOn, isActive, isAudioReady])

  useEffect(() => {
    const context = audioRef.current
    if (!context) return
    if (!isActive) {
      if (context.state === 'running') context.suspend()
      return
    }
    if (context.state === 'suspended') context.resume()
  }, [isActive, isAudioReady])

  return null
}

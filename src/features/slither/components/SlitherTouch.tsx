'use client'

import { useRef, useState } from 'react'
import type { MutableRefObject } from 'react'

export interface SlitherControl {
  angle: number | null
  boost: boolean
}

interface Props {
  controlRef: MutableRefObject<SlitherControl>
}

const STICK_RADIUS = 52

export default function SlitherTouch({ controlRef }: Props) {
  const originRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0, isHeld: false })
  const [isSprinting, setIsSprinting] = useState(false)

  // Arah stik ditulis langsung ke ref bersama, bukan ke state React, supaya menggerakkan jempol
  // tidak memicu render ulang tiap frame.
  const editSlitherStick = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current
    if (!origin || origin.id !== event.pointerId) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    const distance = Math.hypot(dx, dy)
    if (distance < 6) return
    // Layar: kanan = +X dunia, bawah = +Z dunia, jadi sudutnya bisa dipakai apa adanya.
    controlRef.current.angle = Math.atan2(dy, dx)
    const clamped = Math.min(1, distance / STICK_RADIUS)
    setKnob({ x: (dx / distance) * clamped * STICK_RADIUS, y: (dy / distance) * clamped * STICK_RADIUS, isHeld: true })
  }
  const loadSlitherStick = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    originRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    setKnob({ x: 0, y: 0, isHeld: true })
  }
  const clearSlitherStick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (originRef.current?.id !== event.pointerId) return
    originRef.current = null
    controlRef.current.angle = null
    setKnob({ x: 0, y: 0, isHeld: false })
  }
  const loadSlitherSprint = () => {
    controlRef.current.boost = true
    setIsSprinting(true)
  }
  const clearSlitherSprint = () => {
    controlRef.current.boost = false
    setIsSprinting(false)
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      <div
        onPointerDown={loadSlitherStick}
        onPointerMove={editSlitherStick}
        onPointerUp={clearSlitherStick}
        onPointerCancel={clearSlitherStick}
        className="pointer-events-auto absolute bottom-6 left-6 flex h-[132px] w-[132px] touch-none items-center justify-center rounded-full border border-[#3a3a42]/70 bg-[#121214]/50 backdrop-blur-sm"
      >
        <div
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          className={`h-14 w-14 rounded-full border-2 transition-colors ${
            knob.isHeld ? 'border-[#f2ede1] bg-[#f2ede1]/80' : 'border-[#3a3a42] bg-[#f2ede1]/25'
          }`}
        />
      </div>

      <button
        type="button"
        onPointerDown={loadSlitherSprint}
        onPointerUp={clearSlitherSprint}
        onPointerLeave={clearSlitherSprint}
        onPointerCancel={clearSlitherSprint}
        className={`pointer-events-auto absolute bottom-8 right-8 h-[104px] w-[104px] touch-none rounded-full border-2 text-[12px] font-black uppercase tracking-[0.14em] transition-colors ${
          isSprinting
            ? 'border-[#f2ede1] bg-[#f2ede1] text-[#0a0a0b]'
            : 'border-[#3a3a42] bg-[#121214]/60 text-[#f2ede1] backdrop-blur-sm'
        }`}
      >
        Sprint
      </button>
    </div>
  )
}

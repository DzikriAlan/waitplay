'use client'

import { useMemo } from 'react'
import { getSlitherSkin } from '@/shared/lib/slitherEngine'

interface Props {
  skinIndex: number
}

const SEGMENT_TOTAL = 15
const VIEW_WIDTH = 260
const VIEW_HEIGHT = 78

export default function SlitherPreview({ skinIndex }: Props) {
  const data = useMemo(() => {
    const skin = getSlitherSkin(skinIndex)
    // Badan digambar sebagai deretan bulatan bertumpuk dari ekor ke kepala, warnanya bergantian
    // mengikuti gelang corak — sama seperti yang dipakai di arena.
    const getSegment = (index: number) => {
      const ratio = index / (SEGMENT_TOTAL - 1)
      const taper = ratio < 0.18 ? 0.4 + (ratio / 0.18) * 0.6 : 1
      return {
        key: index,
        x: 30 + ratio * 196,
        y: VIEW_HEIGHT / 2 + Math.sin(ratio * Math.PI * 1.6) * 9,
        radius: 15 * taper,
        color: skin.bands[index % skin.bands.length],
      }
    }

    const segments = Array.from({ length: SEGMENT_TOTAL }, (unused, index) => getSegment(index))

    return {
      skin,
      segments,
      head: segments[segments.length - 1],
      seam: skin.band,
    }
  }, [skinIndex])

  return (
    <div className="mt-2 shrink-0 flex items-center justify-center rounded-2xl border border-[#26262b] bg-[#0a0a0b] py-1.5">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-[78px] w-full"
        role="img"
        aria-label={`Pratinjau ular warna ${data.skin.label}`}
      >
        {data.segments.map((segment) => (
          <circle
            key={segment.key}
            cx={segment.x}
            cy={segment.y}
            r={segment.radius}
            fill={segment.color}
            stroke={data.seam}
            strokeWidth={1.4}
          />
        ))}

        {/* Kepala sama tebal dengan badan, hanya ditandai matanya. */}
        <circle cx={data.head.x} cy={data.head.y} r={15} fill={data.head.color} />
        {[-1, 1].map((side) => (
          <g key={side}>
            <circle cx={data.head.x + 3} cy={data.head.y + side * 5} r={4.6} fill="#15151b" />
            <circle cx={data.head.x + 3} cy={data.head.y + side * 5} r={3.6} fill="#ffffff" />
            <circle cx={data.head.x + 4.2} cy={data.head.y + side * 5} r={1.9} fill="#15151b" />
            <circle cx={data.head.x + 3.4} cy={data.head.y + side * 5 - 1.2} r={0.8} fill="#ffffff" />
          </g>
        ))}
        <path
          d={`M ${data.head.x + 11} ${data.head.y} q -5 0 -7.5 0`}
          stroke="#15151b"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

'use client'

import AnimalMatchingIcon from '@/features/animal-matching/components/AnimalMatchingIcon'

interface Props {
  gameId: string
  tone: string
  accent: string
}

const PAPER = '#e8e2d4'
const INK = '#141416'

export default function StoreCover({ gameId, tone, accent }: Props) {
  const frame = 'h-full w-full'
  const grain = (
    <>
      <filter id={`grain-${gameId}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="320" height="200" filter={`url(#grain-${gameId})`} opacity="0.09" />
    </>
  )

  if (gameId === 'color-sort') {
    const bottles = [
      { x: 74, bands: ['#e0452a', '#f0b429', '#e0452a', '#3b6fd4'] },
      { x: 140, bands: ['#3b6fd4', '#e0452a', '#f0b429', '#2ec4b6'] },
      { x: 206, bands: ['#f0b429', '#2ec4b6', '#3b6fd4', '#e0452a'] },
    ]
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <path d="M0 200V118a82 82 0 0 0 82 82Z" fill="#e0452a" />
        <rect x="284" width="36" height="200" fill="#2b2b2d" />
        {bottles.map((bottle) => (
          <g key={bottle.x}>
            <rect x={bottle.x + 14} y="38" width="12" height="10" fill="#e0452a" stroke={INK} strokeWidth="3" />
            <rect x={bottle.x} y="48" width="40" height="104" fill="#f7f4ec" stroke={INK} strokeWidth="3" />
            {bottle.bands.map((band, index) => (
              <rect
                key={index}
                x={bottle.x + 1.5}
                y={49.5 + index * 25.25}
                width="37"
                height="25.25"
                fill={band}
                stroke={INK}
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}
        <rect x="60" y="152" width="200" height="7" fill={INK} />
        {grain}
      </svg>
    )
  }

  if (gameId === 'uno') {
    const cards = [
      { label: '1', fill: '#e0452a', x: 96, y: 66, rotate: -16 },
      { label: '2', fill: '#3d9e63', x: 176, y: 66, rotate: 16 },
      { label: '4', fill: INK, x: 136, y: 58, rotate: 0 },
    ]
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={tone} />
        {cards.map((card) => (
          <g key={card.label} transform={`rotate(${card.rotate} ${card.x} ${card.y + 45})`}>
            <rect
              x={card.x - 27}
              y={card.y - 6}
              width="54"
              height="92"
              rx="7"
              fill={card.fill}
              stroke={PAPER}
              strokeWidth="4"
            />
            <text
              x={card.x}
              y={card.y + 52}
              textAnchor="middle"
              fill={PAPER}
              fontSize="42"
              fontWeight="900"
              fontFamily="'Arial Black', system-ui, sans-serif"
            >
              {card.label}
            </text>
          </g>
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'animal-matching') {
    const animals = ['sapi', 'harimau', 'katak', 'monyet', 'kelinci', 'rubah']
    return (
      <div className="relative h-full w-full" style={{ backgroundColor: tone }}>
        <span
          className="absolute -right-6 -top-6 block h-24 w-24 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="relative grid h-full w-full grid-cols-3 grid-rows-2 gap-2 p-4 sm:gap-3 sm:p-5">
          {animals.map((animal) => (
            <span
              key={animal}
              className="flex items-center justify-center rounded-[5px] border-2 border-[#141416] bg-[#f6efdd] p-[6%] shadow-[2px_2px_0_#141416]"
            >
              <AnimalMatchingIcon name={animal} />
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'chess') {
    const squares = [0, 1, 2, 3, 4, 5].flatMap((column) =>
      [0, 1, 2].map((row) => ({ column, row, isDark: (column + row) % 2 === 1 })),
    )
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={tone} />
        <circle cx="272" cy="34" r="42" fill={accent} />
        <g transform="translate(40 116) skewY(-6)">
          {squares.map((square) => (
            <rect
              key={`${square.column}-${square.row}`}
              x={square.column * 40}
              y={square.row * 24}
              width="40"
              height="24"
              fill={square.isDark ? INK : PAPER}
            />
          ))}
        </g>
        <g transform="translate(158 170) scale(0.86)" fill={PAPER} stroke={INK} strokeWidth="5" strokeLinejoin="round">
          <path d="M-30-12h60v14h-60z" />
          <path d="M-23-12c0-16 9-24 9-34h28c0 10 9 18 9 34z" />
          <path d="M-17-52h34v-10h-34z" />
          <circle cx="0" cy="-76" r="14" />
          <path d="M-4-116h8v26h-8z" />
          <path d="M-14-106h28v8h-28z" />
        </g>
        {grain}
      </svg>
    )
  }

  if (gameId === 'maze-runner') {
    const walls = [
      'M40 40h96v28h-56v34h84',
      'M40 96h44v40H40',
      'M164 40v40h64V56h56',
      'M108 130h68v30h-96',
      'M204 96h76v34h-40v30',
      'M116 160v-30',
    ]
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill="#f7f0dd" />
        <rect x="0" y="0" width="72" height="200" fill={tone} />
        <g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none">
          {walls.map((wall) => (
            <path key={wall} d={wall} />
          ))}
        </g>
        <g transform="translate(28 80)">
          <ellipse cx="0" cy="6" rx="18" ry="19" fill="#e0452a" />
          <circle cx="0" cy="-16" r="9" fill="#1b1b1f" />
          <path d="M0-10v32" stroke="#1b1b1f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="-8" cy="0" r="4" fill="#a82f1c" />
          <circle cx="8" cy="0" r="4" fill="#a82f1c" />
          <circle cx="-7" cy="14" r="3.4" fill="#a82f1c" />
          <circle cx="7" cy="14" r="3.4" fill="#a82f1c" />
        </g>
        <g transform="translate(252 128)">
          <path d="M-34 44C-34 12-19-2 0-2s34 14 34 46Z" fill="#4a4a55" />
          <path d="M-16 44c0-16 7-26 16-26s16 10 16 26Z" fill="#08080a" />
        </g>
        {grain}
      </svg>
    )
  }

  if (gameId === 'congklak') {
    const holes = [0, 1, 2, 3, 4, 5].flatMap((column) =>
      [0, 1].map((row) => ({ column, row, seeds: (column + row) % 3 + 2 })),
    )
    const seedTones = ['#e0452a', '#3b6fd4', '#f0b429', '#2ec4b6']
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <circle cx="286" cy="26" r="40" fill={accent} />
        <rect x="18" y="52" width="284" height="96" rx="46" fill={tone} stroke={INK} strokeWidth="5" />
        <ellipse cx="52" cy="100" rx="20" ry="30" fill={PAPER} stroke={INK} strokeWidth="4" />
        <ellipse cx="268" cy="100" rx="20" ry="30" fill={PAPER} stroke={INK} strokeWidth="4" />
        {holes.map((hole) => (
          <g key={`${hole.column}-${hole.row}`}>
            <circle
              cx={92 + hole.column * 27}
              cy={82 + hole.row * 36}
              r="12"
              fill={PAPER}
              stroke={INK}
              strokeWidth="3.5"
            />
            {Array.from({ length: hole.seeds }, (_, index) => index).map((index) => (
              <circle
                key={index}
                cx={87 + hole.column * 27 + (index % 2) * 10}
                cy={78 + hole.row * 36 + Math.floor(index / 2) * 9}
                r="3.2"
                fill={seedTones[(hole.column + index) % seedTones.length]}
              />
            ))}
          </g>
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'dots-and-boxes') {
    const dots = [0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2, 3, 4].map((column) => ({ row, column })))
    const rowLines = [
      { row: 0, column: 0, tone: '#e0452a' },
      { row: 0, column: 2, tone: tone },
      { row: 1, column: 1, tone: tone },
      { row: 2, column: 3, tone: '#e0452a' },
      { row: 3, column: 0, tone: tone },
      { row: 4, column: 2, tone: '#e0452a' },
    ]
    const columnLines = [
      { row: 0, column: 1, tone: tone },
      { row: 1, column: 3, tone: '#e0452a' },
      { row: 2, column: 0, tone: '#e0452a' },
      { row: 3, column: 4, tone: tone },
    ]
    const boxes = [
      { row: 1, column: 1, tone: tone, label: 'A' },
      { row: 2, column: 3, tone: '#e0452a', label: 'B' },
    ]
    const getX = (column: number) => 96 + column * 32
    const getY = (row: number) => 36 + row * 32
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <rect x="0" y="0" width="64" height="200" fill={tone} />
        <circle cx="292" cy="30" r="34" fill={accent} />
        {boxes.map((box) => (
          <g key={`${box.row}-${box.column}`}>
            <rect
              x={getX(box.column) + 4}
              y={getY(box.row) + 4}
              width="24"
              height="24"
              rx="4"
              fill={box.tone}
              opacity="0.25"
            />
            <text
              x={getX(box.column) + 16}
              y={getY(box.row) + 22}
              textAnchor="middle"
              fontSize="14"
              fontWeight="800"
              fill={box.tone}
            >
              {box.label}
            </text>
          </g>
        ))}
        <g strokeWidth="6" strokeLinecap="round">
          {rowLines.map((line) => (
            <line
              key={`row-${line.row}-${line.column}`}
              x1={getX(line.column)}
              y1={getY(line.row)}
              x2={getX(line.column + 1)}
              y2={getY(line.row)}
              stroke={line.tone}
            />
          ))}
          {columnLines.map((line) => (
            <line
              key={`column-${line.row}-${line.column}`}
              x1={getX(line.column)}
              y1={getY(line.row)}
              x2={getX(line.column)}
              y2={getY(line.row + 1)}
              stroke={line.tone}
            />
          ))}
        </g>
        {dots.map((dot) => (
          <circle key={`${dot.row}-${dot.column}`} cx={getX(dot.column)} cy={getY(dot.row)} r="6" fill={INK} />
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'othello') {
    const discs = [
      { row: 1, column: 1, isDark: true },
      { row: 1, column: 2, isDark: false },
      { row: 2, column: 1, isDark: false },
      { row: 2, column: 2, isDark: true },
      { row: 0, column: 3, isDark: true },
      { row: 3, column: 0, isDark: false },
      { row: 3, column: 3, isDark: true },
      { row: 0, column: 0, isDark: false },
    ]
    const getX = (column: number) => 116 + column * 44
    const getY = (row: number) => 26 + row * 44
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <rect x="0" y="0" width="72" height="200" fill={tone} />
        <rect x="96" y="6" width="180" height="180" rx="10" fill={tone} stroke={INK} strokeWidth="5" />
        <g stroke={INK} strokeWidth="2.5" opacity="0.55">
          {[1, 2, 3].map((step) => (
            <line key={`row-${step}`} x1="96" y1={6 + step * 45} x2="276" y2={6 + step * 45} />
          ))}
          {[1, 2, 3].map((step) => (
            <line key={`column-${step}`} x1={96 + step * 45} y1="6" x2={96 + step * 45} y2="186" />
          ))}
        </g>
        {discs.map((disc) => (
          <circle
            key={`${disc.row}-${disc.column}`}
            cx={getX(disc.column)}
            cy={getY(disc.row)}
            r="15"
            fill={disc.isDark ? INK : accent}
            stroke={INK}
            strokeWidth="3"
          />
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'gomoku') {
    const stones = [
      { row: 1, column: 1, isDark: true },
      { row: 2, column: 2, isDark: true },
      { row: 3, column: 3, isDark: true },
      { row: 1, column: 3, isDark: false },
      { row: 2, column: 1, isDark: false },
      { row: 3, column: 1, isDark: false },
      { row: 0, column: 2, isDark: false },
    ]
    const getX = (column: number) => 112 + column * 42
    const getY = (row: number) => 30 + row * 42
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={tone} />
        <rect x="0" y="0" width="64" height="200" fill={accent} />
        <g stroke={INK} strokeWidth="2.5" opacity="0.6">
          {[0, 1, 2, 3, 4].map((step) => (
            <line key={`row-${step}`} x1="90" y1={30 + step * 42} x2="300" y2={30 + step * 42} />
          ))}
          {[0, 1, 2, 3, 4].map((step) => (
            <line key={`column-${step}`} x1={112 + step * 42} y1="8" x2={112 + step * 42} y2="192" />
          ))}
        </g>
        {stones.map((stone) => (
          <circle
            key={`${stone.row}-${stone.column}`}
            cx={getX(stone.column)}
            cy={getY(stone.row)}
            r="14"
            fill={stone.isDark ? INK : PAPER}
            stroke={INK}
            strokeWidth="3"
          />
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'rubik') {
    const STEP_ACROSS = 26
    const STEP_DEPTH = 14
    const STEP_DOWN = 28
    const APEX = { x: 160, y: 18 }
    // Titik kubus dihitung dari tiga sumbu isometrik supaya semua ubin bertemu rapi di tiap rusuk.
    const getPoint = (across: number, back: number, down: number) =>
      `${APEX.x + (across - back) * STEP_ACROSS},${APEX.y + (across + back) * STEP_DEPTH + down * STEP_DOWN}`
    const getTile = (corners: string[]) => corners.join(' ')

    const cells = [0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => ({ row, column })))
    const topTones = ['#f2ede1', '#f2ede1', '#3b6fd4', '#f0b429', '#f2ede1', '#f2ede1', '#f2ede1', '#e8862c', '#f2ede1']
    const leftTones = ['#2f8f46', '#2f8f46', '#f0b429', '#2f8f46', '#2f8f46', '#2f8f46', '#3b6fd4', '#2f8f46', '#2f8f46']
    const rightTones = ['#e0452a', '#e8862c', '#e0452a', '#e0452a', '#e0452a', '#f0b429', '#e0452a', '#e0452a', '#3b6fd4']

    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <circle cx="44" cy="40" r="40" fill={accent} />
        <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
          {cells.map((cell) => (
            <polygon
              key={`top-${cell.row}-${cell.column}`}
              points={getTile([
                getPoint(cell.column, cell.row, 0),
                getPoint(cell.column + 1, cell.row, 0),
                getPoint(cell.column + 1, cell.row + 1, 0),
                getPoint(cell.column, cell.row + 1, 0),
              ])}
              fill={topTones[cell.row * 3 + cell.column]}
            />
          ))}
          {cells.map((cell) => (
            <polygon
              key={`left-${cell.row}-${cell.column}`}
              points={getTile([
                getPoint(cell.column, 3, cell.row),
                getPoint(cell.column + 1, 3, cell.row),
                getPoint(cell.column + 1, 3, cell.row + 1),
                getPoint(cell.column, 3, cell.row + 1),
              ])}
              fill={leftTones[cell.row * 3 + cell.column]}
            />
          ))}
          {cells.map((cell) => (
            <polygon
              key={`right-${cell.row}-${cell.column}`}
              points={getTile([
                getPoint(3, 3 - cell.column, cell.row),
                getPoint(3, 2 - cell.column, cell.row),
                getPoint(3, 2 - cell.column, cell.row + 1),
                getPoint(3, 3 - cell.column, cell.row + 1),
              ])}
              fill={rightTones[cell.row * 3 + cell.column]}
            />
          ))}
        </g>
        {grain}
      </svg>
    )
  }

  if (gameId === 'tetris') {
    const blocks = [
      { x: 0, y: 0, tone: '#2ec4b6' },
      { x: 1, y: 0, tone: '#2ec4b6' },
      { x: 2, y: 0, tone: '#2ec4b6' },
      { x: 3, y: 0, tone: '#2ec4b6' },
      { x: 0, y: 1, tone: '#f0b429' },
      { x: 1, y: 1, tone: '#f0b429' },
      { x: 0, y: 2, tone: '#f0b429' },
      { x: 1, y: 2, tone: '#f0b429' },
      { x: 2, y: 1, tone: '#8b5cf6' },
      { x: 2, y: 2, tone: '#8b5cf6' },
      { x: 3, y: 2, tone: '#8b5cf6' },
      { x: 3, y: 1, tone: '#e0452a' },
      { x: 4, y: 1, tone: '#e0452a' },
      { x: 4, y: 2, tone: '#2f8f46' },
      { x: 5, y: 2, tone: '#2f8f46' },
      { x: 5, y: 1, tone: '#e8862c' },
    ]
    const CELL = 30
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <rect x="0" y="0" width="70" height="200" fill={tone} />
        <circle cx="286" cy="32" r="34" fill={accent} />
        <rect x="88" y="42" width="184" height="128" rx="8" fill="#141416" stroke={INK} strokeWidth="5" />
        {blocks.map((block) => (
          <rect
            key={`${block.x}-${block.y}`}
            x={94 + block.x * CELL}
            y={78 + block.y * CELL}
            width={CELL - 4}
            height={CELL - 4}
            rx="4"
            fill={block.tone}
            stroke={INK}
            strokeWidth="3"
          />
        ))}
        {grain}
      </svg>
    )
  }

  if (gameId === 'game-2048') {
    const tiles = [
      { x: 0, y: 0, label: '2', fill: '#efe7d8', text: INK },
      { x: 1, y: 0, label: '8', fill: '#e8862c', text: INK },
      { x: 2, y: 0, label: '4', fill: '#efe7d8', text: INK },
      { x: 0, y: 1, label: '32', fill: '#e0452a', text: PAPER },
      { x: 1, y: 1, label: '64', fill: '#8b5cf6', text: PAPER },
      { x: 2, y: 1, label: '16', fill: '#f0b429', text: INK },
      { x: 0, y: 2, label: '512', fill: '#2f8f46', text: PAPER },
      { x: 1, y: 2, label: '2048', fill: '#3b6fd4', text: PAPER },
      { x: 2, y: 2, label: '128', fill: '#2ec4b6', text: INK },
    ]
    const CELL = 52
    return (
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={frame} aria-hidden="true">
        <rect width="320" height="200" fill={PAPER} />
        <rect x="0" y="0" width="64" height="200" fill={tone} />
        <circle cx="44" cy="38" r="34" fill={accent} />
        <rect x="92" y="12" width="176" height="176" rx="12" fill="#141416" stroke={INK} strokeWidth="5" />
        {tiles.map((tile) => (
          <g key={tile.label}>
            <rect
              x={102 + tile.x * CELL}
              y={22 + tile.y * CELL}
              width={CELL - 10}
              height={CELL - 10}
              rx="6"
              fill={tile.fill}
              stroke={INK}
              strokeWidth="3"
            />
            <text
              x={102 + tile.x * CELL + (CELL - 10) / 2}
              y={22 + tile.y * CELL + (CELL - 10) / 2 + 6}
              textAnchor="middle"
              fontSize={tile.label.length > 3 ? 14 : 18}
              fontWeight="800"
              fill={tile.text}
            >
              {tile.label}
            </text>
          </g>
        ))}
        {grain}
      </svg>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: tone }}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0a0a0b]">Soon</span>
    </div>
  )
}

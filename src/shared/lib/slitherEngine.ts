// Aturan main dan matematika ular dipisah dari komponen supaya papan tiga dimensi hanya perlu
// menggambar, sedangkan simulasi gerak, tumbuh, makan, dan tabrakan bisa dipakai ulang & diuji.

export const SLITHER_ARENA_RADIUS = 1150
export const SLITHER_BASE_SPEED = 172
// Sprint dinaikkan supaya bedanya dengan kecepatan dasar jelas terasa dan tidak "ngambang".
export const SLITHER_BOOST_SPEED = 372
export const SLITHER_TURN_RATE = 4.2
export const SLITHER_SEGMENT_SPACING = 8
export const SLITHER_SNAKE_RADIUS = 11
export const SLITHER_HEAD_RADIUS = 16
export const SLITHER_BASE_SEGMENTS = 16
// Skor awal ular kita dibuat sudah di atas ambang sprint supaya begitu ronde mulai, sprint
// langsung bisa dipakai tanpa harus makan dulu.
export const SLITHER_START_SCORE = 12
export const SLITHER_FOOD_PER_SEGMENT = 2
export const SLITHER_EAT_RADIUS = 26
export const SLITHER_FOOD_COUNT = 620
export const SLITHER_BOOST_MIN_SCORE = 6
// Sprint mulai nyala kalau skor sudah di atas ambang + buffer ini, dan baru mati saat skor
// menyentuh ambang. Jeda ini yang bikin sprint tidak kedip-kedip di sekitar batas skor.
export const SLITHER_BOOST_START_BUFFER = 4
export const SLITHER_BOOST_DRAIN = 3.4
export const SLITHER_FRAME_INTERVAL = 70
export const SLITHER_STALE_MS = 4000
export const SLITHER_SAMPLE_COUNT = 44
export const SLITHER_NETWORK_SPACING = 14.4
export const SLITHER_PATH_STEP = 4
export const SLITHER_MAX_SEGMENTS = 900

// Setebal sama dari kepala ke ekor; kedua ujungnya sekadar ditutup membulat. Tidak ada moncong
// meruncing dan tidak ada gembung di kepala — kepala hanya ditandai oleh matanya.
export const getSlitherBodyProfile = (t: number) => {
  if (t < 0.085) {
    const k = (0.085 - t) / 0.085
    return Math.sqrt(Math.max(0, 1 - k * k))
  }
  if (t < 0.86) return 1
  const k = (t - 0.86) / 0.14
  return Math.max(0.05, Math.sqrt(Math.max(0, 1 - k * k)))
}

// Sedikit gepeng saja supaya badannya tetap terlihat bulat gemuk dari atas.
export const getSlitherBodyFlatten = () => 0.9

// Jarak antar ruas gelang badan, dihitung dari ketebalan ular.
export const getSlitherSegmentPitch = (radius: number) => Math.max(7, radius * 0.95)

export interface SlitherSkin {
  label: string
  // Satu warna berarti polos; banyak warna berarti gelang badannya berganti-ganti warna.
  bands: string[]
  band: string
  shine: string
}

// Warna cerah ala kartun; yang pertama putih gading seperti ular pemain di gambar acuan.
export const SLITHER_SKINS: SlitherSkin[] = [
  { label: 'Putih', bands: ['#f4f1e8'], band: '#c6c0b1', shine: '#ffffff' },
  { label: 'Hijau', bands: ['#5ec26a'], band: '#37853f', shine: '#a8e6b0' },
  { label: 'Biru', bands: ['#4aa3e0'], band: '#2a6795', shine: '#a5d7f5' },
  { label: 'Oranye', bands: ['#f0a63c'], band: '#b8741c', shine: '#ffd79a' },
  { label: 'Merah', bands: ['#e8636f'], band: '#a83643', shine: '#ffb3bb' },
  { label: 'Ungu', bands: ['#a97ae0'], band: '#6f4aa3', shine: '#dcc4f7' },
  { label: 'Kuning', bands: ['#f2d43c'], band: '#b99f18', shine: '#fff0a3' },
  { label: 'Tosca', bands: ['#4fd6c4'], band: '#279184', shine: '#b3f2e9' },
  { label: 'Permen', bands: ['#f4f1e8', '#e8636f'], band: '#c6c0b1', shine: '#ffffff' },
  { label: 'Lebah', bands: ['#f2d43c', '#2f2f36'], band: '#b99f18', shine: '#fff0a3' },
  { label: 'Mint', bands: ['#4fd6c4', '#f4f1e8'], band: '#279184', shine: '#ffffff' },
]

export const getSlitherSkin = (index: number) =>
  SLITHER_SKINS[((index % SLITHER_SKINS.length) + SLITHER_SKINS.length) % SLITHER_SKINS.length]

export const SLITHER_FOOD_KINDS = 10
// Ular yang mati meninggalkan makanan sebanyak ini, menyebar sepanjang bekas badannya.
export const SLITHER_DROP_MIN = 8
export const SLITHER_DROP_MAX = 40

// Ular makin panjang makin tebal, seperti kompetitor, tapi dibatasi supaya tidak menutupi layar.
export const getSlitherRadius = (score: number) =>
  SLITHER_SNAKE_RADIUS * (0.86 + Math.min(0.85, Math.max(0, score) / 300))

export interface SlitherFood {
  id: number
  x: number
  y: number
  hue: number
  kind: number
  spin: number
}

// Kunci acak dibangun dari kode ruangan supaya sebaran makanan awal sama tiap kali dibuka ulang.
export const getSlitherSeed = (code: string) => {
  let hash = 2166136261
  for (let index = 0; index < code.length; index += 1) {
    hash ^= code.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const getSlitherRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const getSlitherPointInCircle = (random: () => number, radius: number) => {
  const angle = random() * Math.PI * 2
  const distance = Math.sqrt(random()) * radius
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

export const getSlitherFood = (seed: number, count = SLITHER_FOOD_COUNT): SlitherFood[] => {
  const random = getSlitherRandom(seed)
  const list: SlitherFood[] = []
  for (let id = 0; id < count; id += 1) {
    const point = getSlitherPointInCircle(random, SLITHER_ARENA_RADIUS * 0.92)
    list.push({
      id,
      x: point.x,
      y: point.y,
      hue: Math.floor(random() * 360),
      kind: Math.floor(random() * SLITHER_FOOD_KINDS),
      spin: random() * Math.PI * 2,
    })
  }
  return list
}

// Jenis jajanan sengaja tidak diundi ulang supaya satu wadah instans tetap memuat bentuk yang sama.
export const getSlitherRespawnFood = (random: () => number) => {
  const point = getSlitherPointInCircle(random, SLITHER_ARENA_RADIUS * 0.92)
  return { x: point.x, y: point.y, spin: random() * Math.PI * 2 }
}

export const getSlitherSpawnPoint = (random: () => number) =>
  getSlitherPointInCircle(random, SLITHER_ARENA_RADIUS * 0.45)

export const getSlitherSegmentCount = (score: number) =>
  Math.min(
    SLITHER_MAX_SEGMENTS,
    SLITHER_BASE_SEGMENTS + Math.floor(Math.max(0, score) / SLITHER_FOOD_PER_SEGMENT),
  )

export const getSlitherRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 5; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const getSlitherHue = (id: string) => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return hash % 360
}

// Titik badan diambil pada jarak tetap sepanjang jejak kepala supaya ruas tidak menumpuk saat
// ular melambat dan tidak merenggang saat ngebut.
export const getSlitherSampled = (path: number[][], count: number, spacing: number): number[][] => {
  const out: number[][] = []
  if (!path.length) return out
  out.push([path[0][0], path[0][1]])
  let target = spacing
  let travelled = 0
  for (let index = 1; index < path.length && out.length < count; index += 1) {
    const dx = path[index][0] - path[index - 1][0]
    const dy = path[index][1] - path[index - 1][1]
    const distance = Math.hypot(dx, dy)
    while (distance > 0 && travelled + distance >= target && out.length < count) {
      const ratio = (target - travelled) / distance
      out.push([path[index - 1][0] + dx * ratio, path[index - 1][1] + dy * ratio])
      target += spacing
    }
    travelled += distance
  }
  while (out.length < count && out.length) {
    out.push(out[out.length - 1])
  }
  return out
}

export const getSlitherHit = (headX: number, headY: number, segments: number[][], radius: number) => {
  const limit = radius * radius
  for (let index = 0; index < segments.length; index += 1) {
    const dx = headX - segments[index][0]
    const dy = headY - segments[index][1]
    if (dx * dx + dy * dy <= limit) return true
  }
  return false
}

export const getSlitherOutOfBounds = (x: number, y: number) =>
  Math.hypot(x, y) >= SLITHER_ARENA_RADIUS

// Sudut didekatkan ke arah target dengan batas belok per detik supaya ular berbelok mulus.
export const getSlitherSteered = (angle: number, target: number, maxDelta: number) => {
  let diff = target - angle
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, diff))
  return angle + clamped
}

// Radius menghindar dikecilkan supaya ular komputer main lebih rapat/berani, bukan langsung kabur.
export const SLITHER_BOT_AVOID = 78
export const SLITHER_BOT_EDGE = 190
export const SLITHER_BOT_RESPAWN_MS = 2600
// Sejauh ini ular komputer mau mengejar kepala mangsa, dan sejauh apa tikungannya memimpin
// di depan mangsa supaya bisa memotong jalan.
export const SLITHER_BOT_CHASE = 380
export const SLITHER_BOT_LEAD = 130

export const getSlitherBotName = (index: number) => `Komputer ${index + 1}`

export interface SlitherPrey {
  x: number
  y: number
  angle: number
  score: number
}

// Otak ular komputer: hindari tepi arena, lalu — kalau ada mangsa dalam jangkauan — buru kepalanya
// dengan memimpin tikungan di depan hidungnya; kalau tidak, menjauh dari badan terdekat lalu kejar
// makanan terdekat dengan sedikit gerak acak supaya jalurnya tidak kaku.
export const getSlitherBotTarget = (
  x: number,
  y: number,
  angle: number,
  foods: number[][],
  hazards: number[][],
  wander: number,
  prey: SlitherPrey | null = null,
) => {
  if (Math.hypot(x, y) > SLITHER_ARENA_RADIUS - SLITHER_BOT_EDGE) {
    return Math.atan2(-y, -x) + wander * 0.3
  }

  // Saat sedang menikung untuk memotong mangsa, ular komputer lebih cuek pada badan lain supaya
  // benar-benar berani menutup jalur, bukan mengerem di detik terakhir.
  let preyDistance = Infinity
  let chaseAngle = 0
  if (prey) {
    const dx = prey.x - x
    const dy = prey.y - y
    preyDistance = Math.hypot(dx, dy)
    if (preyDistance < SLITHER_BOT_CHASE) {
      const lead = Math.min(SLITHER_BOT_LEAD, preyDistance * 0.55)
      const aimX = prey.x + Math.cos(prey.angle) * lead
      const aimY = prey.y + Math.sin(prey.angle) * lead
      chaseAngle = Math.atan2(aimY - y, aimX - x)
    }
  }
  const isHunting = preyDistance < SLITHER_BOT_CHASE
  const avoidRange = isHunting ? SLITHER_BOT_AVOID * 0.55 : SLITHER_BOT_AVOID

  let repelX = 0
  let repelY = 0
  for (let index = 0; index < hazards.length; index += 1) {
    const dx = x - hazards[index][0]
    const dy = y - hazards[index][1]
    const distance = Math.hypot(dx, dy)
    if (distance > 0 && distance < avoidRange) {
      repelX += (dx / distance) * (avoidRange - distance)
      repelY += (dy / distance) * (avoidRange - distance)
    }
  }
  if (repelX !== 0 || repelY !== 0) return Math.atan2(repelY, repelX)

  if (isHunting) return chaseAngle + wander * 0.06

  let bestDistance = Infinity
  let bestAngle = angle + wander
  for (let index = 0; index < foods.length; index += 1) {
    const dx = foods[index][0] - x
    const dy = foods[index][1] - y
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      bestDistance = distance
      bestAngle = Math.atan2(dy, dx)
    }
  }
  return bestAngle + wander * 0.12
}

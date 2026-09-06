import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import type { GameRoomPlayer } from './gameRoom'

export type GameRoomRow = {
  code: string
  game: string
  status: string
  seatTotal: number
  players: GameRoomPlayer[]
  turn: string
  state: Record<string, unknown>
  moveTotal: number
  winner: string
  updatedAt: Date
}

export type GameRoomPatch = Partial<Omit<GameRoomRow, 'code' | 'updatedAt'>>

// Ruangan disimpan di Postgres Supabase bila string koneksinya terisi; selain itu dipakai memori
// proses supaya mode pengembangan tetap bisa dijalankan tanpa basis data.
const getIsDatabaseReady = () => /^postgres(ql)?:\/\//.test(process.env.SUPABASE_CONNECTION_STRING ?? '')

const globalForRooms = globalThis as unknown as {
  gameRooms: Map<string, GameRoomRow> | undefined
  gameRoomsCache: Map<string, { row: GameRoomRow; at: number }> | undefined
  gameRoomsSeen: Map<string, number> | undefined
  gameRoomsSeenWrites: Map<string, number> | undefined
  gameRoomsFallback: boolean | undefined
  gameRoomsPurgedAt: number | undefined
}
const memoryRooms = globalForRooms.gameRooms ?? new Map<string, GameRoomRow>()
globalForRooms.gameRooms = memoryRooms

// Ruangan yang baru saja dibaca atau ditulis disimpan sebentar supaya setiap langkah tidak
// menunggu perjalanan bolak-balik ke basis data yang jauh. Umurnya dibuat singkat karena langkah
// lawan bisa ditulis oleh instans lain dan tidak boleh tertahan lama di singgahan.
const CACHE_TTL = 2000
const cachedRooms = globalForRooms.gameRoomsCache ?? new Map<string, { row: GameRoomRow; at: number }>()
globalForRooms.gameRoomsCache = cachedRooms

// Kehadiran dicatat per pemain, bukan dengan menulis ulang seluruh daftar pemain, supaya denyut
// satu pemain tidak pernah menimpa catatan pemain lain dengan salinan yang sudah basi.
const seenTimes = globalForRooms.gameRoomsSeen ?? new Map<string, number>()
globalForRooms.gameRoomsSeen = seenTimes

const getSeenKey = (code: string, token: string) => `${code}:${token}`

// Waktu terlihat dari memori proses selalu lebih baru daripada yang tersimpan, jadi dipakai
// menimpa isi baris supaya pemain yang aktif tidak pernah terlihat menghilang.
export const getGameRoomSeenPlayers = (code: string, players: GameRoomPlayer[]) =>
  players.map((player) => {
    const seenAt = seenTimes.get(getSeenKey(code, player.token)) ?? 0
    return seenAt > (player.seenAt ?? 0) ? { ...player, seenAt } : player
  })

// Denyut kehadiran dicatat tanpa menyentuh basis data supaya bisa dipanggil dari jalur mana pun.
export const postGameRoomSeen = (code: string, token: string) => {
  if (!token) return
  seenTimes.set(getSeenKey(code, token), Date.now())
}

const getCachedRoom = (code: string) => {
  const found = cachedRooms.get(code)
  if (!found) return null
  if (Date.now() - found.at > CACHE_TTL) {
    cachedRooms.delete(code)
    return null
  }
  return found.row
}

const postCachedRoom = (row: GameRoomRow) => {
  cachedRooms.set(row.code, { row, at: Date.now() })
}

// Di luar produksi, basis data yang tidak terjangkau dialihkan ke memori supaya permainan tetap
// bisa dicoba; di produksi kegagalan tetap dilempar agar salah konfigurasi cepat ketahuan.
const getIsFallbackAllowed = () => process.env.NODE_ENV !== 'production'

const getIsMemoryMode = () => !getIsDatabaseReady() || (globalForRooms.gameRoomsFallback ?? false)

const postFallbackMode = (error: unknown) => {
  if (!getIsFallbackAllowed()) throw error
  globalForRooms.gameRoomsFallback = true
  console.warn('[game-rooms] Basis data tidak terjangkau, ruangan dialihkan ke memori proses.')
}

export const getGameRoomStoreMode = () => (getIsMemoryMode() ? 'memory' : 'database')

// Baris yang diserahkan ke pemanggil selalu memakai kehadiran terbaru dari memori proses.
const getSeenRoom = (room: GameRoomRow | null) =>
  room ? { ...room, players: getGameRoomSeenPlayers(room.code, room.players) } : null

// Pembacaan segar dipakai jalur yang wajib melihat langkah terbaru, misalnya denyut aliran, supaya
// langkah dari instans lain tidak tertahan oleh singgahan.
export const getGameRoomRow = async (code: string, isFresh = false): Promise<GameRoomRow | null> => {
  if (getIsMemoryMode()) return getSeenRoom(memoryRooms.get(code) ?? null)

  const cached = isFresh ? null : getCachedRoom(code)
  if (cached) return getSeenRoom(cached)

  const room = await prisma.gameRoom.findUnique({ where: { code } }).catch((error) => {
    postFallbackMode(error)
    return null
  })
  if (!room) return getIsMemoryMode() ? getSeenRoom(memoryRooms.get(code) ?? null) : null

  const row: GameRoomRow = {
    code: room.code,
    game: room.game,
    status: room.status,
    seatTotal: room.seatTotal,
    players: (room.players ?? []) as GameRoomPlayer[],
    turn: room.turn,
    state: (room.state ?? {}) as Record<string, unknown>,
    moveTotal: room.moveTotal,
    winner: room.winner,
    updatedAt: room.updatedAt,
  }
  postCachedRoom(row)
  return getSeenRoom(row)
}

export const postGameRoomRow = async (row: Omit<GameRoomRow, 'updatedAt'>) => {
  const created: GameRoomRow = { ...row, updatedAt: new Date() }
  if (getIsMemoryMode()) {
    memoryRooms.set(row.code, created)
    return created
  }

  const stored = await prisma.gameRoom.create({
    data: {
      code: row.code,
      game: row.game,
      status: row.status,
      seatTotal: row.seatTotal,
      players: row.players as unknown as Prisma.InputJsonValue,
      turn: row.turn,
      state: row.state as Prisma.InputJsonValue,
      moveTotal: row.moveTotal,
      winner: row.winner,
    },
  }).catch((error) => {
    postFallbackMode(error)
    return null
  })
  if (!stored) memoryRooms.set(row.code, created)
  postCachedRoom(created)
  return created
}

// Kehadiran cukup ditulis berkala supaya basis data tidak dibanjiri denyut dari setiap pemain.
// Di antara penulisan, catatan memori sudah membuat pemain terlihat hadir, jadi salinan lama tidak
// perlu dikembalikan ke singgahan.
const SEEN_WRITE_INTERVAL = 8000
const seenWrites = globalForRooms.gameRoomsSeenWrites ?? new Map<string, number>()
globalForRooms.gameRoomsSeenWrites = seenWrites

export const updateGameRoomSeen = async (code: string, token: string, isFresh = false) => {
  if (!token) return null
  // Denyut dicatat lebih dulu supaya kehadiran tidak bergantung pada berhasilnya penulisan.
  postGameRoomSeen(code, token)

  const now = Date.now()
  const key = getSeenKey(code, token)
  const isWriteDue = now - (seenWrites.get(key) ?? 0) > SEEN_WRITE_INTERVAL
  // Daftar pemain hanya ditulis dari bacaan segar supaya pemain yang baru bergabung tidak tertimpa.
  const room = await getGameRoomRow(code, isFresh || isWriteDue)
  if (!room) return null
  if (!room.players.some((player) => player.token === token)) return room
  if (!isWriteDue) return room

  seenWrites.set(key, now)
  return updateGameRoomRow(code, { players: room.players })
}

// Ruangan tidak pernah dihapus oleh permainan itu sendiri, jadi tanpa penyapuan barisnya menumpuk
// selamanya berikut kolom JSON keadaannya. Penyapuan dititipkan ke jalur pembuatan ruangan supaya
// tidak membutuhkan penjadwal terpisah, dan dijaga agar berjalan paling sering sekali per jam per
// proses. Kegagalannya sengaja didiamkan: ini pekerjaan rumah tangga, bukan bagian dari permintaan.
const PURGE_INTERVAL = 60 * 60 * 1000
const PURGE_AGE = 24 * 60 * 60 * 1000

export const postGameRoomPurge = async () => {
  if (getIsMemoryMode()) {
    const limit = Date.now() - PURGE_AGE
    memoryRooms.forEach((room, code) => {
      if (room.updatedAt.getTime() < limit) memoryRooms.delete(code)
    })
    return
  }

  const now = Date.now()
  if (now - (globalForRooms.gameRoomsPurgedAt ?? 0) < PURGE_INTERVAL) return
  globalForRooms.gameRoomsPurgedAt = now

  await prisma.gameRoom
    .deleteMany({ where: { updatedAt: { lt: new Date(now - PURGE_AGE) } } })
    .catch(() => null)
}

export const updateGameRoomRow = async (code: string, patch: GameRoomPatch): Promise<GameRoomRow | null> => {
  const updateMemoryRow = () => {
    const found = memoryRooms.get(code)
    if (!found) return null
    const next: GameRoomRow = { ...found, ...patch, updatedAt: new Date() }
    memoryRooms.set(code, next)
    postCachedRoom(next)
    return getSeenRoom(next)
  }

  if (getIsMemoryMode()) return updateMemoryRow()

  const room = await prisma.gameRoom.update({
    where: { code },
    data: {
      status: patch.status,
      seatTotal: patch.seatTotal,
      players: patch.players as unknown as Prisma.InputJsonValue | undefined,
      turn: patch.turn,
      state: patch.state as Prisma.InputJsonValue | undefined,
      moveTotal: patch.moveTotal,
      winner: patch.winner,
    },
  }).catch((error) => {
    postFallbackMode(error)
    return null
  })
  if (!room) return updateMemoryRow()

  const next: GameRoomRow = {
    code: room.code,
    game: room.game,
    status: room.status,
    seatTotal: room.seatTotal,
    players: (room.players ?? []) as GameRoomPlayer[],
    turn: room.turn,
    state: (room.state ?? {}) as Record<string, unknown>,
    moveTotal: room.moveTotal,
    winner: room.winner,
    updatedAt: room.updatedAt,
  }
  postCachedRoom(next)
  return getSeenRoom(next)
}

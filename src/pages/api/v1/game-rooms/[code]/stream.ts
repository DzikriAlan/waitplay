import type { NextApiRequest, NextApiResponse } from 'next'
import { getGameRoomSeat, getGameRoomView } from '@/shared/lib/gameRoom'
import type { GameRoomRow } from '@/shared/lib/gameRoomStore'
import { getGameRoomRow, updateGameRoomSeen } from '@/shared/lib/gameRoomStore'
import { getGameRoomSubscription } from '@/shared/lib/gameRoomEvents'
import { postApiMethodNotAllowed } from '@/shared/lib/apiResponse'

const PING_INTERVAL = 15000
// Siaran dalam proses menutup kebutuhan utama; pembacaan cadangan tetap ada supaya perubahan dari
// instans lain ikut terkirim. Denyutnya dilonggarkan dan tidak lagi memaksa bacaan segar, jadi
// singgahan proses boleh menjawab: kehadiran tidak butuh ketelitian empat detik, sedangkan langkah
// lawan dari instans yang sama sudah dikabarkan seketika lewat getGameRoomSubscription.
const SAFETY_INTERVAL = 15000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return postApiMethodNotAllowed(res, 'GET')

  const code = String(req.query.code ?? '').toUpperCase()
  const token = String(req.query.token ?? '')

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // Peramban menahan potongan awal aliran sampai penyangganya terisi, jadi diberi bantalan
  // komentar supaya pesan pertama dan berikutnya langsung diteruskan ke halaman.
  res.write(`:${' '.repeat(2048)}\n\n`)

  let lastSent = ''
  let isClosed = false

  const postRoomState = async (known: GameRoomRow | null = null) => {
    if (isClosed) return
    if (res.writableEnded || res.destroyed) return clearStream()
    try {
      const room = known ?? (await getGameRoomRow(code))
      if (!room) return
      const seat = getGameRoomSeat(room.players, token)
      const view = { ...getGameRoomView(room, seat), token: seat ? token : '' }
      // Setiap pesan aliran memakai selubung yang sama dengan balasan REST supaya klien
      // membaca data ruangan lewat satu bentuk saja.
      const payload = JSON.stringify({ success: true, data: view, message: 'Room updated' })
      // Cap waktu diabaikan saat membandingkan supaya keadaan yang sama tidak dikirim dua kali.
      const fingerprint = JSON.stringify({ ...view, updatedAt: '' })
      if (fingerprint === lastSent) return
      lastSent = fingerprint
      res.write(`data: ${payload}\n\n`)
    } catch {
      return
    }
  }

  await postRoomState(await updateGameRoomSeen(code, token, true))
  // Siaran dalam proses memberi kabar seketika, penarikan cadangan menjaga bila ada instans lain.
  const clearSubscription = getGameRoomSubscription(code, (row) => {
    void postRoomState(row)
  })
  // Denyut kehadiran menandai kursi masih dipakai supaya tidak diambil alih pemain lain.
  const safetyTimer = setInterval(() => {
    if (res.writableEnded || res.destroyed) return clearStream()
    void updateGameRoomSeen(code, token).then((room) => postRoomState(room))
  }, SAFETY_INTERVAL)
  const pingTimer = setInterval(() => {
    if (res.writableEnded || res.destroyed) return clearStream()
    if (!isClosed) res.write(': ping\n\n')
  }, PING_INTERVAL)

  // Penutupan dipantau dari beberapa sisi karena satu peristiwa saja tidak selalu terpicu,
  // dan tulisan yang gagal ikut menghentikan denyut supaya kursi tidak terlihat aktif selamanya.
  const clearStream = () => {
    if (isClosed) return
    isClosed = true
    clearSubscription()
    clearInterval(safetyTimer)
    clearInterval(pingTimer)
    res.end()
  }

  req.on('close', clearStream)
  req.on('aborted', clearStream)
  res.on('close', clearStream)
  res.on('error', clearStream)
}

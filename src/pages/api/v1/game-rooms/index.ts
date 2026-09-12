import type { NextApiRequest, NextApiResponse } from 'next'
import {
  GAME_ROOM_SEAT_MIN,
  getGameRoomCode,
  getGameRoomNewState,
  getGameRoomToken,
  getGameRoomView,
} from '@/shared/lib/gameRoom'
import { getGameRoomRow, postGameRoomPurge, postGameRoomRow } from '@/shared/lib/gameRoomStore'
import { postApiError, postApiMethodNotAllowed, postApiSuccess } from '@/shared/lib/apiResponse'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return postApiMethodNotAllowed(res, 'POST')

  const game = String(req.body?.game ?? '')
  const name = String(req.body?.name ?? 'Pemain 1').slice(0, 24)
  // Ruangan baru dimulai untuk dua pemain di semua permainan; tuan rumah UNO masih boleh
  // menambah kursi lewat panel undangan setelah ruangan terbentuk.
  const seatTotal = GAME_ROOM_SEAT_MIN[game]
  if (!seatTotal) {
    return postApiError(res, {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: { game: ['Game is not supported'] },
    })
  }

  const postRoom = async (token: string) => {
    // Kode acak diulang bila bentrok dengan ruangan yang masih tersimpan.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = getGameRoomCode()
      const found = await getGameRoomRow(code)
      if (found) continue
      return postGameRoomRow({
        code,
        game,
        status: 'lobby',
        seatTotal,
        players: [{ seat: 'p1', token, name, seenAt: Date.now() }],
        turn: 'p1',
        state: getGameRoomNewState(game),
        moveTotal: 0,
        winner: '',
      })
    }
    return null
  }

  try {
    // Penyapuan tidak ditunggu supaya pembuatan ruangan tidak ikut melambat karenanya.
    void postGameRoomPurge()

    const token = getGameRoomToken()
    const room = await postRoom(token)
    if (!room) {
      return postApiError(res, {
        status: 503,
        code: 'ROOM_CODE_UNAVAILABLE',
        message: 'No free room code is available right now',
      })
    }
    return postApiSuccess(res, {
      status: 201,
      data: { ...getGameRoomView(room, 'p1'), token },
      message: 'Room created successfully',
    })
  } catch (error) {
    console.error('[game-rooms] gagal membuat ruangan:', error instanceof Error ? error.message : error)
    return postApiError(res, {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    })
  }
}

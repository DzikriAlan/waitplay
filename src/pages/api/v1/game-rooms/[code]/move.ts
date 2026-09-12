import type { NextApiRequest, NextApiResponse } from 'next'
import { getGameRoomAppliedMove, getGameRoomSeat, getGameRoomView } from '@/shared/lib/gameRoom'
import { getGameRoomRow, getGameRoomSeenPlayers, postGameRoomSeen, updateGameRoomRow } from '@/shared/lib/gameRoomStore'
import { postGameRoomEvent } from '@/shared/lib/gameRoomEvents'
import { postApiError, postApiMethodNotAllowed, postApiSuccess } from '@/shared/lib/apiResponse'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return postApiMethodNotAllowed(res, 'POST')

  const code = String(req.query.code ?? '').toUpperCase()
  const token = String(req.body?.token ?? '')
  const holeIndex = Number(req.body?.holeIndex)
  const from = String(req.body?.from ?? '')
  const to = String(req.body?.to ?? '')
  const promotion = String(req.body?.promotion ?? '')
  const action = String(req.body?.action ?? '')
  const cardId = String(req.body?.cardId ?? '')
  const cardIds = Array.isArray(req.body?.cardIds) ? req.body.cardIds.map(String).filter(Boolean) : undefined
  const color = String(req.body?.color ?? '')
  const lineIndex = Number(req.body?.lineIndex)
  const cellIndex = Number(req.body?.cellIndex)

  try {
    const room = await getGameRoomRow(code)
    if (!room) {
      return postApiError(res, { status: 404, code: 'ROOM_NOT_FOUND', message: 'Room not found' })
    }

    const seat = getGameRoomSeat(room.players, token)
    if (!seat) {
      return postApiError(res, { status: 403, code: 'SEAT_NOT_FOUND', message: 'You do not hold a seat in this room' })
    }

    const applied = getGameRoomAppliedMove(room, seat, {
      holeIndex,
      from,
      to,
      promotion: promotion || undefined,
      action: action || undefined,
      cardId: cardId || undefined,
      cardIds,
      color: color || undefined,
      lineIndex,
      cellIndex,
    })
    if (!applied) {
      return postApiError(res, {
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: { move: ['This move is not allowed right now'] },
      })
    }

    // Pemain yang baru saja melangkah pasti masih ada, jadi kehadirannya ikut ditandai supaya
    // lawannya tidak terus melihat pemberitahuan menunggu sambungan.
    postGameRoomSeen(code, token)
    const players = getGameRoomSeenPlayers(code, room.players)

    // Lawan dikabari lebih dulu supaya papannya ikut berubah tanpa menunggu tulisan basis data,
    // lalu hasil simpanan disiarkan ulang sebagai kebenaran akhir.
    postGameRoomEvent(code, { ...room, ...applied, players, updatedAt: new Date() })

    const updated = await updateGameRoomRow(code, { ...applied, players })
    if (!updated) {
      return postApiError(res, { status: 404, code: 'ROOM_NOT_FOUND', message: 'Room not found' })
    }
    postGameRoomEvent(code, updated)

    return postApiSuccess(res, {
      data: { ...getGameRoomView(updated, seat), token },
      message: 'Move applied successfully',
    })
  } catch {
    return postApiError(res, {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    })
  }
}

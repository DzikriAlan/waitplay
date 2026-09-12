import type {
  PayloadGetGameRooms,
  PayloadPostGameRooms,
  PayloadPostGameRoomsJoin,
  PayloadPostGameRoomsMove,
  PayloadPostGameRoomsLeave,
  PayloadPostGameRoomsSeats,
  PayloadPostGameRoomsStart,
} from '../types/gameRoomsTypes'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

// Seluruh endpoint membalas dengan selubung baku, jadi isinya dibuka di satu tempat dan pesan
// kesalahan dari server dipakai apa adanya supaya penyebabnya tidak hilang.
export const getGameRoomsBody = async (res: Response) => {
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message ?? res.statusText)
  }
  return body.data
}

// Aliran dipakai untuk menerima perubahan ruangan tanpa menunggu penarikan berikutnya.
export const getGameRoomsStream = (payload: PayloadGetGameRooms) => {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return null
  const queryString = '?' + new URLSearchParams({ token: payload.token }).toString()
  return new EventSource(`${baseUrl}/api/v1/game-rooms/${payload.code}/stream${queryString}`)
}

export const postGameRooms = async (payload: PayloadPostGameRooms) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const getGameRooms = async (payload: PayloadGetGameRooms) => {
  try {
    const queryString = '?' + new URLSearchParams({ token: payload.token }).toString()
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const postGameRoomsJoin = async (payload: PayloadPostGameRoomsJoin) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: payload.token, name: payload.name }),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const postGameRoomsStart = async (payload: PayloadPostGameRoomsStart) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: payload.token }),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const postGameRoomsSeats = async (payload: PayloadPostGameRoomsSeats) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}/seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: payload.token, seatTotal: payload.seatTotal }),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const postGameRoomsLeave = async (payload: PayloadPostGameRoomsLeave) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: payload.token }),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

export const postGameRoomsMove = async (payload: PayloadPostGameRoomsMove) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/game-rooms/${payload.code}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: payload.token,
        holeIndex: payload.holeIndex,
        from: payload.from,
        to: payload.to,
        promotion: payload.promotion,
        action: payload.action,
        cardId: payload.cardId,
        cardIds: payload.cardIds,
        color: payload.color,
        lineIndex: payload.lineIndex,
        cellIndex: payload.cellIndex,
      }),
    })
    return getGameRoomsBody(res)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

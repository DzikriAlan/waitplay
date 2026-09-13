import { create } from 'zustand'
import { Chess } from 'chess.js'
import type { ChessCell, ChessColor, DataChessGame, ChessGame } from '../types/chessTypes'

interface ChessStore {
  chessGame: ChessGame
  setChessInit: () => void
  setChessSelect: (square: string) => void
  setChessMove: (from: string, to: string, promotion?: string) => void
  setChessPromotion: (piece: string) => void
  setChessUndo: () => void
  setChessRestart: () => void
}

const PLAYER_COLOR: ChessColor = 'w'

export const useChessStates = create<ChessStore>((set, get) => {
  const chess = new Chess()

  const getTargets = (square: string | null) => {
    if (!square) return []
    return chess.moves({ square: square as never, verbose: true }) as Array<{ to: string; captured?: string }>
  }

  const getCheckedSquare = () => {
    if (!chess.inCheck()) return null
    const turn = chess.turn()
    const found = chess
      .board()
      .flat()
      .find((cell) => cell && cell.type === 'k' && cell.color === turn)
    return found ? found.square : null
  }

  const getBoard = (selected: string | null): ChessCell[] => {
    const targets = getTargets(selected)
    const targetMap = new Map(targets.map((move) => [move.to, !!move.captured]))
    const history = chess.history({ verbose: true }) as Array<{ from: string; to: string }>
    const last = history[history.length - 1] ?? null
    const checkedSquare = getCheckedSquare()

    return chess
      .board()
      .flat()
      .map((cell, index) => {
        const file = index % 8
        const rank = Math.floor(index / 8)
        const square = `${'abcdefgh'[file]}${8 - rank}`
        return {
          square,
          piece: cell ? { type: cell.type, color: cell.color as ChessColor } : null,
          isDark: (file + rank) % 2 === 1,
          isSelected: square === selected,
          isTarget: targetMap.has(square),
          isCapture: targetMap.get(square) === true,
          isLastMove: !!last && (last.from === square || last.to === square),
          isCheck: square === checkedSquare,
        }
      })
  }

  const getCaptured = (color: ChessColor) =>
    (chess.history({ verbose: true }) as Array<{ color: string; captured?: string }>)
      .filter((move) => move.color === color && move.captured)
      .map((move) => move.captured as string)

  const getResult = () => {
    if (chess.isCheckmate()) {
      const isPlayerWin = chess.turn() !== PLAYER_COLOR
      return {
        title: isPlayerWin ? 'Checkmate! You win' : 'Checkmate',
        subtitle: isPlayerWin ? 'Well played, the king is trapped.' : 'Raja Anda terkunci. Try again.',
      }
    }
    if (chess.isStalemate()) return { title: 'Draw', subtitle: 'Stalemate, no legal moves left.' }
    if (chess.isInsufficientMaterial()) return { title: 'Draw', subtitle: 'Insufficient material to checkmate.' }
    if (chess.isThreefoldRepetition()) return { title: 'Draw', subtitle: 'Threefold repetition.' }
    if (chess.isDraw()) return { title: 'Draw', subtitle: 'Fifty-move rule reached.' }
    return { title: '', subtitle: '' }
  }

  const getData = (selected: string | null, pendingPromotion: DataChessGame['pendingPromotion']): DataChessGame => {
    const history = chess.history({ verbose: true }) as Array<{ from: string; to: string }>
    const last = history[history.length - 1] ?? null
    const result = getResult()

    return {
      board: getBoard(selected),
      turn: chess.turn() as ChessColor,
      selected,
      lastMove: last ? { from: last.from, to: last.to } : null,
      moveTotal: history.length,
      capturedByPlayer: getCaptured('w'),
      capturedByEngine: getCaptured('b'),
      pendingPromotion,
      isCheck: chess.inCheck(),
      isFinished: chess.isGameOver(),
      resultTitle: result.title,
      resultSubtitle: result.subtitle,
      fen: chess.fen(),
    }
  }

  const updateGame = (selected: string | null, pendingPromotion: DataChessGame['pendingPromotion'] = null) =>
    set({
      chessGame: {
        status: 'success',
        statusTitle: '',
        statusSubtitle: '',
        data: getData(selected, pendingPromotion),
      },
    })

  const getIsPromotion = (from: string, to: string) => {
    const moves = chess.moves({ square: from as never, verbose: true }) as Array<{ to: string; promotion?: string }>
    return moves.some((move) => move.to === to && !!move.promotion)
  }

  return {
    chessGame: {
      status: 'loading',
      statusTitle: 'Preparing board',
      statusSubtitle: 'Please wait a moment.',
      data: null,
    },

    setChessInit: () => {
      chess.reset()
      updateGame(null)
    },

    setChessRestart: () => {
      chess.reset()
      updateGame(null)
    },

    setChessSelect: (square) => {
      const data = get().chessGame.data
      if (!data || data.isFinished || data.pendingPromotion) return

      const piece = chess.get(square as never)
      if (piece && piece.color === chess.turn()) {
        updateGame(data.selected === square ? null : square)
        return
      }
      updateGame(null)
    },

    setChessMove: (from, to, promotion) => {
      const data = get().chessGame.data
      if (!data || data.isFinished) return

      if (!promotion && getIsPromotion(from, to)) {
        updateGame(null, { from, to })
        return
      }

      try {
        chess.move({ from, to, promotion: promotion ?? 'q' })
      } catch {
        updateGame(null)
        return
      }
      updateGame(null)
    },

    setChessPromotion: (piece) => {
      const data = get().chessGame.data
      if (!data?.pendingPromotion) return
      const { from, to } = data.pendingPromotion
      try {
        chess.move({ from, to, promotion: piece })
      } catch {
        updateGame(null)
        return
      }
      updateGame(null)
    },

    setChessUndo: () => {
      const data = get().chessGame.data
      if (!data || !data.moveTotal) return
      // Undo mundur sampai giliran pemain lagi: langkah engine dan langkah pemain sebelumnya ikut dibatalkan.
      chess.undo()
      if (chess.turn() !== PLAYER_COLOR) chess.undo()
      updateGame(null)
    },
  }
})

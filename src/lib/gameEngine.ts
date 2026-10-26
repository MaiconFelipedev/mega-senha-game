import type { GameState, WordEntry } from '../types'

export type GameAction = 'correct' | 'wrong' | 'skip'

export function createGameState(words: readonly WordEntry[]): GameState {
  return {
    originalWords: [...words],
    queue: [...words],
    correct: [],
    wrong: [],
    skipCount: 0,
    ended: words.length === 0,
    endReason: words.length === 0 ? 'completed' : undefined,
  }
}

export function applyGameAction(state: GameState, action: GameAction, expectedWordId: string): GameState {
  const current = state.queue[0]
  if (state.ended || !current || current.id !== expectedWordId) return state

  if (action === 'skip') {
    return {
      ...state,
      queue: [...state.queue.slice(1), current],
      skipCount: state.skipCount + 1,
    }
  }

  const queue = state.queue.slice(1)
  const ended = queue.length === 0
  return {
    ...state,
    queue,
    correct: action === 'correct' ? [...state.correct, current] : state.correct,
    wrong: action === 'wrong' ? [...state.wrong, current] : state.wrong,
    ended,
    endReason: ended ? 'completed' : undefined,
  }
}

export function finishByTime(state: GameState): GameState {
  if (state.ended) return state
  return { ...state, ended: true, endReason: 'time' }
}

export function getPendingWords(state: GameState): WordEntry[] {
  return state.queue
}

import { beforeEach, describe, expect, it } from 'vitest'
import type { TrainingSessionResult } from '../types'
import { HISTORY_KEY } from './storage'
import { emptyTrainingWordHistory } from './trainingEngine'
import {
  TRAINING_HISTORY_KEY,
  clearTrainingHistory,
  defaultTrainingSettings,
  loadTrainingHistory,
  loadTrainingSettings,
  loadTrainingWordHistory,
  saveTrainingSession,
  saveTrainingSettings,
  saveTrainingWordHistory,
} from './trainingStorage'

const session: TrainingSessionResult = {
  id: 'treino-1',
  playedAt: '2026-10-27T12:00:00.000Z',
  settings: defaultTrainingSettings,
  correctCount: 0,
  skippedCount: 0,
  incorrectGuesses: 0,
  averageHintsPerCorrect: null,
  rounds: [],
}

describe('persistência do treinamento', () => {
  beforeEach(() => window.localStorage.clear())

  it('persiste configurações separadas', () => {
    saveTrainingSettings({ categories: ['animais', 'esportes'], difficulty: 'medio' })
    expect(loadTrainingSettings()).toEqual({ categories: ['animais', 'esportes'], difficulty: 'medio' })
  })

  it('salva e apaga apenas o histórico de treinamento', () => {
    window.localStorage.setItem(HISTORY_KEY, '[]')
    saveTrainingSession(session)
    expect(loadTrainingHistory()).toEqual([session])
    expect(window.localStorage.getItem(TRAINING_HISTORY_KEY)).not.toBeNull()
    clearTrainingHistory()
    expect(loadTrainingHistory()).toEqual([])
    expect(window.localStorage.getItem(HISTORY_KEY)).toBe('[]')
  })

  it('mantém o histórico de palavras após recarregar', () => {
    const firstWord = 'animais:facil:cachorro'
    saveTrainingWordHistory({ ...emptyTrainingWordHistory(), usedIds: [firstWord], recentIds: [firstWord] })
    expect(loadTrainingWordHistory().usedIds).toEqual([firstWord])
  })
})

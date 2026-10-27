import { describe, expect, it } from 'vitest'
import { wordsDatabase } from '../data/wordsDatabase'
import type { GameSettings } from '../types'
import { filterWords, getWordStatistics } from './wordStatistics'

const settings: GameSettings = {
  duration: 60,
  wordCount: 10,
  difficulty: 'facil',
  categories: ['animais'],
  allowFallback: false,
  soundEnabled: false,
}

describe('estatísticas de palavras', () => {
  it('reflete os filtros e o progresso persistido', () => {
    const animalIds = wordsDatabase.filter((word) => word.category === 'animais' && word.difficulty === 'facil').slice(0, 7).map((word) => word.id)
    const stats = getWordStatistics(settings, {
      version: 2,
      usedIds: animalIds,
      recentIds: animalIds,
      completedCycles: 0,
      updatedAt: new Date(0).toISOString(),
    })
    expect(stats).toEqual({ total: 70, used: 7, unused: 63, exploredPercent: 10 })
  })

  it('filtra pela união de categorias e pela dificuldade', () => {
    const filtered = filterWords({ ...settings, categories: ['animais', 'alimentos'] })
    expect(filtered).toHaveLength(140)
    expect(filtered.every((word) => ['animais', 'alimentos'].includes(word.category) && word.difficulty === 'facil')).toBe(true)
  })
})

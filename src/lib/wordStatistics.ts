import { wordsDatabase } from '../data/wordsDatabase'
import type { GameSettings, WordEntry } from '../types'
import type { WordHistoryState } from './wordHistory'

export interface WordStatistics {
  total: number
  used: number
  unused: number
  exploredPercent: number
}

export function filterWords(settings: GameSettings, database: readonly WordEntry[] = wordsDatabase): WordEntry[] {
  const selectedCategories = new Set(settings.categories)
  return database.filter((word) => {
    const categoryMatches = selectedCategories.has(word.category)
    const difficultyMatches = settings.difficulty === 'misturado' || word.difficulty === settings.difficulty
    return categoryMatches && difficultyMatches
  })
}

export function getWordStatistics(
  settings: GameSettings,
  history: WordHistoryState,
  database: readonly WordEntry[] = wordsDatabase,
): WordStatistics {
  const eligible = filterWords(settings, database)
  const usedIds = new Set(history.usedIds)
  const used = eligible.reduce((total, word) => total + Number(usedIds.has(word.id)), 0)
  return {
    total: eligible.length,
    used,
    unused: eligible.length - used,
    exploredPercent: eligible.length === 0 ? 0 : Math.round((used / eligible.length) * 100),
  }
}

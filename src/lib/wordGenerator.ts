import { wordsDatabase } from '../data/wordsDatabase'
import type { GameSettings, WordEntry } from '../types'
import type { WordHistoryState } from './wordHistory'
import { filterWords } from './wordStatistics'

export class InsufficientWordsError extends Error {
  constructor(public readonly available: number, public readonly requested: number) {
    super(`Há apenas ${available} palavras únicas disponíveis para esse filtro. Escolha menos palavras ou ative a complementação.`)
    this.name = 'InsufficientWordsError'
  }
}

export interface WordDrawPlan {
  words: WordEntry[]
  eligibleIds: string[]
  freshWords: number
  cycleStartsBeforeWordId?: string
}

export function fisherYates<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[selected]] = [shuffled[selected], shuffled[index]]
  }
  return shuffled
}

function prioritizeNotRecent(words: readonly WordEntry[], recentIds: Set<string>, random: () => number): WordEntry[] {
  const notRecent = fisherYates(words.filter((word) => !recentIds.has(word.id)), random)
  const recent = fisherYates(words.filter((word) => recentIds.has(word.id)), random)
  return [...notRecent, ...recent]
}

function getEligiblePool(settings: GameSettings, database: readonly WordEntry[]): WordEntry[] {
  if (settings.categories.length === 0) throw new InsufficientWordsError(0, settings.wordCount)
  const primary = filterWords(settings, database)
  if (primary.length >= settings.wordCount) return primary
  if (!settings.allowFallback) throw new InsufficientWordsError(primary.length, settings.wordCount)

  const primaryIds = new Set(primary.map((word) => word.id))
  const fallback = database.filter((word) => {
    if (primaryIds.has(word.id)) return false
    return settings.difficulty === 'misturado' || word.difficulty === settings.difficulty
  })
  const pool = [...primary, ...fallback]
  if (pool.length < settings.wordCount) throw new InsufficientWordsError(pool.length, settings.wordCount)
  return pool
}

export function createWordDrawPlan(
  settings: GameSettings,
  history: WordHistoryState,
  database: readonly WordEntry[] = wordsDatabase,
  random: () => number = Math.random,
): WordDrawPlan {
  const eligible = getEligiblePool(settings, database)
  const usedIds = new Set(history.usedIds)
  const recentIds = new Set(history.recentIds)
  const fresh = prioritizeNotRecent(eligible.filter((word) => !usedIds.has(word.id)), recentIds, random)

  if (fresh.length >= settings.wordCount) {
    return {
      words: fresh.slice(0, settings.wordCount),
      eligibleIds: eligible.map((word) => word.id),
      freshWords: settings.wordCount,
    }
  }

  const selectedFresh = fresh
  const selectedFreshIds = new Set(selectedFresh.map((word) => word.id))
  const recycledPool = eligible.filter((word) => !selectedFreshIds.has(word.id))
  const recycled = prioritizeNotRecent(recycledPool, recentIds, random).slice(0, settings.wordCount - selectedFresh.length)
  const words = [...selectedFresh, ...recycled]

  if (words.length < settings.wordCount) throw new InsufficientWordsError(words.length, settings.wordCount)
  return {
    words,
    eligibleIds: eligible.map((word) => word.id),
    freshWords: selectedFresh.length,
    cycleStartsBeforeWordId: recycled[0]?.id,
  }
}

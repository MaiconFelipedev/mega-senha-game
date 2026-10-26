import { migrateLegacyWordId, validWordIds } from '../data/wordsDatabase'

export const WORD_HISTORY_KEY = 'senha-rapida:word-history:v2'
const LEGACY_RECENT_WORDS_KEY = 'senha-rapida:recent-words:v1'
const MAX_RECENT_WORDS = 100

export interface WordHistoryState {
  version: 2
  usedIds: string[]
  recentIds: string[]
  completedCycles: number
  updatedAt: string
}

function emptyHistory(): WordHistoryState {
  return {
    version: 2,
    usedIds: [],
    recentIds: [],
    completedCycles: 0,
    updatedAt: new Date(0).toISOString(),
  }
}

function uniqueValidIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((id): id is string => typeof id === 'string')
    .map((id) => migrateLegacyWordId(id))
    .filter((id): id is string => id !== null && validWordIds.has(id)))]
}

function persistWordHistory(history: WordHistoryState): WordHistoryState {
  try {
    window.localStorage.setItem(WORD_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // O jogo continua em memória quando o armazenamento está indisponível.
  }
  return history
}

function migrateLegacyHistory(): WordHistoryState {
  try {
    const raw = window.localStorage.getItem(LEGACY_RECENT_WORDS_KEY)
    const migratedIds = uniqueValidIds(raw ? JSON.parse(raw) : [])
    const migrated = {
      ...emptyHistory(),
      usedIds: migratedIds,
      recentIds: migratedIds.slice(0, MAX_RECENT_WORDS),
      updatedAt: new Date().toISOString(),
    }
    if (migratedIds.length > 0) persistWordHistory(migrated)
    return migrated
  } catch {
    return emptyHistory()
  }
}

export function loadWordHistory(): WordHistoryState {
  try {
    const raw = window.localStorage.getItem(WORD_HISTORY_KEY)
    if (!raw) return migrateLegacyHistory()
    const parsed = JSON.parse(raw) as Partial<WordHistoryState>
    const sanitized: WordHistoryState = {
      version: 2,
      usedIds: uniqueValidIds(parsed.usedIds),
      recentIds: uniqueValidIds(parsed.recentIds).slice(0, MAX_RECENT_WORDS),
      completedCycles: Number.isSafeInteger(parsed.completedCycles) && Number(parsed.completedCycles) >= 0
        ? Number(parsed.completedCycles)
        : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
    return persistWordHistory(sanitized)
  } catch {
    return migrateLegacyHistory()
  }
}

export function markWordDisplayed(wordId: string, current = loadWordHistory()): WordHistoryState {
  if (!validWordIds.has(wordId)) return current
  const usedIds = current.usedIds.includes(wordId) ? current.usedIds : [...current.usedIds, wordId]
  const recentIds = [wordId, ...current.recentIds.filter((id) => id !== wordId)].slice(0, MAX_RECENT_WORDS)
  return persistWordHistory({ ...current, usedIds, recentIds, updatedAt: new Date().toISOString() })
}

export function beginWordCycle(eligibleIds: readonly string[], firstDisplayedId: string, current = loadWordHistory()): WordHistoryState {
  const eligible = new Set(eligibleIds.filter((id) => validWordIds.has(id)))
  const usedIds = current.usedIds.filter((id) => !eligible.has(id))
  const recentIds = [firstDisplayedId, ...current.recentIds.filter((id) => id !== firstDisplayedId)].slice(0, MAX_RECENT_WORDS)
  return persistWordHistory({
    ...current,
    usedIds: validWordIds.has(firstDisplayedId) ? [...usedIds, firstDisplayedId] : usedIds,
    recentIds,
    completedCycles: current.completedCycles + 1,
    updatedAt: new Date().toISOString(),
  })
}

export function resetWordHistory(): WordHistoryState {
  try {
    window.localStorage.removeItem(WORD_HISTORY_KEY)
    window.localStorage.removeItem(LEGACY_RECENT_WORDS_KEY)
  } catch {
    // O estado vazio ainda é devolvido para a sessão atual.
  }
  return emptyHistory()
}

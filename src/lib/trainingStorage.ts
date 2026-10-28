import { trainingWords } from '../data/trainingHints'
import {
  categories,
  difficulties,
  type Category,
  type DifficultyFilter,
  type TrainingSessionResult,
  type TrainingSettings,
} from '../types'
import { emptyTrainingWordHistory, type TrainingWordHistory } from './trainingEngine'

export const TRAINING_SETTINGS_KEY = 'senha-rapida:training-settings:v1'
export const TRAINING_HISTORY_KEY = 'senha-rapida:training-history:v1'
export const TRAINING_WORD_HISTORY_KEY = 'senha-rapida:training-word-history:v1'

export const defaultTrainingSettings: TrainingSettings = {
  difficulty: 'misturado',
  categories: [...categories],
}

const validCategories = new Set<string>(categories)
const validDifficulties = new Set<string>([...difficulties, 'misturado'])
const validTrainingWordIds = new Set(trainingWords.map(({ word }) => word.id))

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

export function normalizeTrainingSettings(value: unknown): TrainingSettings {
  const stored = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const selectedCategories = Array.isArray(stored.categories)
    ? [...new Set(stored.categories.filter(
      (category): category is Category => typeof category === 'string' && validCategories.has(category),
    ))]
    : [...defaultTrainingSettings.categories]

  return {
    difficulty: typeof stored.difficulty === 'string' && validDifficulties.has(stored.difficulty)
      ? stored.difficulty as DifficultyFilter
      : defaultTrainingSettings.difficulty,
    categories: selectedCategories,
  }
}

export function loadTrainingSettings(): TrainingSettings {
  return normalizeTrainingSettings(readJson<unknown>(TRAINING_SETTINGS_KEY, {}))
}

export function saveTrainingSettings(settings: TrainingSettings): void {
  window.localStorage.setItem(TRAINING_SETTINGS_KEY, JSON.stringify(settings))
}

export function loadTrainingHistory(): TrainingSessionResult[] {
  const value = readJson<unknown>(TRAINING_HISTORY_KEY, [])
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is TrainingSessionResult => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({ ...entry, settings: normalizeTrainingSettings(entry.settings) }))
}

export function saveTrainingSession(result: TrainingSessionResult): TrainingSessionResult[] {
  const history = [result, ...loadTrainingHistory()].slice(0, 100)
  window.localStorage.setItem(TRAINING_HISTORY_KEY, JSON.stringify(history))
  return history
}

export function clearTrainingHistory(): void {
  window.localStorage.removeItem(TRAINING_HISTORY_KEY)
}

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(
    (id): id is string => typeof id === 'string' && validTrainingWordIds.has(id),
  ))]
}

export function loadTrainingWordHistory(): TrainingWordHistory {
  const stored = readJson<Partial<TrainingWordHistory>>(TRAINING_WORD_HISTORY_KEY, {})
  return {
    version: 1,
    usedIds: sanitizeIds(stored.usedIds),
    recentIds: sanitizeIds(stored.recentIds).slice(0, 30),
    completedCycles: Number.isSafeInteger(stored.completedCycles) && Number(stored.completedCycles) >= 0
      ? Number(stored.completedCycles)
      : 0,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : new Date(0).toISOString(),
  }
}

export function saveTrainingWordHistory(history: TrainingWordHistory): TrainingWordHistory {
  window.localStorage.setItem(TRAINING_WORD_HISTORY_KEY, JSON.stringify(history))
  return history
}

export function resetTrainingWordHistory(): TrainingWordHistory {
  window.localStorage.removeItem(TRAINING_WORD_HISTORY_KEY)
  return emptyTrainingWordHistory()
}

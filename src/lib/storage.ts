import {
  categories,
  difficulties,
  type Category,
  type DifficultyFilter,
  type GameSettings,
  type MatchResult,
} from '../types'

export const SETTINGS_KEY = 'senha-rapida:settings:v1'
export const HISTORY_KEY = 'senha-rapida:history:v1'

export const defaultSettings: GameSettings = {
  duration: 60,
  wordCount: 10,
  difficulty: 'misturado',
  categories: [...categories],
  allowFallback: false,
  soundEnabled: true,
}

const validCategories = new Set<string>(categories)
const validDifficulties = new Set<string>([...difficulties, 'misturado'])
const validDurations = new Set([30, 60, 90, 120])
const validWordCounts = new Set([5, 10, 15, 20])

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadSettings(): GameSettings {
  return normalizeSettings(readJson<unknown>(SETTINGS_KEY, {}))
}

export function saveSettings(settings: GameSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function normalizeSettings(value: unknown): GameSettings {
  const stored = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  let selectedCategories: Category[]

  if (Array.isArray(stored.categories)) {
    selectedCategories = [...new Set(stored.categories.filter(
      (category): category is Category => typeof category === 'string' && validCategories.has(category),
    ))]
  } else if (stored.category === 'todas') {
    selectedCategories = [...categories]
  } else if (typeof stored.category === 'string' && validCategories.has(stored.category)) {
    selectedCategories = [stored.category as Category]
  } else {
    selectedCategories = [...defaultSettings.categories]
  }

  return {
    duration: validDurations.has(Number(stored.duration))
      ? Number(stored.duration) as GameSettings['duration']
      : defaultSettings.duration,
    wordCount: validWordCounts.has(Number(stored.wordCount))
      ? Number(stored.wordCount) as GameSettings['wordCount']
      : defaultSettings.wordCount,
    difficulty: typeof stored.difficulty === 'string' && validDifficulties.has(stored.difficulty)
      ? stored.difficulty as DifficultyFilter
      : defaultSettings.difficulty,
    categories: selectedCategories,
    allowFallback: typeof stored.allowFallback === 'boolean' ? stored.allowFallback : defaultSettings.allowFallback,
    soundEnabled: typeof stored.soundEnabled === 'boolean' ? stored.soundEnabled : defaultSettings.soundEnabled,
  }
}

export function loadHistory(): MatchResult[] {
  const history = readJson<unknown>(HISTORY_KEY, [])
  if (!Array.isArray(history)) return []
  return history
    .filter((entry): entry is MatchResult => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({ ...entry, settings: normalizeSettings(entry.settings) }))
}

export function saveMatch(result: MatchResult): MatchResult[] {
  const history = [result, ...loadHistory()].slice(0, 100)
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

export function clearHistory(): void {
  window.localStorage.removeItem(HISTORY_KEY)
}


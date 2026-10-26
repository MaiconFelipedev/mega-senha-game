import type { GameSettings, MatchResult } from '../types'

export const SETTINGS_KEY = 'senha-rapida:settings:v1'
export const HISTORY_KEY = 'senha-rapida:history:v1'

export const defaultSettings: GameSettings = {
  duration: 60,
  wordCount: 10,
  difficulty: 'misturado',
  category: 'todas',
  allowFallback: false,
  soundEnabled: true,
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadSettings(): GameSettings {
  return { ...defaultSettings, ...readJson<Partial<GameSettings>>(SETTINGS_KEY, {}) }
}

export function saveSettings(settings: GameSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadHistory(): MatchResult[] {
  const history = readJson<unknown>(HISTORY_KEY, [])
  return Array.isArray(history) ? (history as MatchResult[]) : []
}

export function saveMatch(result: MatchResult): MatchResult[] {
  const history = [result, ...loadHistory()].slice(0, 100)
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

export function clearHistory(): void {
  window.localStorage.removeItem(HISTORY_KEY)
}


export const categories = [
  'animais',
  'objetos',
  'alimentos',
  'profissoes',
  'lugares',
  'natureza',
  'esportes',
  'tecnologia',
  'cotidiano',
  'cultura_geral',
] as const

export const difficulties = ['facil', 'medio', 'dificil'] as const

export type Category = (typeof categories)[number]
export type CategoryFilter = Category | 'todas'
export type Difficulty = (typeof difficulties)[number]
export type DifficultyFilter = Difficulty | 'misturado'

export interface WordEntry {
  id: string
  text: string
  category: Category
  difficulty: Difficulty
}

export interface GameSettings {
  duration: 30 | 60 | 90 | 120
  wordCount: 5 | 10 | 15 | 20
  difficulty: DifficultyFilter
  category: CategoryFilter
  allowFallback: boolean
  soundEnabled: boolean
}

export interface GameState {
  originalWords: WordEntry[]
  queue: WordEntry[]
  correct: WordEntry[]
  wrong: WordEntry[]
  skipCount: number
  ended: boolean
  endReason?: 'time' | 'completed'
}

export interface MatchResult {
  id: string
  playedAt: string
  settings: GameSettings
  correct: WordEntry[]
  wrong: WordEntry[]
  pending: WordEntry[]
  total: number
  endReason: 'time' | 'completed'
}

export type Screen = 'home' | 'settings' | 'preparation' | 'game' | 'results' | 'how-to' | 'history'

export const categoryLabels: Record<CategoryFilter, string> = {
  todas: 'Todas',
  animais: 'Animais',
  objetos: 'Objetos',
  alimentos: 'Alimentos',
  profissoes: 'Profissões',
  lugares: 'Lugares',
  natureza: 'Natureza',
  esportes: 'Esportes',
  tecnologia: 'Tecnologia',
  cotidiano: 'Cotidiano',
  cultura_geral: 'Cultura geral',
}

export const difficultyLabels: Record<DifficultyFilter, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  misturado: 'Misturado',
}

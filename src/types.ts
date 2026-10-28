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
  categories: Category[]
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

export interface TrainingSettings {
  difficulty: DifficultyFilter
  categories: Category[]
}

export interface TrainingWord {
  word: WordEntry
  hints: readonly string[]
}

export interface TrainingRoundResult {
  word: WordEntry
  outcome: 'correct' | 'skipped'
  incorrectGuesses: number
  guessCount: number
  hintsUsed: number
}

export interface TrainingSessionResult {
  id: string
  playedAt: string
  settings: TrainingSettings
  correctCount: number
  skippedCount: number
  incorrectGuesses: number
  averageHintsPerCorrect: number | null
  rounds: TrainingRoundResult[]
}

export type Screen =
  | 'home'
  | 'settings'
  | 'preparation'
  | 'game'
  | 'results'
  | 'how-to'
  | 'history'
  | 'training-settings'
  | 'training'
  | 'training-results'
  | 'training-history'

export const categoryLabels: Record<Category, string> = {
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

export function formatCategorySelection(selectedCategories: readonly Category[]): string {
  if (selectedCategories.length === categories.length) return 'Todas'
  if (selectedCategories.length === 1) return categoryLabels[selectedCategories[0]]
  if (selectedCategories.length === 0) return 'Nenhuma'
  return `${selectedCategories.length} categorias`
}

export const difficultyLabels: Record<DifficultyFilter, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  misturado: 'Misturado',
}

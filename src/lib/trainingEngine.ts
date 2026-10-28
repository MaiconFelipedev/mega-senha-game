import { trainingWords } from '../data/trainingHints'
import type {
  TrainingRoundResult,
  TrainingSettings,
  TrainingWord,
} from '../types'

export interface TrainingWordHistory {
  version: 1
  usedIds: string[]
  recentIds: string[]
  completedCycles: number
  updatedAt: string
}

export interface TrainingWordDraw {
  trainingWord: TrainingWord
  history: TrainingWordHistory
  eligibleCount: number
  cycleRestarted: boolean
}

export interface HintProvider {
  getHints(wordId: string): readonly string[]
}

export class RegisteredHintProvider implements HintProvider {
  private readonly hintsByWordId: ReadonlyMap<string, readonly string[]>

  constructor(words: readonly TrainingWord[] = trainingWords) {
    this.hintsByWordId = new Map(words.map((entry) => [entry.word.id, entry.hints]))
  }

  getHints(wordId: string): readonly string[] {
    return this.hintsByWordId.get(wordId) ?? []
  }
}

export const registeredHintProvider = new RegisteredHintProvider()

export function emptyTrainingWordHistory(): TrainingWordHistory {
  return {
    version: 1,
    usedIds: [],
    recentIds: [],
    completedCycles: 0,
    updatedAt: new Date(0).toISOString(),
  }
}

export function filterTrainingWords(
  settings: TrainingSettings,
  database: readonly TrainingWord[] = trainingWords,
): TrainingWord[] {
  const selectedCategories = new Set(settings.categories)
  return database.filter(({ word }) => (
    selectedCategories.has(word.category)
    && (settings.difficulty === 'misturado' || word.difficulty === settings.difficulty)
  ))
}

export class NoTrainingWordsError extends Error {
  constructor() {
    super('Ainda não há palavras de treinamento para os filtros selecionados. Escolha outra categoria ou dificuldade.')
    this.name = 'NoTrainingWordsError'
  }
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

export function drawTrainingWord(
  settings: TrainingSettings,
  history: TrainingWordHistory,
  database: readonly TrainingWord[] = trainingWords,
  random: () => number = Math.random,
): TrainingWordDraw {
  const eligible = filterTrainingWords(settings, database)
  if (eligible.length === 0) throw new NoTrainingWordsError()

  const usedIds = new Set(history.usedIds)
  const recentIds = new Set(history.recentIds)
  let candidates = eligible.filter(({ word }) => !usedIds.has(word.id))
  let cycleRestarted = false
  let retainedUsedIds = history.usedIds

  if (candidates.length === 0) {
    const eligibleIds = new Set(eligible.map(({ word }) => word.id))
    retainedUsedIds = history.usedIds.filter((id) => !eligibleIds.has(id))
    candidates = eligible
    cycleRestarted = true
  }

  const notRecent = candidates.filter(({ word }) => !recentIds.has(word.id))
  const selected = pick(notRecent.length > 0 ? notRecent : candidates, random)
  const nextHistory: TrainingWordHistory = {
    version: 1,
    usedIds: [...new Set([...retainedUsedIds, selected.word.id])],
    recentIds: [selected.word.id, ...history.recentIds.filter((id) => id !== selected.word.id)].slice(0, 30),
    completedCycles: history.completedCycles + (cycleRestarted ? 1 : 0),
    updatedAt: new Date().toISOString(),
  }

  return {
    trainingWord: selected,
    history: nextHistory,
    eligibleCount: eligible.length,
    cycleRestarted,
  }
}

export function normalizeTrainingAnswer(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('pt-BR')
}

export function isCorrectTrainingAnswer(guess: string, answer: string): boolean {
  const normalizedGuess = normalizeTrainingAnswer(guess)
  return normalizedGuess.length > 0 && normalizedGuess === normalizeTrainingAnswer(answer)
}

export function calculateTrainingSummary(rounds: readonly TrainingRoundResult[]) {
  const correctRounds = rounds.filter((round) => round.outcome === 'correct')
  const skippedCount = rounds.filter((round) => round.outcome === 'skipped').length
  const incorrectGuesses = rounds.reduce((total, round) => total + round.incorrectGuesses, 0)
  const hintsForCorrect = correctRounds.reduce((total, round) => total + round.hintsUsed, 0)

  return {
    correctCount: correctRounds.length,
    skippedCount,
    incorrectGuesses,
    averageHintsPerCorrect: correctRounds.length > 0 ? hintsForCorrect / correctRounds.length : null,
  }
}

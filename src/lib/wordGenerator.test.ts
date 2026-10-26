import { describe, expect, it } from 'vitest'
import type { GameSettings, WordEntry } from '../types'
import type { WordHistoryState } from './wordHistory'
import { createWordDrawPlan, InsufficientWordsError } from './wordGenerator'

const settings: GameSettings = {
  duration: 60,
  wordCount: 5,
  difficulty: 'facil',
  category: 'animais',
  allowFallback: false,
  soundEnabled: false,
}

const database: WordEntry[] = Array.from({ length: 12 }, (_, index) => ({
  id: `animal-${index}`,
  text: `ANIMAL ${index}`,
  category: 'animais',
  difficulty: index < 10 ? 'facil' : 'medio',
}))

function history(usedIds: string[] = [], recentIds: string[] = usedIds): WordHistoryState {
  return { version: 2, usedIds, recentIds, completedCycles: 0, updatedAt: new Date(0).toISOString() }
}

describe('gerador inteligente', () => {
  it('não repete palavras dentro da mesma partida', () => {
    const plan = createWordDrawPlan(settings, history(), database, () => 0.37)
    expect(new Set(plan.words.map((word) => word.id)).size).toBe(5)
  })

  it('não repete entre partidas enquanto houver inéditas', () => {
    const first = createWordDrawPlan(settings, history(), database, () => 0.24)
    const second = createWordDrawPlan(settings, history(first.words.map((word) => word.id)), database, () => 0.24)
    expect(second.words.every((word) => !first.words.some((previous) => previous.id === word.id))).toBe(true)
  })

  it('respeita categoria e dificuldade', () => {
    const plan = createWordDrawPlan(settings, history(), database, () => 0.5)
    expect(plan.words.every((word) => word.category === 'animais' && word.difficulty === 'facil')).toBe(true)
  })

  it('usa todas as inéditas antes de iniciar um novo ciclo', () => {
    const eligible = database.filter((word) => word.difficulty === 'facil')
    const unusedIds = eligible.slice(8).map((word) => word.id)
    const plan = createWordDrawPlan(settings, history(eligible.slice(0, 8).map((word) => word.id)), database, () => 0.19)
    expect(plan.freshWords).toBe(2)
    expect(plan.words.slice(0, 2).map((word) => word.id).sort()).toEqual(unusedIds.sort())
    expect(plan.cycleStartsBeforeWordId).toBe(plan.words[2].id)
  })

  it('evita palavras recentes no começo de um novo ciclo quando há alternativas', () => {
    const eligible = database.filter((word) => word.difficulty === 'facil')
    const recentIds = eligible.slice(0, 3).map((word) => word.id)
    const plan = createWordDrawPlan(settings, history(eligible.map((word) => word.id), recentIds), database, () => 0.41)
    expect(plan.words.slice(0, 5).every((word) => !recentIds.includes(word.id))).toBe(true)
  })

  it('informa conjuntos pequenos sem entrar em loop', () => {
    expect(() => createWordDrawPlan(settings, history(), database.slice(0, 4), () => 0.5)).toThrow(InsufficientWordsError)
  })
})

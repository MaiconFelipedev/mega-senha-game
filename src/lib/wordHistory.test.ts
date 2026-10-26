import { beforeEach, describe, expect, it } from 'vitest'
import { wordsDatabase } from '../data/wordsDatabase'
import { HISTORY_KEY } from './storage'
import { createWordDrawPlan } from './wordGenerator'
import { beginWordCycle, loadWordHistory, markWordDisplayed, resetWordHistory, WORD_HISTORY_KEY } from './wordHistory'
import type { GameSettings } from '../types'

const settings: GameSettings = {
  duration: 60,
  wordCount: 5,
  difficulty: 'misturado',
  category: 'todas',
  allowFallback: false,
  soundEnabled: false,
}

describe('histórico persistente de palavras', () => {
  beforeEach(() => window.localStorage.clear())

  it('persiste palavras exibidas após uma nova leitura da página', () => {
    const word = wordsDatabase[0]
    markWordDisplayed(word.id)
    expect(loadWordHistory().usedIds).toContain(word.id)
  })

  it('não marca palavras apenas reservadas e preserva as não exibidas', () => {
    const plan = createWordDrawPlan(settings, loadWordHistory(), wordsDatabase, () => 0.33)
    markWordDisplayed(plan.words[0].id)
    const persisted = loadWordHistory()
    expect(persisted.usedIds).toContain(plan.words[0].id)
    expect(plan.words.slice(1).every((word) => !persisted.usedIds.includes(word.id))).toBe(true)
  })

  it('inicia um ciclo removendo somente o conjunto elegível', () => {
    const eligible = wordsDatabase.slice(0, 5)
    const outside = wordsDatabase[500]
    let current = loadWordHistory()
    for (const word of [...eligible, outside]) current = markWordDisplayed(word.id, current)
    const renewed = beginWordCycle(eligible.map((word) => word.id), eligible[0].id, current)
    expect(renewed.usedIds).toContain(eligible[0].id)
    expect(renewed.usedIds).not.toContain(eligible[1].id)
    expect(renewed.usedIds).toContain(outside.id)
    expect(renewed.completedCycles).toBe(1)
  })

  it('limpa registros inválidos depois de alterações no banco', () => {
    window.localStorage.setItem(WORD_HISTORY_KEY, JSON.stringify({
      version: 2,
      usedIds: [wordsDatabase[0].id, 'id-inexistente'],
      recentIds: ['id-inexistente'],
      completedCycles: -5,
    }))
    const sanitized = loadWordHistory()
    expect(sanitized.usedIds).toEqual([wordsDatabase[0].id])
    expect(sanitized.recentIds).toEqual([])
    expect(sanitized.completedCycles).toBe(0)
  })

  it('migra identificadores do controle antigo', () => {
    window.localStorage.setItem('senha-rapida:recent-words:v1', JSON.stringify(['animais-facil-1']))
    expect(loadWordHistory().usedIds).toEqual([wordsDatabase.find((word) => word.text === 'CACHORRO')?.id])
  })

  it('reinicia palavras sem apagar o histórico de resultados', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([{ id: 'resultado-preservado' }]))
    markWordDisplayed(wordsDatabase[0].id)
    resetWordHistory()
    expect(loadWordHistory().usedIds).toEqual([])
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]')).toEqual([{ id: 'resultado-preservado' }])
  })
})

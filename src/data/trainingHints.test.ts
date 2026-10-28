import { describe, expect, it } from 'vitest'
import { wordsDatabase } from './wordsDatabase'
import { TRAINING_WORD_COUNT, trainingWords } from './trainingHints'
import { categories, difficulties } from '../types'
import { normalizeTrainingAnswer } from '../lib/trainingEngine'

describe('banco de dicas do treinamento', () => {
  it('possui 150 palavras e pelo menos cinco por categoria e dificuldade', () => {
    expect(TRAINING_WORD_COUNT).toBe(150)
    for (const category of categories) {
      for (const difficulty of difficulties) {
        expect(trainingWords.filter(({ word }) => word.category === category && word.difficulty === difficulty)).toHaveLength(5)
      }
    }
  })

  it('usa palavras do banco principal e dicas únicas de uma palavra', () => {
    const databaseIds = new Set(wordsDatabase.map((word) => word.id))
    for (const entry of trainingWords) {
      expect(databaseIds.has(entry.word.id), entry.word.text).toBe(true)
      expect(entry.hints.length).toBeGreaterThanOrEqual(3)
      expect(entry.hints.length).toBeLessThanOrEqual(5)
      expect(new Set(entry.hints.map(normalizeTrainingAnswer)).size).toBe(entry.hints.length)
      for (const hint of entry.hints) {
        expect(hint.trim()).toMatch(/^\S+$/)
        expect(normalizeTrainingAnswer(hint)).not.toBe(normalizeTrainingAnswer(entry.word.text))
      }
    }
  })
})

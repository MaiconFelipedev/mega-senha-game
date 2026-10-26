import { describe, expect, it } from 'vitest'
import { WORD_DATABASE_SIZE, wordsDatabase } from './wordsDatabase'
import { categories, difficulties } from '../types'
import { normalizeWord } from './wordId'

describe('banco de palavras', () => {
  it('contém pelo menos 800 palavras reais estruturadas', () => {
    expect(WORD_DATABASE_SIZE).toBeGreaterThanOrEqual(2000)
    expect(wordsDatabase).toHaveLength(2100)
  })

  it('não contém palavras nem identificadores repetidos', () => {
    const normalizedWords = wordsDatabase.map((word) => normalizeWord(word.text))
    const duplicatedWords = normalizedWords.filter((word, index) => normalizedWords.indexOf(word) !== index)
    expect(duplicatedWords).toEqual([])
    expect(new Set(wordsDatabase.map((word) => word.id)).size).toBe(wordsDatabase.length)
  })

  it('mantém 70 palavras por categoria e dificuldade', () => {
    for (const category of categories) {
      for (const difficulty of difficulties) {
        expect(wordsDatabase.filter((word) => word.category === category && word.difficulty === difficulty)).toHaveLength(70)
      }
    }
  })
})

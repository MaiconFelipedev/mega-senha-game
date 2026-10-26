import { describe, expect, it } from 'vitest'
import type { GameSettings } from '../types'
import { drawWords, fisherYates } from './drawWords'

const settings: GameSettings = {
  duration: 60,
  wordCount: 20,
  difficulty: 'misturado',
  category: 'todas',
  allowFallback: false,
  soundEnabled: false,
}

describe('sorteio de palavras', () => {
  it('sorteia sem repetição', () => {
    const words = drawWords(settings, [], () => 0.42)
    expect(words).toHaveLength(20)
    expect(new Set(words.map((word) => word.id)).size).toBe(20)
  })

  it('prioriza palavras não usadas na rodada anterior', () => {
    const first = drawWords(settings, [], () => 0.31)
    const second = drawWords(settings, first.map((word) => word.id), () => 0.31)
    expect(second.every((word) => !first.some((recent) => recent.id === word.id))).toBe(true)
  })

  it('o Fisher-Yates preserva todos os elementos', () => {
    const original = [1, 2, 3, 4, 5]
    const shuffled = fisherYates(original, () => 0.2)
    expect(shuffled).toHaveLength(original.length)
    expect([...shuffled].sort()).toEqual(original)
    expect(original).toEqual([1, 2, 3, 4, 5])
  })
})

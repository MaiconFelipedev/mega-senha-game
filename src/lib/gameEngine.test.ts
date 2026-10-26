import { describe, expect, it } from 'vitest'
import type { WordEntry } from '../types'
import { applyGameAction, createGameState, finishByTime, getPendingWords } from './gameEngine'

const words: WordEntry[] = [
  { id: '1', text: 'CASA', category: 'cotidiano', difficulty: 'facil' },
  { id: '2', text: 'AVIÃO', category: 'objetos', difficulty: 'facil' },
  { id: '3', text: 'LIVRO', category: 'objetos', difficulty: 'facil' },
]

describe('motor da partida', () => {
  it('registra acerto, soma ponto e remove a palavra', () => {
    const result = applyGameAction(createGameState(words), 'correct', '1')
    expect(result.correct.map((word) => word.id)).toEqual(['1'])
    expect(result.queue.map((word) => word.id)).toEqual(['2', '3'])
  })

  it('registra erro e descarta sem pontuar', () => {
    const result = applyGameAction(createGameState(words), 'wrong', '1')
    expect(result.wrong.map((word) => word.id)).toEqual(['1'])
    expect(result.correct).toHaveLength(0)
    expect(result.queue.map((word) => word.id)).toEqual(['2', '3'])
  })

  it('coloca uma palavra pulada no final da fila', () => {
    const result = applyGameAction(createGameState(words), 'skip', '1')
    expect(result.queue.map((word) => word.id)).toEqual(['2', '3', '1'])
    expect(result.skipCount).toBe(1)
  })

  it('continua a rodada quando todas as palavras restantes são puladas', () => {
    let state = createGameState(words.slice(0, 2))
    state = applyGameAction(state, 'skip', '1')
    state = applyGameAction(state, 'skip', '2')
    expect(state.queue.map((word) => word.id)).toEqual(['1', '2'])
    expect(state.ended).toBe(false)
    expect(state.skipCount).toBe(2)
  })

  it('encerra por tempo e mantém as palavras pendentes', () => {
    const state = finishByTime(createGameState(words))
    expect(state.ended).toBe(true)
    expect(state.endReason).toBe('time')
    expect(getPendingWords(state)).toEqual(words)
  })

  it('encerra por esgotamento das palavras', () => {
    let state = createGameState(words.slice(0, 2))
    state = applyGameAction(state, 'correct', '1')
    state = applyGameAction(state, 'wrong', '2')
    expect(state.ended).toBe(true)
    expect(state.endReason).toBe('completed')
    expect(state.queue).toHaveLength(0)
  })

  it('bloqueia clique duplicado com o identificador da palavra anterior', () => {
    const firstClick = applyGameAction(createGameState(words), 'correct', '1')
    const duplicateClick = applyGameAction(firstClick, 'correct', '1')
    expect(duplicateClick).toBe(firstClick)
    expect(duplicateClick.correct).toHaveLength(1)
    expect(duplicateClick.queue[0].id).toBe('2')
  })
})

import { describe, expect, it } from 'vitest'
import type { TrainingRoundResult, TrainingSettings, TrainingWord } from '../types'
import {
  calculateTrainingSummary,
  drawTrainingWord,
  emptyTrainingWordHistory,
  filterTrainingWords,
  isCorrectTrainingAnswer,
  RegisteredHintProvider,
} from './trainingEngine'

const settings: TrainingSettings = { categories: ['animais'], difficulty: 'facil' }

describe('motor do treinamento', () => {
  it('respeita categorias e dificuldade no filtro e no sorteio', () => {
    const eligible = filterTrainingWords(settings)
    expect(eligible).toHaveLength(5)
    expect(eligible.every(({ word }) => word.category === 'animais' && word.difficulty === 'facil')).toBe(true)

    const draw = drawTrainingWord(settings, emptyTrainingWordHistory(), undefined, () => 0)
    expect(draw.trainingWord.word.text).toBe('CACHORRO')
    expect(draw.history.usedIds).toEqual([draw.trainingWord.word.id])
  })

  it('não repete enquanto há palavras inéditas e reinicia o ciclo ao esgotar', () => {
    let history = emptyTrainingWordHistory()
    const seen = new Set<string>()
    for (let index = 0; index < 5; index += 1) {
      const draw = drawTrainingWord(settings, history, undefined, () => 0)
      seen.add(draw.trainingWord.word.id)
      history = draw.history
    }
    expect(seen.size).toBe(5)

    const restarted = drawTrainingWord(settings, history, undefined, () => 0)
    expect(restarted.cycleRestarted).toBe(true)
    expect(restarted.history.completedCycles).toBe(1)
  })

  it('expõe dicas cadastradas em ordem e bloqueia palavras desconhecidas', () => {
    const sample: TrainingWord = {
      word: { id: 'aviao', text: 'AVIÃO', category: 'objetos', difficulty: 'facil' },
      hints: ['Transporte', 'Aéreo', 'Piloto'],
    }
    const provider = new RegisteredHintProvider([sample])
    expect(provider.getHints('aviao')).toEqual(['Transporte', 'Aéreo', 'Piloto'])
    expect(provider.getHints('inexistente')).toEqual([])
  })

  it('valida sem diferenciar acentos, maiúsculas ou espaços externos', () => {
    expect(isCorrectTrainingAnswer('  aviao ', 'AVIÃO')).toBe(true)
    expect(isCorrectTrainingAnswer('Avião', 'AVIÃO')).toBe(true)
    expect(isCorrectTrainingAnswer('helicóptero', 'AVIÃO')).toBe(false)
    expect(isCorrectTrainingAnswer('   ', 'AVIÃO')).toBe(false)
  })

  it('calcula estatísticas e evita divisão por zero', () => {
    const word = { id: '1', text: 'AVIÃO', category: 'objetos', difficulty: 'facil' } as const
    const rounds: TrainingRoundResult[] = [
      { word, outcome: 'correct', incorrectGuesses: 2, guessCount: 3, hintsUsed: 3 },
      { word, outcome: 'correct', incorrectGuesses: 0, guessCount: 1, hintsUsed: 1 },
      { word, outcome: 'skipped', incorrectGuesses: 1, guessCount: 1, hintsUsed: 2 },
    ]
    expect(calculateTrainingSummary(rounds)).toEqual({
      correctCount: 2,
      skippedCount: 1,
      incorrectGuesses: 3,
      averageHintsPerCorrect: 2,
    })
    expect(calculateTrainingSummary([]).averageHintsPerCorrect).toBeNull()
  })
})

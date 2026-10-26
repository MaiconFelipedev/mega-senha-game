import { beforeEach, describe, expect, it } from 'vitest'
import type { MatchResult } from '../types'
import { clearHistory, defaultSettings, loadHistory, saveMatch } from './storage'

const match: MatchResult = {
  id: 'partida-1',
  playedAt: '2026-10-26T12:00:00.000Z',
  settings: defaultSettings,
  correct: [{ id: '1', text: 'CASA', category: 'cotidiano', difficulty: 'facil' }],
  wrong: [],
  pending: [],
  total: 1,
  endReason: 'completed',
}

describe('persistência do histórico', () => {
  beforeEach(() => window.localStorage.clear())

  it('salva e recupera partidas', () => {
    saveMatch(match)
    expect(loadHistory()).toEqual([match])
  })

  it('apaga todos os registros', () => {
    saveMatch(match)
    clearHistory()
    expect(loadHistory()).toEqual([])
  })
})

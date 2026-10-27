import { beforeEach, describe, expect, it } from 'vitest'
import type { MatchResult } from '../types'
import { SETTINGS_KEY, clearHistory, defaultSettings, loadHistory, loadSettings, saveMatch, saveSettings } from './storage'

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

  it('persiste e recupera múltiplas categorias', () => {
    const settings = { ...defaultSettings, categories: ['animais', 'alimentos', 'esportes'] as const }
    saveSettings({ ...settings, categories: [...settings.categories] })
    expect(loadSettings().categories).toEqual(['animais', 'alimentos', 'esportes'])
  })

  it('preserva uma seleção vazia para permitir a validação da interface', () => {
    saveSettings({ ...defaultSettings, categories: [] })
    expect(loadSettings().categories).toEqual([])
  })

  it('migra preferências antigas de categoria única', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, categories: undefined, category: 'alimentos' }))
    expect(loadSettings().categories).toEqual(['alimentos'])
  })

  it('migra a preferência antiga de todas as categorias', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, categories: undefined, category: 'todas' }))
    expect(loadSettings().categories).toEqual(defaultSettings.categories)
  })
})

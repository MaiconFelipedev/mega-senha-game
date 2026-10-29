import { describe, expect, it } from 'vitest'
import {
  normalizeOnlineText,
  normalizeRoomCode,
  sanitizeNickname,
  validateGuess,
  validateHint,
  validateNickname,
  validateRoomCode,
} from './validation'

describe('validações do modo online', () => {
  it('normaliza apelidos e códigos de convite', () => {
    expect(sanitizeNickname('  Maria   Silva  ')).toBe('Maria Silva')
    expect(normalizeRoomCode(' k7m4-p9q2 ')).toBe('K7M4P9Q2')
    expect(validateNickname('M')).toMatch(/pelo menos 2/i)
    expect(validateNickname('Maria')).toBeNull()
    expect(validateRoomCode('K7M4P9Q2')).toBeNull()
    expect(validateRoomCode('ABC')).toMatch(/8 caracteres/i)
  })

  it('compara texto sem diferenciar caixa ou acentos', () => {
    expect(normalizeOnlineText('  AVIÃO  ')).toBe('aviao')
    expect(normalizeOnlineText('Pão   de queijo')).toBe('pao de queijo')
  })

  it('aceita apenas dicas de uma palavra e bloqueia a resposta', () => {
    expect(validateHint('Aéreo', 'AVIÃO')).toBeNull()
    expect(validateHint('asa delta', 'AVIÃO')).toMatch(/somente uma palavra/i)
    expect(validateHint('avião', 'AVIÃO')).toMatch(/revelar a resposta/i)
    expect(validateHint('aviãozinho', 'AVIÃO')).toMatch(/variação direta/i)
  })

  it('limita mensagens vazias e muito longas', () => {
    expect(validateGuess('   ')).toMatch(/digite um palpite/i)
    expect(validateGuess('a'.repeat(65))).toMatch(/64 caracteres/i)
    expect(validateGuess('carro')).toBeNull()
  })
})

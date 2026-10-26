import type { Category, Difficulty } from '../types'

export function normalizeWord(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createWordId(category: Category, difficulty: Difficulty, text: string): string {
  return `${category}:${difficulty}:${normalizeWord(text)}`
}

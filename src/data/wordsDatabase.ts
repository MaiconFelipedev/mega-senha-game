import type { WordEntry } from '../types'
import { additionalWords } from './additionalWords'
import { coreWordBank, legacyWordIdMap } from './wordBank'

export const wordsDatabase: WordEntry[] = [...coreWordBank, ...additionalWords]
export const WORD_DATABASE_SIZE = wordsDatabase.length
export const validWordIds = new Set(wordsDatabase.map((word) => word.id))

export function migrateLegacyWordId(id: string): string | null {
  if (validWordIds.has(id)) return id
  return legacyWordIdMap.get(id) ?? null
}

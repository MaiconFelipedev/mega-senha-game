import type { GameSettings, WordEntry } from '../types'
import { createWordDrawPlan, fisherYates, InsufficientWordsError } from './wordGenerator'

export { fisherYates, InsufficientWordsError }

export function drawWords(
  settings: GameSettings,
  recentWordIds: readonly string[] = [],
  random: () => number = Math.random,
): WordEntry[] {
  return createWordDrawPlan(settings, {
    version: 2,
    usedIds: [...recentWordIds],
    recentIds: [...recentWordIds],
    completedCycles: 0,
    updatedAt: new Date(0).toISOString(),
  }, undefined, random).words
}

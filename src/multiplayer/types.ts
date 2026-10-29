import type { Category, DifficultyFilter } from '../types'

export type OnlineRoomStatus = 'waiting' | 'playing' | 'finished' | 'cancelled' | 'expired'
export type OnlineRole = 'giver' | 'guesser'
export type OnlineConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'
export type OnlineMessageKind = 'hint' | 'guess' | 'system' | 'correct' | 'error' | 'request_hint'
export type OnlineWordOutcome = 'correct' | 'skipped'

export interface OnlineSettings {
  wordCount: 5 | 10 | 15 | 20
  categories: Category[]
  difficulty: DifficultyFilter
}

export interface OnlineRoom {
  id: string
  code: string
  status: OnlineRoomStatus
  ownerParticipantId: string
  settings: OnlineSettings
  score: number
  createdAt: string
  expiresAt: string
}

export interface OnlineParticipant {
  id: string
  nickname: string
  role: OnlineRole
  seat: 1 | 2
  ready: boolean
  connected: boolean
  isMe: boolean
}

export interface OnlineGame {
  id: string
  status: 'playing' | 'finished' | 'cancelled'
  currentPosition: number
  totalWords: number
  score: number
  secretWord: string | null
  startedAt: string
  finishedAt: string | null
}

export interface OnlineMessage {
  id: string
  kind: OnlineMessageKind
  body: string
  senderParticipantId: string | null
  senderNickname: string | null
  createdAt: string
}

export interface OnlineResolvedWord {
  position: number
  word: string
  outcome: OnlineWordOutcome
}

export interface OnlineRoomSnapshot {
  room: OnlineRoom
  me: OnlineParticipant
  participants: OnlineParticipant[]
  game: OnlineGame | null
  messages: OnlineMessage[]
  resolvedWords: OnlineResolvedWord[]
}

export interface OnlineActionResult {
  snapshot: OnlineRoomSnapshot
}

export interface OnlineSessionReference {
  roomId: string
  code: string
}

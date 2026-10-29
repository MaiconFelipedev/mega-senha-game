import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Category, DifficultyFilter } from '../types'
import { ensureAnonymousSession, getSupabaseClient } from './client'
import type { OnlineRoomSnapshot, OnlineSessionReference, OnlineSettings } from './types'

const SESSION_STORAGE_KEY = 'senha-rapida:online-session:v1'

function assertSnapshot(value: unknown): OnlineRoomSnapshot {
  if (!value || typeof value !== 'object' || !('room' in value) || !('me' in value)) {
    throw new Error('O servidor retornou um estado de sala inválido.')
  }
  return value as OnlineRoomSnapshot
}

function translateServerError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error)
  const knownErrors: Record<string, string> = {
    invalid_nickname: 'Escolha um apelido válido com até 24 caracteres.',
    invalid_code: 'Digite um código de sala válido.',
    room_not_found: 'Sala não encontrada. Confira o código do convite.',
    room_expired: 'Esta sala expirou por inatividade.',
    room_full: 'Esta sala já possui dois participantes.',
    room_started: 'A partida desta sala já começou.',
    too_many_join_attempts: 'Muitas tentativas de entrada. Aguarde alguns minutos e tente novamente.',
    not_room_member: 'Sua sessão não faz parte desta sala.',
    not_room_owner: 'Somente o criador pode alterar esta configuração.',
    participants_not_ready: 'Os dois jogadores precisam estar conectados e prontos.',
    not_enough_words: 'Não há palavras suficientes para esses filtros.',
    invalid_hint: 'Envie uma dica válida contendo somente uma palavra.',
    forbidden_hint: 'A dica não pode revelar a resposta nem uma variação direta dela.',
    invalid_guess: 'Envie um palpite válido.',
    action_rate_limited: 'Você está enviando ações rápido demais. Aguarde um instante.',
    not_giver: 'Somente o fornecedor de dicas pode realizar esta ação.',
    not_guesser: 'Somente o adivinhador pode realizar esta ação.',
    game_not_active: 'A partida não está ativa.',
    room_not_finished: 'A rodada ainda não terminou.',
  }
  const matched = Object.keys(knownErrors).find((code) => message.includes(code))
  return new Error(matched ? knownErrors[matched] : message)
}

async function rpcSnapshot(functionName: string, params: Record<string, unknown>, captchaToken?: string): Promise<OnlineRoomSnapshot> {
  try {
    await ensureAnonymousSession(captchaToken)
    const { data, error } = await getSupabaseClient().rpc(functionName, params)
    if (error) throw error
    return assertSnapshot(data)
  } catch (error) {
    throw translateServerError(error)
  }
}

export async function createOnlineRoom(nickname: string, settings: OnlineSettings, captchaToken?: string) {
  return rpcSnapshot('create_online_room', {
    p_nickname: nickname,
    p_word_count: settings.wordCount,
    p_categories: settings.categories,
    p_difficulty: settings.difficulty,
  }, captchaToken)
}

export async function joinOnlineRoom(code: string, nickname: string, captchaToken?: string) {
  return rpcSnapshot('join_online_room', { p_code: code, p_nickname: nickname }, captchaToken)
}

export async function getOnlineRoomState(roomId: string) {
  return rpcSnapshot('get_online_room_state', { p_room_id: roomId })
}

export async function setOnlineReady(roomId: string, ready: boolean) {
  return rpcSnapshot('set_online_ready', { p_room_id: roomId, p_ready: ready })
}

export async function updateOnlineSettings(
  roomId: string,
  wordCount: OnlineSettings['wordCount'],
  categories: Category[],
  difficulty: DifficultyFilter,
) {
  return rpcSnapshot('update_online_room_settings', {
    p_room_id: roomId,
    p_word_count: wordCount,
    p_categories: categories,
    p_difficulty: difficulty,
  })
}

export async function startOnlineGame(roomId: string) {
  return rpcSnapshot('start_online_game', { p_room_id: roomId })
}

export async function sendOnlineHint(roomId: string, hint: string, clientActionId: string) {
  return rpcSnapshot('send_online_hint', {
    p_room_id: roomId,
    p_hint: hint,
    p_client_action_id: clientActionId,
  })
}

export async function sendOnlineGuess(roomId: string, guess: string, clientActionId: string) {
  return rpcSnapshot('send_online_guess', {
    p_room_id: roomId,
    p_guess: guess,
    p_client_action_id: clientActionId,
  })
}

export async function requestOnlineHint(roomId: string, clientActionId: string) {
  return rpcSnapshot('request_online_hint', { p_room_id: roomId, p_client_action_id: clientActionId })
}

export async function skipOnlineWord(roomId: string, clientActionId: string) {
  return rpcSnapshot('skip_online_word', { p_room_id: roomId, p_client_action_id: clientActionId })
}

export async function leaveOnlineRoom(roomId: string) {
  try {
    await ensureAnonymousSession()
    const { error } = await getSupabaseClient().rpc('leave_online_room', { p_room_id: roomId })
    if (error) throw error
  } catch (error) {
    throw translateServerError(error)
  }
}

export async function prepareOnlineRematch(roomId: string, invertRoles: boolean) {
  return rpcSnapshot('prepare_online_rematch', { p_room_id: roomId, p_invert_roles: invertRoles })
}

export async function touchOnlineParticipant(roomId: string) {
  return rpcSnapshot('touch_online_participant', { p_room_id: roomId })
}

export function saveOnlineSession(reference: OnlineSessionReference) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(reference))
}

export function loadOnlineSession(): OnlineSessionReference | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<OnlineSessionReference>
    if (typeof value.roomId !== 'string' || typeof value.code !== 'string') return null
    return { roomId: value.roomId, code: value.code }
  } catch {
    return null
  }
}

export function clearOnlineSession() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

export async function subscribeToOnlineRoom(
  roomId: string,
  onChange: () => void,
  onStatus: (status: string) => void,
): Promise<RealtimeChannel> {
  await ensureAnonymousSession()
  const supabase = getSupabaseClient()
  const filter = `room_id=eq.${roomId}`
  const channel = supabase
    .channel(`room:${roomId}`, { config: { private: true } })
    .on('broadcast', { event: 'room_changed' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_rooms', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_participants', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_games', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_messages', filter }, onChange)
    .subscribe((status) => onStatus(status))
  return channel
}

export async function unsubscribeFromOnlineRoom(channel: RealtimeChannel) {
  await getSupabaseClient().removeChannel(channel)
}

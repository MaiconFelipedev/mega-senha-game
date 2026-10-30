import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/u)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    }),
)

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Configure .env.local para o Supabase local antes do teste.')

function makeClient() {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signIn(client) {
  const { data, error } = await client.auth.signInAnonymously()
  if (error) throw error
  assert.ok(data.session)
  return data.session
}

async function rpc(client, name, params) {
  const { data, error } = await client.rpc(name, params)
  if (error) throw error
  return data
}

async function expectRpcError(client, name, params, code) {
  const { error } = await client.rpc(name, params)
  assert.ok(error, `${name} deveria falhar com ${code}`)
  assert.match(error.message, new RegExp(code))
}

function normalized(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
}

const host = makeClient()
const guest = makeClient()
const stranger = makeClient()
await Promise.all([signIn(host), signIn(guest), signIn(stranger)])

let hostState = await rpc(host, 'create_online_room', {
  p_nickname: 'Anfitrião',
  p_word_count: 5,
  p_categories: ['animais', 'objetos'],
  p_difficulty: 'misturado',
})
const roomId = hostState.room.id
const roomCode = hostState.room.code
assert.match(roomCode, /^[A-HJ-NP-Z2-9]{8}$/u)
assert.equal(hostState.me.role, 'giver')

const { data:hostRoomRows, error:hostRoomRowsError } = await host
  .from('online_rooms')
  .select('id')
  .eq('id', roomId)
if (hostRoomRowsError) throw hostRoomRowsError
assert.equal(hostRoomRows.length, 1)

const { data:strangerRoomRows, error:strangerRoomRowsError } = await stranger
  .from('online_rooms')
  .select('id')
  .eq('id', roomId)
if (strangerRoomRowsError) throw strangerRoomRowsError
assert.equal(strangerRoomRows.length, 0, 'RLS não pode revelar a sala a terceiros')

const { error:wordReadError } = await host.from('online_words').select('id').limit(1)
assert.ok(wordReadError, 'o banco secreto de palavras não pode ser lido pelo cliente')

await expectRpcError(stranger, 'get_online_room_state', { p_room_id: roomId }, 'not_room_member')
await expectRpcError(host, 'start_online_game', { p_room_id: roomId }, 'participants_not_ready')

let guestState = await rpc(guest, 'join_online_room', { p_code: roomCode, p_nickname: 'Convidado' })
assert.equal(guestState.participants.length, 2)
assert.equal(guestState.me.role, 'guesser')
await expectRpcError(stranger, 'join_online_room', { p_code: roomCode, p_nickname: 'Terceiro' }, 'room_full')

hostState = await rpc(host, 'set_online_ready', { p_room_id: roomId, p_ready: true })
guestState = await rpc(guest, 'set_online_ready', { p_room_id: roomId, p_ready: true })
assert.ok(hostState.participants.some((participant) => participant.ready))
assert.ok(guestState.participants.every((participant) => participant.ready))

hostState = await rpc(host, 'start_online_game', { p_room_id: roomId })
guestState = await rpc(guest, 'get_online_room_state', { p_room_id: roomId })
assert.equal(hostState.room.status, 'playing')
assert.ok(hostState.game.secretWord)
assert.equal(guestState.game.secretWord, null, 'o adivinhador nunca pode receber a palavra ativa')

let realtimeResolve
let realtimeReject
const realtimeEvent = new Promise((resolve, reject) => {
  realtimeResolve = resolve
  realtimeReject = reject
})
const realtimeChannel = guest
  .channel(`room:${roomId}`, { config: { private: true } })
  .on('broadcast', { event: 'room_changed' }, (payload) => realtimeResolve(payload))

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Realtime não conectou.')), 10_000)
  realtimeChannel.subscribe((status, error) => {
    if (status === 'SUBSCRIBED') {
      clearTimeout(timeout)
      resolve()
    } else if (status === 'CHANNEL_ERROR') {
      clearTimeout(timeout)
      reject(error ?? new Error('Falha no canal Realtime.'))
    }
  })
})

await expectRpcError(host, 'send_online_hint', {
  p_room_id: roomId,
  p_hint: hostState.game.secretWord,
  p_client_action_id: crypto.randomUUID(),
}, 'forbidden_hint')
await expectRpcError(host, 'send_online_hint', {
  p_room_id: roomId,
  p_hint: 'duas palavras',
  p_client_action_id: crypto.randomUUID(),
}, 'invalid_hint')

await rpc(host, 'send_online_hint', {
  p_room_id: roomId,
  p_hint: 'Pista',
  p_client_action_id: crypto.randomUUID(),
})
await Promise.race([
  realtimeEvent,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Mensagem não chegou pelo Realtime.')), 10_000)),
]).catch((error) => {
  realtimeReject?.(error)
  throw error
})

guestState = await rpc(guest, 'send_online_guess', {
  p_room_id: roomId,
  p_guess: 'resposta impossível',
  p_client_action_id: crypto.randomUUID(),
})
assert.equal(guestState.game.score, 0)

const correctActionId = crypto.randomUUID()
guestState = await rpc(guest, 'send_online_guess', {
  p_room_id: roomId,
  p_guess: normalized(hostState.game.secretWord),
  p_client_action_id: correctActionId,
})
assert.equal(guestState.game.score, 1)
assert.equal(guestState.resolvedWords[0].outcome, 'correct')
assert.equal(guestState.game.secretWord, null)

guestState = await rpc(guest, 'send_online_guess', {
  p_room_id: roomId,
  p_guess: normalized(hostState.game.secretWord),
  p_client_action_id: correctActionId,
})
assert.equal(guestState.game.score, 1, 'uma ação duplicada não pode pontuar duas vezes')

hostState = await rpc(host, 'skip_online_word', {
  p_room_id: roomId,
  p_client_action_id: crypto.randomUUID(),
})
assert.equal(hostState.game.score, 1)
assert.equal(hostState.resolvedWords[1].outcome, 'skipped')

const guestSession = (await guest.auth.getSession()).data.session
assert.ok(guestSession)
const reconnectedGuest = makeClient()
const { error: reconnectError } = await reconnectedGuest.auth.setSession({
  access_token: guestSession.access_token,
  refresh_token: guestSession.refresh_token,
})
if (reconnectError) throw reconnectError
const reconnectedState = await rpc(reconnectedGuest, 'get_online_room_state', { p_room_id: roomId })
assert.equal(reconnectedState.me.id, guestState.me.id)
assert.equal(reconnectedState.game.score, 1)

while (hostState.room.status === 'playing') {
  hostState = await rpc(host, 'skip_online_word', {
    p_room_id: roomId,
    p_client_action_id: crypto.randomUUID(),
  })
}
assert.equal(hostState.room.status, 'finished')
assert.equal(hostState.resolvedWords.length, 5)

hostState = await rpc(host, 'prepare_online_rematch', { p_room_id: roomId, p_invert_roles: true })
guestState = await rpc(guest, 'get_online_room_state', { p_room_id: roomId })
assert.equal(hostState.room.status, 'waiting')
assert.equal(hostState.me.role, 'guesser')
assert.equal(guestState.me.role, 'giver')

await rpc(guest, 'leave_online_room', { p_room_id: roomId })
hostState = await rpc(host, 'get_online_room_state', { p_room_id: roomId })
assert.equal(hostState.room.status, 'cancelled')
assert.equal(hostState.participants.length, 1)
await expectRpcError(guest, 'get_online_room_state', { p_room_id: roomId }, 'not_room_member')

await guest.removeChannel(realtimeChannel)
for (const client of [host, guest, stranger, reconnectedGuest]) client.realtime.disconnect()
console.log('Integração Supabase aprovada: 2 clientes, RLS, Realtime, regras, idempotência, reconexão, inversão de papéis e saída da sala.')

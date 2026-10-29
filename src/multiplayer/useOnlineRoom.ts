import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { OnlineConnectionStatus, OnlineRoomSnapshot, OnlineSettings } from './types'
import {
  clearOnlineSession,
  createOnlineRoom,
  getOnlineRoomState,
  joinOnlineRoom,
  leaveOnlineRoom,
  loadOnlineSession,
  prepareOnlineRematch,
  requestOnlineHint,
  saveOnlineSession,
  sendOnlineGuess,
  sendOnlineHint,
  setOnlineReady,
  skipOnlineWord,
  startOnlineGame,
  subscribeToOnlineRoom,
  touchOnlineParticipant,
  unsubscribeFromOnlineRoom,
  updateOnlineSettings,
} from './service'
import { createClientActionId } from './validation'

interface RunOptions {
  clearError?: boolean
}

export function useOnlineRoom() {
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot | null>(null)
  const [loading, setLoading] = useState(() => Boolean(loadOnlineSession()))
  const [actionPending, setActionPending] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<OnlineConnectionStatus>('offline')
  const refreshTimerRef = useRef<number | null>(null)
  const refreshRef = useRef<() => Promise<void>>(async () => undefined)

  const run = useCallback(async (
    action: () => Promise<OnlineRoomSnapshot>,
    options: RunOptions = { clearError: true },
  ) => {
    if (options.clearError !== false) setError('')
    setActionPending(true)
    try {
      const next = await action()
      setSnapshot(next)
      saveOnlineSession({ roomId: next.room.id, code: next.room.code })
      return next
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não foi possível concluir a ação.'
      setError(message)
      throw caught
    } finally {
      setActionPending(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    const roomId = snapshot?.room.id ?? loadOnlineSession()?.roomId
    if (!roomId) return
    try {
      const next = await getOnlineRoomState(roomId)
      setSnapshot(next)
      setError('')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não foi possível recuperar a sala.'
      setError(message)
    }
  }, [snapshot?.room.id])

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    const stored = loadOnlineSession()
    if (!stored) return

    let active = true
    void getOnlineRoomState(stored.roomId)
      .then((next) => {
        if (active) setSnapshot(next)
      })
      .catch(() => {
        if (active) clearOnlineSession()
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const roomId = snapshot?.room.id
    if (!roomId) return

    let active = true
    let channel: RealtimeChannel | null = null

    const queueRefresh = () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => void refreshRef.current(), 80)
    }

    void subscribeToOnlineRoom(roomId, queueRefresh, (status) => {
      if (!active) return
      if (status === 'SUBSCRIBED') setConnectionStatus('connected')
      else if (status === 'CLOSED') setConnectionStatus('offline')
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnectionStatus('reconnecting')
    }).then((createdChannel) => {
      if (!active) void unsubscribeFromOnlineRoom(createdChannel)
      else channel = createdChannel
    }).catch(() => {
      if (active) setConnectionStatus('offline')
    })

    const heartbeat = window.setInterval(() => {
      void touchOnlineParticipant(roomId)
        .then((next) => setSnapshot(next))
        .catch(() => setConnectionStatus('reconnecting'))
    }, 20_000)

    return () => {
      active = false
      window.clearInterval(heartbeat)
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current)
      if (channel) void unsubscribeFromOnlineRoom(channel)
    }
  }, [snapshot?.room.id])

  const createRoom = useCallback(async (nickname: string, settings: OnlineSettings, captchaToken?: string) => {
    return run(() => createOnlineRoom(nickname, settings, captchaToken))
  }, [run])

  const joinRoom = useCallback(async (code: string, nickname: string, captchaToken?: string) => {
    return run(() => joinOnlineRoom(code, nickname, captchaToken))
  }, [run])

  const leaveRoom = useCallback(async () => {
    const roomId = snapshot?.room.id
    if (!roomId) return
    setActionPending(true)
    setError('')
    try {
      await leaveOnlineRoom(roomId)
      clearOnlineSession()
      setSnapshot(null)
      setConnectionStatus('offline')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível sair da sala.')
      throw caught
    } finally {
      setActionPending(false)
    }
  }, [snapshot?.room.id])

  const withRoom = useCallback((action: (roomId: string) => Promise<OnlineRoomSnapshot>) => {
    const roomId = snapshot?.room.id
    if (!roomId) return Promise.reject(new Error('Sala não encontrada.'))
    return run(() => action(roomId))
  }, [run, snapshot?.room.id])

  return {
    snapshot,
    loading,
    actionPending,
    error,
    connectionStatus,
    clearError: () => setError(''),
    createRoom,
    joinRoom,
    leaveRoom,
    refresh,
    setReady: (ready: boolean) => withRoom((roomId) => setOnlineReady(roomId, ready)),
    updateSettings: (settings: OnlineSettings) => withRoom((roomId) => updateOnlineSettings(
      roomId,
      settings.wordCount,
      settings.categories,
      settings.difficulty,
    )),
    startGame: () => withRoom(startOnlineGame),
    sendHint: (hint: string) => withRoom((roomId) => sendOnlineHint(roomId, hint, createClientActionId())),
    sendGuess: (guess: string) => withRoom((roomId) => sendOnlineGuess(roomId, guess, createClientActionId())),
    requestHint: () => withRoom((roomId) => requestOnlineHint(roomId, createClientActionId())),
    skipWord: () => withRoom((roomId) => skipOnlineWord(roomId, createClientActionId())),
    prepareRematch: (invertRoles: boolean) => withRoom((roomId) => prepareOnlineRematch(roomId, invertRoles)),
  }
}

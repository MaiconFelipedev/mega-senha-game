import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock3,
  Copy,
  Crown,
  DoorOpen,
  Gamepad2,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button, PageTitle } from '../components/Ui'
import { isSupabaseConfigured } from '../multiplayer/client'
import type { OnlineConnectionStatus, OnlineMessageKind, OnlineSettings } from '../multiplayer/types'
import { useOnlineRoom } from '../multiplayer/useOnlineRoom'
import {
  normalizeRoomCode,
  sanitizeNickname,
  validateGuess,
  validateHint,
  validateNickname,
  validateRoomCode,
} from '../multiplayer/validation'
import { categories, categoryLabels, difficulties, difficultyLabels, type Category } from '../types'

interface OnlineModeScreenProps {
  onBack: () => void
  registerExitGuard: (handler: (() => void) | null) => void
}

const defaultSettings: OnlineSettings = {
  wordCount: 10,
  categories: [...categories],
  difficulty: 'misturado',
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()
const requiresTurnstile = import.meta.env.PROD && isSupabaseConfigured

interface TurnstileApi {
  render: (container: HTMLElement, options: {
    sitekey: string
    theme: 'dark'
    language: 'pt-BR'
    size: 'flexible'
    retry: 'auto'
    'refresh-expired': 'auto'
    'refresh-timeout': 'auto'
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
    'timeout-callback': () => void
  }) => string
  remove: (widgetId: string) => void
}

function getTurnstile(): TurnstileApi | undefined {
  return (window as typeof window & { turnstile?: TurnstileApi }).turnstile
}

function TurnstileChallenge({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!turnstileSiteKey) return
    const render = () => {
      const api = getTurnstile()
      if (!api || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = api.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        theme: 'dark',
        language: 'pt-BR',
        size: 'flexible',
        retry: 'auto',
        'refresh-expired': 'auto',
        'refresh-timeout': 'auto',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
        'timeout-callback': () => onToken(''),
      })
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-senha-rapida-turnstile]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.senhaRapidaTurnstile = 'true'
      document.head.append(script)
    }
    script.addEventListener('load', render)
    render()
    return () => {
      script?.removeEventListener('load', render)
      const api = getTurnstile()
      if (api && widgetIdRef.current) api.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [onToken])

  if (!turnstileSiteKey) return null
  return <div className="online-turnstile"><div ref={containerRef} /><small>Verificação contra abuso para criar sessões anônimas.</small></div>
}

function getInviteCode(): string {
  const params = new URLSearchParams(window.location.search)
  return normalizeRoomCode(params.get('sala') ?? params.get('room') ?? '')
}

function ConnectionBadge({ status }: { status: OnlineConnectionStatus }) {
  const connected = status === 'connected'
  const label = ({
    connecting: 'Conectando',
    connected: 'Conectado',
    reconnecting: 'Reconectando',
    offline: 'Sem conexão',
  } as const)[status]
  return (
    <span className={`online-connection ${connected ? 'online-connected' : ''}`}>
      {connected ? <Wifi /> : <WifiOff />}
      {label}
    </span>
  )
}

function OnlineError({ message }: { message: string }) {
  if (!message) return null
  return <p className="error-message" role="alert">{message}</p>
}

function EntryScreen({
  inviteCode,
  pending,
  error,
  onBack,
  onCreate,
  onJoin,
}: {
  inviteCode: string
  pending: boolean
  error: string
  onBack: () => void
  onCreate: (nickname: string, settings: OnlineSettings, captchaToken?: string) => Promise<unknown>
  onJoin: (code: string, nickname: string, captchaToken?: string) => Promise<unknown>
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(inviteCode ? 'join' : 'choose')
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState(inviteCode)
  const [localError, setLocalError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileMisconfigured = requiresTurnstile && !turnstileSiteKey

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateNickname(nickname)
    if (validationError) return setLocalError(validationError)
    if (turnstileMisconfigured) return setLocalError('A proteção antiabuso não está configurada neste ambiente.')
    if (turnstileSiteKey && !captchaToken) return setLocalError('Conclua a verificação de segurança.')
    setLocalError('')
    await onCreate(sanitizeNickname(nickname), defaultSettings, captchaToken || undefined).catch(() => undefined)
  }

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateNickname(nickname) ?? validateRoomCode(code)
    if (validationError) return setLocalError(validationError)
    if (turnstileMisconfigured) return setLocalError('A proteção antiabuso não está configurada neste ambiente.')
    if (turnstileSiteKey && !captchaToken) return setLocalError('Conclua a verificação de segurança.')
    setLocalError('')
    await onJoin(normalizeRoomCode(code), sanitizeNickname(nickname), captchaToken || undefined).catch(() => undefined)
  }

  return (
    <div className="page-container max-w-5xl">
      <button className="back-button" onClick={mode === 'choose' ? onBack : () => setMode('choose')}>
        <ArrowLeft /> {mode === 'choose' ? 'Voltar ao menu' : 'Voltar'}
      </button>
      <PageTitle
        eyebrow="JOGUE À DISTÂNCIA"
        title="Modo Online"
        description="Crie uma sala, convide um amigo e descubram palavras juntos, mesmo à distância."
      />

      {mode === 'choose' && (
        <div className="online-entry-grid">
          <button className="online-entry-card online-entry-create" onClick={() => setMode('create')}>
            <span><Users /></span>
            <strong>Criar sala</strong>
            <small>Configure a rodada e compartilhe um convite privado.</small>
          </button>
          <button className="online-entry-card" onClick={() => setMode('join')}>
            <span><DoorOpen /></span>
            <strong>Entrar em uma sala</strong>
            <small>Use o código enviado pelo seu amigo para participar.</small>
          </button>
        </div>
      )}

      {mode !== 'choose' && (
        <form className="online-form-panel" onSubmit={mode === 'create' ? submitCreate : submitJoin}>
          <div className="online-form-icon">{mode === 'create' ? <Users /> : <DoorOpen />}</div>
          <h2>{mode === 'create' ? 'Criar uma nova sala' : 'Entrar com convite'}</h2>
          <p>{mode === 'create' ? 'Você será o primeiro fornecedor de dicas.' : 'Você começará como adivinhador.'}</p>

          {mode === 'join' && (
            <label>
              Código da sala
              <input
                autoComplete="off"
                inputMode="text"
                maxLength={8}
                value={code}
                onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
                placeholder="K7M4P9Q2"
              />
            </label>
          )}
          <label>
            Seu apelido
            <input
              autoFocus
              autoComplete="nickname"
              maxLength={24}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Como seu amigo verá você"
            />
          </label>
          <TurnstileChallenge onToken={setCaptchaToken} />
          <OnlineError message={turnstileMisconfigured ? 'A proteção antiabuso não está configurada neste ambiente.' : localError || error} />
          <Button type="submit" disabled={pending || turnstileMisconfigured || Boolean(turnstileSiteKey && !captchaToken)} icon={pending ? <LoaderCircle className="animate-spin" /> : mode === 'create' ? <Users /> : <DoorOpen />}>
            {pending ? 'Conectando…' : mode === 'create' ? 'Criar sala' : 'Entrar na sala'}
          </Button>
          <div className="online-security-note"><ShieldCheck /> {turnstileMisconfigured ? 'Modo Online bloqueado até a proteção antiabuso ser configurada.' : 'Sessão anônima protegida. Nenhum cadastro é necessário.'}</div>
        </form>
      )}
    </div>
  )
}

function RoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}/online?sala=${code}`

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Senha Rápida', text: `Entre na minha sala: ${code}`, url: inviteUrl })
    } else {
      await copy(inviteUrl)
    }
  }

  return (
    <div className="online-code-card">
      <span>CÓDIGO DA SALA</span>
      <strong>{code}</strong>
      <div>
        <button onClick={() => void copy(code)}>{copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar código'}</button>
        <button onClick={() => void share()}><Share2 /> Compartilhar convite</button>
      </div>
    </div>
  )
}

function LobbyScreen({ room }: { room: ReturnType<typeof useOnlineRoom> }) {
  const { snapshot, actionPending, error, connectionStatus } = room
  if (!snapshot) return null
  const isOwner = snapshot.me.id === snapshot.room.ownerParticipantId
  const bothPlayers = snapshot.participants.length === 2
  const allReady = bothPlayers && snapshot.participants.every((participant) => participant.ready && participant.connected)

  const applySettings = (settings: OnlineSettings) => {
    if (!isOwner || actionPending) return
    void room.updateSettings(settings).catch(() => undefined)
  }

  const toggleCategory = (category: Category) => {
    const current = snapshot.room.settings.categories
    const next = current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]
    if (next.length > 0) applySettings({ ...snapshot.room.settings, categories: next })
  }

  return (
    <div className="page-container max-w-6xl">
      <div className="online-topbar">
        <button className="back-button !mb-0" onClick={() => {
          if (window.confirm('Deseja sair desta sala?')) void room.leaveRoom().catch(() => undefined)
        }}><ArrowLeft /> Sair da sala</button>
        <ConnectionBadge status={connectionStatus} />
      </div>
      <div className="online-lobby-heading">
        <div>
          <p className="eyebrow">SALA DE ESPERA</p>
          <h1>Preparem a rodada</h1>
          <p>Os dois jogadores precisam estar conectados e prontos.</p>
        </div>
        <RoomCode code={snapshot.room.code} />
      </div>

      <OnlineError message={error} />
      <div className="online-lobby-grid">
        <section className="online-panel">
          <div className="online-panel-title"><Users /><div><h2>Jogadores</h2><p>{snapshot.participants.length} de 2 participantes</p></div></div>
          <div className="online-player-list">
            {[1, 2].map((seat) => {
              const player = snapshot.participants.find((participant) => participant.seat === seat)
              return player ? (
                <div className="online-player" key={player.id}>
                  <span className="online-avatar"><UserRound /></span>
                  <div><strong>{player.nickname}{player.isMe ? ' (você)' : ''}</strong><small>{player.role === 'giver' ? 'Fornecedor de dicas' : 'Adivinhador'}</small></div>
                  {seat === 1 && <Crown className="online-crown" />}
                  <span className={`online-ready-dot ${player.ready ? 'is-ready' : ''}`}>{player.ready ? 'Pronto' : 'Aguardando'}</span>
                </div>
              ) : (
                <div className="online-player online-player-empty" key={seat}>
                  <span className="online-avatar"><LoaderCircle className="animate-spin" /></span>
                  <div><strong>Aguardando jogador…</strong><small>Compartilhe o código da sala</small></div>
                </div>
              )
            })}
          </div>
          <Button
            variant={snapshot.me.ready ? 'secondary' : 'primary'}
            disabled={actionPending}
            onClick={() => void room.setReady(!snapshot.me.ready).catch(() => undefined)}
            icon={snapshot.me.ready ? <RefreshCw /> : <Check />}
          >
            {snapshot.me.ready ? 'Alterar para não pronto' : 'Estou pronto'}
          </Button>
        </section>

        <section className="online-panel">
          <div className="online-panel-title"><Gamepad2 /><div><h2>Configurações</h2><p>{isOwner ? 'Você controla esta rodada' : 'Definidas pelo criador'}</p></div></div>
          <fieldset disabled={!isOwner || actionPending}>
            <legend>Quantidade de palavras</legend>
            <div className="online-choice-row">
              {([5, 10, 15, 20] as const).map((count) => (
                <button
                  type="button"
                  key={count}
                  className={snapshot.room.settings.wordCount === count ? 'is-active' : ''}
                  onClick={() => applySettings({ ...snapshot.room.settings, wordCount: count })}
                >{count}</button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={!isOwner || actionPending}>
            <legend>Dificuldade</legend>
            <div className="online-choice-row">
              {[...difficulties, 'misturado' as const].map((difficulty) => (
                <button
                  type="button"
                  key={difficulty}
                  className={snapshot.room.settings.difficulty === difficulty ? 'is-active' : ''}
                  onClick={() => applySettings({ ...snapshot.room.settings, difficulty })}
                >{difficultyLabels[difficulty]}</button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={!isOwner || actionPending}>
            <legend>Categorias</legend>
            <div className="online-category-grid">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={snapshot.room.settings.categories.includes(category) ? 'is-active' : ''}
                  onClick={() => toggleCategory(category)}
                >{categoryLabels[category]}</button>
              ))}
            </div>
          </fieldset>
        </section>
      </div>

      <div className="online-lobby-actions">
        {isOwner ? (
          <Button
            disabled={!allReady || actionPending}
            onClick={() => void room.startGame().catch(() => undefined)}
            icon={<Gamepad2 />}
          >{allReady ? 'Iniciar partida' : bothPlayers ? 'Aguardando jogadores prontos' : 'Aguardando segundo jogador'}</Button>
        ) : <p><Clock3 /> A partida será iniciada pelo criador da sala.</p>}
      </div>
    </div>
  )
}

const messageIcons: Record<OnlineMessageKind, typeof MessageCircle> = {
  hint: Sparkles,
  guess: MessageCircle,
  system: CircleDot,
  correct: Trophy,
  error: RefreshCw,
  request_hint: MessageCircle,
}

function GameScreen({ room }: { room: ReturnType<typeof useOnlineRoom> }) {
  const { snapshot, actionPending, error, connectionStatus } = room
  const [text, setText] = useState('')
  const [localError, setLocalError] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)
  const messageCount = snapshot?.messages.length ?? 0

  useEffect(() => {
    const container = messagesRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messageCount])

  if (!snapshot?.game) return null
  const isGiver = snapshot.me.role === 'giver'
  const partner = snapshot.participants.find((participant) => !participant.isMe)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = isGiver ? validateHint(text, snapshot.game?.secretWord) : validateGuess(text)
    if (validationError) return setLocalError(validationError)
    setLocalError('')
    const value = text.trim()
    setText('')
    const action = isGiver ? room.sendHint(value) : room.sendGuess(value)
    await action.catch(() => setText(value))
  }

  return (
    <div className="online-game-page">
      <div className="online-game-hud">
        <button onClick={() => {
          if (window.confirm('A partida está ativa. Deseja cancelar e sair da sala?')) void room.leaveRoom().catch(() => undefined)
        }}><ArrowLeft /> Sair</button>
        <div><span>PALAVRA</span><strong>{Math.min(snapshot.game.currentPosition + 1, snapshot.game.totalWords)}<small>/{snapshot.game.totalWords}</small></strong></div>
        <div><Trophy /><span>PONTOS</span><strong>{snapshot.game.score}</strong></div>
        <ConnectionBadge status={connectionStatus} />
      </div>

      <main className="online-game-grid">
        <section className="online-secret-panel">
          <span className="online-role-badge">{isGiver ? 'VOCÊ DÁ AS DICAS' : 'VOCÊ ADIVINHA'}</span>
          <p>PALAVRA SECRETA</p>
          {isGiver ? (
            <h1>{snapshot.game.secretWord}</h1>
          ) : (
            <div className="online-secret-lock"><LockKeyhole /><strong>?</strong><small>A resposta está protegida no servidor</small></div>
          )}
          <div className="online-partner-status">
            <span className={partner?.connected ? 'is-online' : ''} />
            {partner?.nickname ?? 'Seu parceiro'} {partner?.connected ? 'está conectado' : 'está reconectando'}
          </div>
          {isGiver && <p className="online-skip-note">Palavras puladas são descartadas desta rodada.</p>}
        </section>

        <section className="online-chat-panel">
          <header><div><MessageCircle /><h2>Mensagens da partida</h2></div><small>Sincronizadas em tempo real</small></header>
          <div className="online-messages" ref={messagesRef} aria-live="polite">
            {snapshot.messages.length === 0 && (
              <div className="online-chat-empty"><MessageCircle /><p>{isGiver ? 'Envie a primeira dica de uma palavra.' : 'Aguardando a primeira dica.'}</p></div>
            )}
            {snapshot.messages.map((message) => {
              const Icon = messageIcons[message.kind]
              const mine = message.senderParticipantId === snapshot.me.id
              return (
                <article className={`online-message online-message-${message.kind} ${mine ? 'is-mine' : ''}`} key={message.id}>
                  <span><Icon /></span>
                  <div>
                    <small>{message.senderNickname ?? 'Sistema'}</small>
                    <p>{message.body}</p>
                  </div>
                </article>
              )
            })}
          </div>
          <form className="online-message-form" onSubmit={submit}>
            <label htmlFor="online-message-input">{isGiver ? 'Sua dica' : 'Seu palpite'}</label>
            <div>
              <input
                id="online-message-input"
                autoComplete="off"
                maxLength={isGiver ? 32 : 64}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={isGiver ? 'Somente uma palavra' : 'Qual é a palavra?'}
              />
              <Button type="submit" disabled={actionPending || !text.trim()} icon={<Send />}>
                {isGiver ? 'Enviar dica' : 'Responder'}
              </Button>
            </div>
          </form>
          <OnlineError message={localError || error} />
          <div className="online-game-actions">
            {isGiver ? (
              <Button variant="secondary" disabled={actionPending} onClick={() => void room.skipWord().catch(() => undefined)} icon={<SkipForward />}>Pular palavra</Button>
            ) : (
              <Button variant="secondary" disabled={actionPending} onClick={() => void room.requestHint().catch(() => undefined)} icon={<Sparkles />}>Pedir outra dica</Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function ResultsScreen({ room, onBack }: { room: ReturnType<typeof useOnlineRoom>; onBack: () => void }) {
  const { snapshot, actionPending, error } = room
  if (!snapshot?.game) return null
  const skipped = snapshot.resolvedWords.filter((word) => word.outcome === 'skipped')
  const correct = snapshot.resolvedWords.filter((word) => word.outcome === 'correct')
  const isOwner = snapshot.me.id === snapshot.room.ownerParticipantId

  return (
    <div className="page-container max-w-5xl text-center">
      <div className="result-trophy"><Trophy /></div>
      <p className="eyebrow justify-center">RODADA CONCLUÍDA</p>
      <h1 className="font-display text-4xl font-black text-white sm:text-6xl">Resultado online</h1>
      <p className="mx-auto mt-3 max-w-xl text-slate-400">Vocês jogaram juntos e sincronizados até a última palavra.</p>
      <div className="online-results-stats">
        <div><Trophy /><span>Acertos</span><strong>{correct.length}</strong></div>
        <div><SkipForward /><span>Puladas</span><strong>{skipped.length}</strong></div>
        <div><Sparkles /><span>Pontuação</span><strong>{snapshot.game.score}</strong></div>
      </div>
      <section className="online-results-list">
        <h2>Palavras da rodada</h2>
        <div>{snapshot.resolvedWords.map((word) => <span className={`word-pill ${word.outcome === 'correct' ? 'pill-success' : 'pill-warning'}`} key={word.position}>{word.word}</span>)}</div>
      </section>
      <OnlineError message={error} />
      <div className="online-results-actions">
        {isOwner && <Button disabled={actionPending} onClick={() => void room.prepareRematch(false).catch(() => undefined)} icon={<RefreshCw />}>Jogar novamente</Button>}
        {isOwner && <Button variant="secondary" disabled={actionPending} onClick={() => void room.prepareRematch(true).catch(() => undefined)} icon={<Users />}>Inverter papéis</Button>}
        <Button variant="ghost" onClick={() => {
          void room.leaveRoom().then(onBack).catch(() => undefined)
        }} icon={<ArrowLeft />}>Voltar ao menu</Button>
      </div>
      {!isOwner && <p className="mt-4 text-sm text-slate-500">O criador da sala pode iniciar uma nova rodada ou inverter os papéis.</p>}
    </div>
  )
}

export function OnlineModeScreen({ onBack, registerExitGuard }: OnlineModeScreenProps) {
  const room = useOnlineRoom()
  const inviteCode = useMemo(() => getInviteCode(), [])
  const activeRoom = room.snapshot?.room.status === 'playing'
  const leaveRoom = room.leaveRoom

  useEffect(() => {
    if (!activeRoom) {
      registerExitGuard(null)
      return
    }

    const leaveActiveRoom = () => {
      if (!window.confirm('A partida online está ativa. Deseja cancelar e sair da sala?')) return
      void leaveRoom().then(onBack).catch(() => undefined)
    }
    registerExitGuard(leaveActiveRoom)
    return () => registerExitGuard(null)
  }, [activeRoom, leaveRoom, onBack, registerExitGuard])

  useEffect(() => {
    if (!activeRoom) return
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventUnload)
    return () => window.removeEventListener('beforeunload', preventUnload)
  }, [activeRoom])

  if (!isSupabaseConfigured) {
    return (
      <div className="page-container max-w-4xl">
        <button className="back-button" onClick={onBack}><ArrowLeft /> Voltar ao menu</button>
        <div className="online-unconfigured">
          <span><WifiOff /></span>
          <p className="eyebrow">INFRAESTRUTURA PREPARADA</p>
          <h1>Modo Online aguardando conexão</h1>
          <p>Este ambiente ainda não possui as variáveis públicas do projeto Supabase. Os modos presencial e treinamento continuam disponíveis normalmente.</p>
          <div><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></div>
          <small>Nenhuma chave administrativa deve ser colocada no navegador.</small>
        </div>
      </div>
    )
  }

  if (room.loading) {
    return <div className="online-loading"><LoaderCircle className="animate-spin" /><strong>Recuperando sua sala…</strong><p>Reconectando com o estado salvo no servidor.</p></div>
  }

  if (!room.snapshot) {
    return <EntryScreen inviteCode={inviteCode} pending={room.actionPending} error={room.error} onBack={onBack} onCreate={room.createRoom} onJoin={room.joinRoom} />
  }

  if (room.snapshot.room.status === 'waiting') return <LobbyScreen room={room} />
  if (room.snapshot.room.status === 'playing' && room.snapshot.game?.status === 'playing') return <GameScreen room={room} />
  if (room.snapshot.room.status === 'finished' || room.snapshot.game?.status === 'finished') return <ResultsScreen room={room} onBack={onBack} />

  return (
    <div className="page-container max-w-3xl text-center">
      <div className="online-unconfigured">
        <span><WifiOff /></span>
        <h1>Sala encerrada</h1>
        <p>Esta sala foi cancelada ou expirou por inatividade.</p>
        <Button onClick={() => void room.leaveRoom().catch(() => undefined)} icon={<ArrowLeft />}>Voltar ao Modo Online</Button>
      </div>
    </div>
  )
}

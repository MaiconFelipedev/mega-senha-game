import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell } from './components/AppShell'
import { CancelGameDialog } from './components/CancelGameDialog'
import { TrainingExitDialog } from './components/TrainingExitDialog'
import { applyGameAction, createGameState, finishByTime, getPendingWords, type GameAction } from './lib/gameEngine'
import { getScreenFromHistory, getScreenFromPath, getScreenPath, NAVIGATION_STATE_KEY } from './lib/navigation'
import { playSound } from './lib/sound'
import { clearHistory, loadHistory, loadSettings, saveMatch, saveSettings } from './lib/storage'
import {
  calculateTrainingSummary,
  drawTrainingWord,
  filterTrainingWords,
  isCorrectTrainingAnswer,
} from './lib/trainingEngine'
import {
  clearTrainingHistory,
  loadTrainingHistory,
  loadTrainingSettings,
  loadTrainingWordHistory,
  resetTrainingWordHistory,
  saveTrainingSession,
  saveTrainingSettings,
  saveTrainingWordHistory,
} from './lib/trainingStorage'
import { createWordDrawPlan, InsufficientWordsError, type WordDrawPlan } from './lib/wordGenerator'
import { beginWordCycle, loadWordHistory, markWordDisplayed, resetWordHistory } from './lib/wordHistory'
import { getWordStatistics } from './lib/wordStatistics'
import { GameScreen } from './screens/GameScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { HowToScreen } from './screens/HowToScreen'
import { PreparationScreen } from './screens/PreparationScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TrainingHistoryScreen } from './screens/TrainingHistoryScreen'
import { TrainingResultsScreen } from './screens/TrainingResultsScreen'
import { TrainingScreen, type TrainingRoundStatus } from './screens/TrainingScreen'
import { TrainingSettingsScreen } from './screens/TrainingSettingsScreen'
import type {
  GameSettings,
  GameState,
  MatchResult,
  Screen,
  TrainingRoundResult,
  TrainingSessionResult,
  TrainingSettings,
  TrainingWord,
} from './types'

interface ActiveTrainingRound {
  trainingWord: TrainingWord
  hintIndex: number
  guessCount: number
  incorrectGuesses: number
  status: TrainingRoundStatus
  feedback: string
}

const OnlineModeScreen = lazy(() => import('./screens/OnlineModeScreen').then((module) => ({ default: module.OnlineModeScreen })))

export default function App() {
  const [screen, setScreenState] = useState<Screen>(() => getScreenFromPath(window.location.pathname))
  const [settings, setSettings] = useState<GameSettings>(loadSettings)
  const [game, setGame] = useState<GameState | null>(null)
  const [remaining, setRemaining] = useState<number>(settings.duration)
  const [countdown, setCountdown] = useState(3)
  const [feedback, setFeedback] = useState<GameAction | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [history, setHistory] = useState<MatchResult[]>(loadHistory)
  const [wordHistory, setWordHistory] = useState(loadWordHistory)
  const [settingsError, setSettingsError] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [trainingSettings, setTrainingSettings] = useState<TrainingSettings>(loadTrainingSettings)
  const [trainingHistory, setTrainingHistory] = useState<TrainingSessionResult[]>(loadTrainingHistory)
  const [trainingWordHistory, setTrainingWordHistory] = useState(loadTrainingWordHistory)
  const [trainingRound, setTrainingRound] = useState<ActiveTrainingRound | null>(null)
  const [trainingRounds, setTrainingRounds] = useState<TrainingRoundResult[]>([])
  const [trainingResult, setTrainingResult] = useState<TrainingSessionResult | null>(null)
  const [trainingSettingsError, setTrainingSettingsError] = useState('')
  const [trainingExitDialogOpen, setTrainingExitDialogOpen] = useState(false)
  const gameRef = useRef<GameState | null>(null)
  const trainingRoundRef = useRef<ActiveTrainingRound | null>(null)
  const trainingRoundsRef = useRef<TrainingRoundResult[]>([])
  const screenRef = useRef<Screen>(screen)
  const finalizedRef = useRef(false)
  const feedbackTimerRef = useRef<number | null>(null)
  const wordPlanRef = useRef<WordDrawPlan | null>(null)
  const cycleStartedRef = useRef(false)
  const onlineExitHandlerRef = useRef<(() => void) | null>(null)

  const navigateTo = useCallback((nextScreen: Screen, replace = false) => {
    const currentState = window.history.state
    const state = currentState && typeof currentState === 'object' ? currentState as Record<string, unknown> : {}
    const method = replace ? 'replaceState' : 'pushState'
    window.history[method]({ ...state, [NAVIGATION_STATE_KEY]: nextScreen }, '', getScreenPath(nextScreen))
    screenRef.current = nextScreen
    setScreenState(nextScreen)
  }, [])

  const setScreen = useCallback((nextScreen: Screen) => {
    if (screenRef.current === nextScreen && window.location.pathname === getScreenPath(nextScreen)) return
    navigateTo(nextScreen)
  }, [navigateTo])

  const replaceScreen = useCallback((nextScreen: Screen) => {
    navigateTo(nextScreen, true)
  }, [navigateTo])

  const registerOnlineExitGuard = useCallback((handler: (() => void) | null) => {
    onlineExitHandlerRef.current = handler
  }, [])

  useEffect(() => {
    const initialScreen = screenRef.current
    const currentState = window.history.state
    const state = currentState && typeof currentState === 'object' ? currentState as Record<string, unknown> : {}
    const initialUrl = initialScreen === 'online'
      ? `${getScreenPath(initialScreen)}${window.location.search}`
      : getScreenPath(initialScreen)
    window.history.replaceState({ ...state, [NAVIGATION_STATE_KEY]: initialScreen }, '', initialUrl)
  }, [])

  useEffect(() => {
    screenRef.current = screen
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(0, 0)
  }, [screen])

  const wordStatistics = useMemo(
    () => getWordStatistics(settings, wordHistory),
    [settings, wordHistory],
  )

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveTrainingSettings(trainingSettings)
  }, [trainingSettings])

  useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
  }, [])

  const isRoundActive = useCallback(() => {
    const current = gameRef.current
    return (screenRef.current === 'preparation' || screenRef.current === 'game') && Boolean(current && !current.ended)
  }, [])

  const isTrainingActive = useCallback(() => (
    screenRef.current === 'training' && Boolean(trainingRoundRef.current)
  ), [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isRoundActive()) {
        const activeScreen = screenRef.current
        const previousState = event.state && typeof event.state === 'object' ? event.state as Record<string, unknown> : {}
        window.history.pushState({ ...previousState, [NAVIGATION_STATE_KEY]: activeScreen }, '', getScreenPath(activeScreen))
        setCancelDialogOpen(true)
      } else if (isTrainingActive()) {
        const activeScreen = screenRef.current
        const previousState = event.state && typeof event.state === 'object' ? event.state as Record<string, unknown> : {}
        window.history.pushState({ ...previousState, [NAVIGATION_STATE_KEY]: activeScreen }, '', getScreenPath(activeScreen))
        setTrainingExitDialogOpen(true)
      } else if (screenRef.current === 'online' && onlineExitHandlerRef.current) {
        const previousState = event.state && typeof event.state === 'object' ? event.state as Record<string, unknown> : {}
        window.history.pushState({ ...previousState, [NAVIGATION_STATE_KEY]: 'online' }, '', getScreenPath('online'))
        onlineExitHandlerRef.current()
      } else {
        const nextScreen = getScreenFromHistory(event.state, window.location.pathname)
        screenRef.current = nextScreen
        setScreenState(nextScreen)
      }
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isRoundActive() && !isTrainingActive()) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isRoundActive, isTrainingActive])

  const finalizeRound = useCallback((finishedGame: GameState) => {
    if (finalizedRef.current) return
    finalizedRef.current = true
    const match: MatchResult = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      playedAt: new Date().toISOString(),
      settings,
      correct: finishedGame.correct,
      wrong: finishedGame.wrong,
      pending: getPendingWords(finishedGame),
      total: finishedGame.originalWords.length,
      endReason: finishedGame.endReason ?? 'completed',
    }
    setHistory(saveMatch(match))
    setResult(match)
    setCancelDialogOpen(false)
    if (match.endReason === 'time') playSound('finish', settings.soundEnabled)
    replaceScreen('results')
  }, [replaceScreen, settings])

  const prepareRound = useCallback(() => {
    if (settings.categories.length === 0) {
      setSettingsError('Selecione pelo menos uma categoria para iniciar a partida.')
      setScreen('settings')
      return
    }
    try {
      const persistedWordHistory = loadWordHistory()
      const plan = createWordDrawPlan(settings, persistedWordHistory)
      const newGame = createGameState(plan.words)
      wordPlanRef.current = plan
      cycleStartedRef.current = false
      setWordHistory(persistedWordHistory)
      gameRef.current = newGame
      finalizedRef.current = false
      setGame(newGame)
      setRemaining(settings.duration)
      setCountdown(3)
      setFeedback(null)
      setCancelDialogOpen(false)
      setSettingsError('')
      setScreen('preparation')
    } catch (error) {
      setSettingsError(error instanceof InsufficientWordsError ? error.message : 'Não foi possível preparar a rodada.')
      setScreen('settings')
    }
  }, [setScreen, settings])

  useEffect(() => {
    const displayedWord = game?.queue[0]
    if (screen !== 'game' || !displayedWord || game.ended) return
    const plan = wordPlanRef.current
    const currentHistory = loadWordHistory()
    const startsCycle = !cycleStartedRef.current && plan?.cycleStartsBeforeWordId === displayedWord.id
    if (startsCycle && plan) {
      cycleStartedRef.current = true
      setWordHistory(beginWordCycle(plan.eligibleIds, displayedWord.id, currentHistory))
      return
    }
    setWordHistory(markWordDisplayed(displayedWord.id, currentHistory))
  }, [game, screen])

  useEffect(() => {
    if (screen !== 'preparation') return
    const deadline = performance.now() + 3000

    const tick = () => {
      const milliseconds = deadline - performance.now()
      if (milliseconds <= 0) {
        window.clearInterval(interval)
        setCountdown(0)
        replaceScreen('game')
        return
      }
      setCountdown(Math.ceil(milliseconds / 1000))
    }

    const interval = window.setInterval(tick, 50)
    tick()
    return () => window.clearInterval(interval)
  }, [replaceScreen, screen])

  useEffect(() => {
    if (screen !== 'game' || !gameRef.current || gameRef.current.ended) return
    const deadline = performance.now() + settings.duration * 1000

    const tick = () => {
      const milliseconds = deadline - performance.now()
      const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
      setRemaining(seconds)
      if (milliseconds <= 0) {
        window.clearInterval(interval)
        const current = gameRef.current
        if (!current) return
        const finished = finishByTime(current)
        gameRef.current = finished
        setGame(finished)
        finalizeRound(finished)
      }
    }

    const interval = window.setInterval(tick, 100)
    tick()
    return () => window.clearInterval(interval)
  }, [finalizeRound, screen, settings.duration])

  const handleGameAction = useCallback((action: GameAction) => {
    const current = gameRef.current
    const word = current?.queue[0]
    if (!current || !word || current.ended) return

    const next = applyGameAction(current, action, word.id)
    if (next === current) return
    gameRef.current = next
    setGame(next)
    setFeedback(action)
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 220)
    if (action === 'correct') playSound('correct', settings.soundEnabled)
    if (action === 'wrong') playSound('wrong', settings.soundEnabled)
    if (next.ended) finalizeRound(next)
  }, [finalizeRound, settings.soundEnabled])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (screen === 'preparation' && event.key === 'Enter') {
        event.preventDefault()
        replaceScreen('game')
        return
      }
      if (screen === 'game') {
        const action = ({ a: 'correct', p: 'skip', e: 'wrong' } as const)[event.key.toLocaleLowerCase() as 'a' | 'p' | 'e']
        if (action) {
          event.preventDefault()
          handleGameAction(action)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleGameAction, replaceScreen, screen])

  const updateSettings = (next: GameSettings) => {
    setSettingsError('')
    setSettings(next)
  }

  const toggleSound = () => updateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
  const goHome = () => setScreen('home')

  const requestRoundCancellation = useCallback(() => {
    if (isRoundActive()) setCancelDialogOpen(true)
  }, [isRoundActive])

  const continueRound = useCallback(() => {
    setCancelDialogOpen(false)
  }, [])

  const cancelRound = useCallback(() => {
    if (!isRoundActive()) {
      setCancelDialogOpen(false)
      return
    }
    finalizedRef.current = true
    gameRef.current = null
    wordPlanRef.current = null
    cycleStartedRef.current = false
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
    setGame(null)
    setFeedback(null)
    setResult(null)
    setCancelDialogOpen(false)
    replaceScreen('home')
  }, [isRoundActive, replaceScreen])

  const setCurrentTrainingRound = useCallback((next: ActiveTrainingRound | null) => {
    trainingRoundRef.current = next
    setTrainingRound(next)
  }, [])

  const setCompletedTrainingRounds = useCallback((next: TrainingRoundResult[]) => {
    trainingRoundsRef.current = next
    setTrainingRounds(next)
  }, [])

  const drawNextTrainingWord = useCallback(() => {
    const persistedHistory = loadTrainingWordHistory()
    const draw = drawTrainingWord(trainingSettings, persistedHistory)
    setTrainingWordHistory(saveTrainingWordHistory(draw.history))
    setCurrentTrainingRound({
      trainingWord: draw.trainingWord,
      hintIndex: 0,
      guessCount: 0,
      incorrectGuesses: 0,
      status: 'playing',
      feedback: '',
    })
  }, [setCurrentTrainingRound, trainingSettings])

  const startTraining = useCallback(() => {
    if (trainingSettings.categories.length === 0) {
      setTrainingSettingsError('Selecione pelo menos uma categoria para começar o treinamento.')
      setScreen('training-settings')
      return
    }
    if (filterTrainingWords(trainingSettings).length === 0) {
      setTrainingSettingsError('Ainda não há palavras de treinamento para os filtros selecionados.')
      setScreen('training-settings')
      return
    }

    setTrainingSettingsError('')
    setTrainingResult(null)
    setCompletedTrainingRounds([])
    setTrainingExitDialogOpen(false)
    drawNextTrainingWord()
    setScreen('training')
  }, [drawNextTrainingWord, setCompletedTrainingRounds, setScreen, trainingSettings])

  const submitTrainingGuess = useCallback((guess: string) => {
    const current = trainingRoundRef.current
    if (!current || current.status !== 'playing' || !guess.trim()) return

    const guessCount = current.guessCount + 1
    if (isCorrectTrainingAnswer(guess, current.trainingWord.word.text)) {
      const completedRound: TrainingRoundResult = {
        word: current.trainingWord.word,
        outcome: 'correct',
        incorrectGuesses: current.incorrectGuesses,
        guessCount,
        hintsUsed: current.hintIndex + 1,
      }
      setCompletedTrainingRounds([...trainingRoundsRef.current, completedRound])
      setCurrentTrainingRound({ ...current, guessCount, status: 'correct', feedback: 'Parabéns! Você acertou!' })
      playSound('correct', settings.soundEnabled)
      return
    }

    setCurrentTrainingRound({
      ...current,
      guessCount,
      incorrectGuesses: current.incorrectGuesses + 1,
      feedback: 'Ainda não! Tente novamente.',
    })
    playSound('wrong', settings.soundEnabled)
  }, [setCompletedTrainingRounds, setCurrentTrainingRound, settings.soundEnabled])

  const requestNextTrainingHint = useCallback(() => {
    const current = trainingRoundRef.current
    if (!current || current.status !== 'playing' || current.hintIndex >= current.trainingWord.hints.length - 1) return
    setCurrentTrainingRound({ ...current, hintIndex: current.hintIndex + 1, feedback: '' })
  }, [setCurrentTrainingRound])

  const skipTrainingWord = useCallback(() => {
    const current = trainingRoundRef.current
    if (!current || current.status !== 'playing') return
    const completedRound: TrainingRoundResult = {
      word: current.trainingWord.word,
      outcome: 'skipped',
      incorrectGuesses: current.incorrectGuesses,
      guessCount: current.guessCount,
      hintsUsed: current.hintIndex + 1,
    }
    setCompletedTrainingRounds([...trainingRoundsRef.current, completedRound])
    setCurrentTrainingRound({ ...current, status: 'skipped', feedback: '' })
  }, [setCompletedTrainingRounds, setCurrentTrainingRound])

  const finishTraining = useCallback(() => {
    if (!isTrainingActive()) return
    const rounds = trainingRoundsRef.current
    const summary = calculateTrainingSummary(rounds)
    const result: TrainingSessionResult = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      playedAt: new Date().toISOString(),
      settings: trainingSettings,
      ...summary,
      rounds,
    }
    setTrainingHistory(saveTrainingSession(result))
    setTrainingResult(result)
    setTrainingExitDialogOpen(false)
    setCurrentTrainingRound(null)
    replaceScreen('training-results')
  }, [isTrainingActive, replaceScreen, setCurrentTrainingRound, trainingSettings])

  const abandonTraining = useCallback(() => {
    if (!isTrainingActive()) return
    setTrainingExitDialogOpen(false)
    setCurrentTrainingRound(null)
    setCompletedTrainingRounds([])
    setTrainingResult(null)
    replaceScreen('training-settings')
  }, [isTrainingActive, replaceScreen, setCompletedTrainingRounds, setCurrentTrainingRound])

  const continueTraining = useCallback(() => {
    setTrainingExitDialogOpen(false)
  }, [])

  const requestTrainingExit = useCallback(() => {
    if (isTrainingActive()) setTrainingExitDialogOpen(true)
  }, [isTrainingActive])

  let content
  if (screen === 'home') content = <HomeScreen settings={settings} onStart={() => setScreen('settings')} onTraining={() => setScreen('training-settings')} onOnline={() => setScreen('online')} onHowTo={() => setScreen('how-to')} onSettings={() => setScreen('settings')} onHistory={() => setScreen('history')} />
  else if (screen === 'settings') content = <SettingsScreen settings={settings} statistics={wordStatistics} onChange={updateSettings} onBack={goHome} onStart={prepareRound} onResetWordHistory={() => {
    if (window.confirm('Reiniciar as palavras utilizadas? Palavras vistas anteriormente poderão ser sorteadas novamente. O histórico de resultados será preservado.')) {
      setWordHistory(resetWordHistory())
    }
  }} error={settingsError} />
  else if (screen === 'preparation') content = <PreparationScreen countdown={countdown} />
  else if (screen === 'game' && game) content = <GameScreen game={game} remaining={remaining} duration={settings.duration} feedback={feedback} onAction={handleGameAction} />
  else if (screen === 'results' && result) content = <ResultsScreen result={result} onReplay={prepareRound} onHome={goHome} onHistory={() => setScreen('history')} />
  else if (screen === 'how-to') content = <HowToScreen onBack={goHome} onStart={() => setScreen('settings')} />
  else if (screen === 'history') content = <HistoryScreen history={history} onBack={goHome} onStart={() => setScreen('settings')} onClear={() => {
    if (window.confirm('Apagar todo o histórico de partidas deste dispositivo?')) {
      clearHistory()
      setHistory([])
    }
  }} />
  else if (screen === 'training-settings') content = <TrainingSettingsScreen
    settings={trainingSettings}
    usedWordCount={trainingWordHistory.usedIds.length}
    onChange={(next) => {
      setTrainingSettingsError('')
      setTrainingSettings(next)
    }}
    onBack={goHome}
    onStart={startTraining}
    onHistory={() => setScreen('training-history')}
    onResetWords={() => {
      if (window.confirm('Reiniciar as palavras utilizadas no treinamento? O histórico de sessões será preservado.')) {
        setTrainingWordHistory(resetTrainingWordHistory())
      }
    }}
    error={trainingSettingsError}
  />
  else if (screen === 'training' && trainingRound) content = <TrainingScreen
    key={trainingRound.trainingWord.word.id}
    trainingWord={trainingRound.trainingWord}
    hintIndex={trainingRound.hintIndex}
    guessCount={trainingRound.guessCount}
    status={trainingRound.status}
    feedback={trainingRound.feedback}
    correctCount={trainingRounds.filter((round) => round.outcome === 'correct').length}
    onSubmitGuess={submitTrainingGuess}
    onNextHint={requestNextTrainingHint}
    onSkip={skipTrainingWord}
    onNextWord={drawNextTrainingWord}
    onEnd={requestTrainingExit}
  />
  else if (screen === 'training-results' && trainingResult) content = <TrainingResultsScreen
    result={trainingResult}
    onReplay={startTraining}
    onHome={goHome}
    onHistory={() => setScreen('training-history')}
  />
  else if (screen === 'training-history') content = <TrainingHistoryScreen
    history={trainingHistory}
    onBack={() => setScreen('training-settings')}
    onStart={() => setScreen('training-settings')}
    onClear={() => {
      if (window.confirm('Apagar todo o histórico de treinamento deste dispositivo?')) {
        clearTrainingHistory()
        setTrainingHistory([])
      }
    }}
  />
  else if (screen === 'online') content = (
    <Suspense fallback={<div className="online-loading"><strong>Carregando Modo Online…</strong></div>}>
      <OnlineModeScreen onBack={goHome} registerExitGuard={registerOnlineExitGuard} />
    </Suspense>
  )
  else content = <HomeScreen settings={settings} onStart={() => setScreen('settings')} onTraining={() => setScreen('training-settings')} onOnline={() => setScreen('online')} onHowTo={() => setScreen('how-to')} onSettings={() => setScreen('settings')} onHistory={() => setScreen('history')} />

  return (
    <>
      <AppShell
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
        minimal={screen === 'game' || screen === 'preparation'}
        onRequestGameExit={screen === 'game' ? requestRoundCancellation : undefined}
      >
        {content}
      </AppShell>
      <CancelGameDialog open={cancelDialogOpen} onContinue={continueRound} onCancel={cancelRound} />
      <TrainingExitDialog open={trainingExitDialogOpen} onContinue={continueTraining} onFinish={finishTraining} onAbandon={abandonTraining} />
    </>
  )
}

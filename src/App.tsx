import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell } from './components/AppShell'
import { applyGameAction, createGameState, finishByTime, getPendingWords, type GameAction } from './lib/gameEngine'
import { playSound } from './lib/sound'
import { clearHistory, loadHistory, loadSettings, saveMatch, saveSettings } from './lib/storage'
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
import type { GameSettings, GameState, MatchResult, Screen } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<GameSettings>(loadSettings)
  const [game, setGame] = useState<GameState | null>(null)
  const [remaining, setRemaining] = useState<number>(settings.duration)
  const [countdown, setCountdown] = useState(3)
  const [feedback, setFeedback] = useState<GameAction | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [history, setHistory] = useState<MatchResult[]>(loadHistory)
  const [wordHistory, setWordHistory] = useState(loadWordHistory)
  const [settingsError, setSettingsError] = useState('')
  const gameRef = useRef<GameState | null>(null)
  const finalizedRef = useRef(false)
  const feedbackTimerRef = useRef<number | null>(null)
  const wordPlanRef = useRef<WordDrawPlan | null>(null)
  const cycleStartedRef = useRef(false)

  const wordStatistics = useMemo(
    () => getWordStatistics(settings, wordHistory),
    [settings, wordHistory],
  )

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
  }, [])

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
    if (match.endReason === 'time') playSound('finish', settings.soundEnabled)
    setScreen('results')
  }, [settings])

  const prepareRound = useCallback(() => {
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
      setSettingsError('')
      setScreen('preparation')
    } catch (error) {
      setSettingsError(error instanceof InsufficientWordsError ? error.message : 'Não foi possível preparar a rodada.')
      setScreen('settings')
    }
  }, [settings])

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
        setScreen('game')
        return
      }
      setCountdown(Math.ceil(milliseconds / 1000))
    }

    const interval = window.setInterval(tick, 50)
    tick()
    return () => window.clearInterval(interval)
  }, [screen])

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
        setScreen('game')
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
  }, [handleGameAction, screen])

  const updateSettings = (next: GameSettings) => {
    setSettingsError('')
    setSettings(next)
  }

  const toggleSound = () => updateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
  const goHome = () => setScreen('home')

  let content
  if (screen === 'home') content = <HomeScreen settings={settings} onStart={() => setScreen('settings')} onHowTo={() => setScreen('how-to')} onSettings={() => setScreen('settings')} onHistory={() => setScreen('history')} />
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
  else content = <HomeScreen settings={settings} onStart={() => setScreen('settings')} onHowTo={() => setScreen('how-to')} onSettings={() => setScreen('settings')} onHistory={() => setScreen('history')} />

  return <AppShell soundEnabled={settings.soundEnabled} onToggleSound={toggleSound} minimal={screen === 'game' || screen === 'preparation'}>{content}</AppShell>
}

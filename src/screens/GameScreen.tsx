import { Check, Clock3, CornerDownRight, RotateCcw, X } from 'lucide-react'
import type { GameAction } from '../lib/gameEngine'
import type { GameState } from '../types'

interface GameScreenProps {
  game: GameState
  remaining: number
  duration: number
  feedback: GameAction | null
  onAction: (action: GameAction) => void
}

export function GameScreen({ game, remaining, duration, feedback, onAction }: GameScreenProps) {
  const current = game.queue[0]
  const isUrgent = remaining <= 10
  const progress = Math.max(0, Math.min(100, (remaining / duration) * 100))

  return (
    <div className={`game-screen ${feedback ? `feedback-${feedback}` : ''}`}>
      <div className="game-hud">
        <div className="hud-stat">
          <span>ACERTOS</span>
          <strong className="text-lime">{game.correct.length}</strong>
        </div>
        <div className={`timer ${isUrgent ? 'timer-urgent' : ''}`} aria-label={`${remaining} segundos restantes`}>
          <Clock3 />
          <strong>{remaining}</strong>
          <span>SEGUNDOS</span>
        </div>
        <div className="hud-stat text-right">
          <span>RESTANTES</span>
          <strong>{game.queue.length}<small>/{game.originalWords.length}</small></strong>
        </div>
      </div>

      <div className="timer-track" aria-hidden="true"><div style={{ width: `${progress}%` }} /></div>

      <section className="word-stage" aria-live="polite">
        <div className="word-kicker"><span /> PALAVRA ATUAL <span /></div>
        <h1 key={current?.id} className="current-word">{current?.text}</h1>
        <p className="category-hint">Dê uma dica de uma palavra</p>
        {feedback && <div className="feedback-flash" aria-hidden="true">{feedback === 'correct' ? <Check /> : feedback === 'wrong' ? <X /> : <RotateCcw />}</div>}
      </section>

      <div className="game-actions">
        <button className="game-action action-wrong" onClick={() => onAction('wrong')}>
          <span className="action-icon"><X /></span>
          <span><strong>ERROU</strong><small>Tecla E</small></span>
        </button>
        <button className="game-action action-skip" onClick={() => onAction('skip')}>
          <span className="action-icon"><CornerDownRight /></span>
          <span><strong>PULOU</strong><small>Tecla P</small></span>
        </button>
        <button className="game-action action-correct" onClick={() => onAction('correct')}>
          <span className="action-icon"><Check /></span>
          <span><strong>ACERTOU</strong><small>Tecla A</small></span>
        </button>
      </div>

      <div className="pending-indicator">
        <RotateCcw className="h-4 w-4" />
        <span><strong>{game.skipCount}</strong> {game.skipCount === 1 ? 'pulo realizado' : 'pulos realizados'} · palavras puladas voltam ao fim da fila</span>
      </div>
    </div>
  )
}

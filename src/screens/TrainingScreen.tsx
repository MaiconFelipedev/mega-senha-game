import { Bot, CheckCircle2, Flag, Lightbulb, LockKeyhole, Send, SkipForward, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Ui'
import { categoryLabels, type TrainingWord } from '../types'

export type TrainingRoundStatus = 'playing' | 'correct' | 'skipped'

interface TrainingScreenProps {
  trainingWord: TrainingWord
  hintIndex: number
  guessCount: number
  status: TrainingRoundStatus
  feedback: string
  correctCount: number
  onSubmitGuess: (guess: string) => void
  onNextHint: () => void
  onSkip: () => void
  onNextWord: () => void
  onEnd: () => void
}

function VisibleHints({ hints, hintIndex }: {
  hints: readonly string[]
  hintIndex: number
}) {
  return (
    <ol className="training-hints-list" aria-label="Dicas recebidas">
      {hints.map((hint, index) => {
        const isRevealed = index <= hintIndex
        const isLatest = isRevealed && index === hintIndex
        return (
          <li
            className={`training-hint-item ${isRevealed ? 'training-hint-revealed' : 'training-hint-locked'} ${isLatest ? 'training-hint-latest' : ''}`}
            key={`${index}-${hint}`}
            aria-label={isRevealed ? `Dica ${index + 1}: ${hint}` : `Dica ${index + 1} bloqueada`}
            aria-current={isLatest ? 'true' : undefined}
          >
            <span className="training-hint-label">
              {isRevealed ? <Lightbulb aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
              Dica {index + 1}
            </span>
            <strong>{isRevealed ? hint : 'Aguardando dica'}</strong>
            {isLatest && <small>Nova</small>}
          </li>
        )
      })}
    </ol>
  )
}

export function TrainingScreen({
  trainingWord,
  hintIndex,
  guessCount,
  status,
  feedback,
  correctCount,
  onSubmitGuess,
  onNextHint,
  onSkip,
  onNextWord,
  onEnd,
}: TrainingScreenProps) {
  const [guess, setGuess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hints = trainingWord.hints
  const isPlaying = status === 'playing'

  useEffect(() => {
    if (isPlaying) inputRef.current?.focus()
  }, [isPlaying])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isPlaying || !guess.trim()) return
    onSubmitGuess(guess)
    setGuess('')
  }

  return (
    <div className="training-screen">
      <header className="training-hud">
        <div>
          <span>MODO</span>
          <strong>Treinamento</strong>
        </div>
        <div className="training-score"><Trophy /><strong>{correctCount}</strong><span>acertos</span></div>
        <button className="training-end-button" type="button" onClick={onEnd}><Flag /> Encerrar treinamento</button>
      </header>

      <main className="training-card">
        <div className="assistant-avatar" aria-hidden="true"><Bot /></div>
        {isPlaying ? (
          <>
            <p className="training-message">Instrutor Virtual diz:</p>
            <section className="training-hints-panel" aria-labelledby="training-hints-title">
              <div className="training-hints-header">
                <div>
                  <h1 id="training-hints-title">Dicas recebidas</h1>
                  <p>Combine as dicas para descobrir a palavra.</p>
                </div>
                <div className="training-hint-meta">
                  <span>Dica {hintIndex + 1} de {hints.length}</span>
                  <span>{categoryLabels[trainingWord.word.category]}</span>
                </div>
              </div>
              <VisibleHints hints={hints} hintIndex={hintIndex} />
            </section>

            <form className="training-answer-form" onSubmit={submit}>
              <label htmlFor="training-answer">Qual é a palavra secreta?</label>
              <div>
                <input
                  ref={inputRef}
                  id="training-answer"
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  autoComplete="off"
                  enterKeyHint="send"
                  placeholder="Digite seu palpite"
                />
                <Button type="submit" disabled={!guess.trim()} icon={<Send className="h-4 w-4" />}>Responder</Button>
              </div>
            </form>

            <p className={`training-feedback ${feedback ? 'training-feedback-visible' : ''}`} role="status" aria-live="polite">
              {feedback || 'Você pode tentar quantas vezes precisar.'}
            </p>

            <div className="training-actions">
              <Button variant="secondary" onClick={onNextHint} disabled={hintIndex >= hints.length - 1} icon={<Lightbulb className="h-4 w-4" />}>Outra dica</Button>
              <Button variant="ghost" onClick={onSkip} icon={<SkipForward className="h-4 w-4" />}>Pular palavra</Button>
            </div>
          </>
        ) : (
          <section className={`training-round-result training-round-${status}`} aria-live="polite">
            <CheckCircle2 />
            <p>{status === 'correct' ? 'Parabéns! Você acertou!' : 'Palavra pulada. Continue aprendendo!'}</p>
            <h1>{trainingWord.word.text}</h1>
            <div className="training-round-stats">
              <span><strong>{guessCount}</strong> {guessCount === 1 ? 'palpite' : 'palpites'}</span>
              <span><strong>{hintIndex + 1}</strong> {hintIndex === 0 ? 'dica utilizada' : 'dicas utilizadas'}</span>
            </div>
            <Button onClick={onNextWord} icon={<SkipForward className="h-5 w-5" />}>Próxima palavra</Button>
          </section>
        )}
      </main>
    </div>
  )
}

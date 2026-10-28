import { Brain, CalendarDays, History, Lightbulb, Trash2, Trophy } from 'lucide-react'
import { BackButton, Button, PageTitle } from '../components/Ui'
import { difficultyLabels, formatCategorySelection, type TrainingSessionResult } from '../types'

export function TrainingHistoryScreen({ history, onBack, onClear, onStart }: {
  history: TrainingSessionResult[]
  onBack: () => void
  onClear: () => void
  onStart: () => void
}) {
  const totalCorrect = history.reduce((total, session) => total + session.correctCount, 0)
  const totalPracticed = history.reduce((total, session) => total + session.rounds.length, 0)

  return (
    <div className="page-container">
      <BackButton onClick={onBack} label="Treinamento" />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageTitle eyebrow="Evolução individual" title="Histórico de treinamento" description="Acompanhe as sessões salvas somente neste dispositivo." />
        {history.length > 0 && <Button variant="danger" className="mb-8" onClick={onClear} icon={<Trash2 className="h-4 w-4" />}>Apagar histórico</Button>}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <span><Brain /></span>
          <h2>Nenhum treinamento ainda</h2>
          <p>Seu progresso individual aparecerá aqui após a primeira sessão salva.</p>
          <Button onClick={onStart}>Começar treinamento</Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="history-summary"><History /><span>Sessões</span><strong>{history.length}</strong></div>
            <div className="history-summary"><Trophy /><span>Total de acertos</span><strong>{totalCorrect}</strong></div>
            <div className="history-summary"><Lightbulb /><span>Palavras praticadas</span><strong>{totalPracticed}</strong></div>
          </div>
          <div className="space-y-3">
            {history.map((session, index) => (
              <article className="history-card" key={session.id}>
                <div className="history-rank">#{history.length - index}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <strong className="font-display text-lg text-white">{session.correctCount} acertos · {session.skippedCount} puladas</strong>
                    <span className="history-meta"><CalendarDays /> {new Date(session.playedAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="mini-pill">{difficultyLabels[session.settings.difficulty]}</span>
                    <span className="mini-pill">{formatCategorySelection(session.settings.categories)}</span>
                    <span className="mini-pill text-rose-300">{session.incorrectGuesses} palpites incorretos</span>
                    <span className="mini-pill text-violet-300">Média: {session.averageHintsPerCorrect === null ? '—' : session.averageHintsPerCorrect.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dicas</span>
                  </div>
                  <details className="mt-3">
                    <summary>Ver palavras praticadas</summary>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {session.rounds.map((round, roundIndex) => <span className={`word-pill pill-${round.outcome === 'correct' ? 'success' : 'warning'}`} key={`${round.word.id}-${roundIndex}`}>{round.word.text}</span>)}
                    </div>
                  </details>
                </div>
                <div className="history-score"><strong>{session.rounds.length}</strong><span>PRATICADAS</span></div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

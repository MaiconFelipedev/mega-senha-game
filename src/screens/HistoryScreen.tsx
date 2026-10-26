import { CalendarDays, Clock3, History, Settings2, Trash2, Trophy } from 'lucide-react'
import { BackButton, Button, PageTitle } from '../components/Ui'
import { categoryLabels, difficultyLabels, type MatchResult } from '../types'

interface HistoryScreenProps {
  history: MatchResult[]
  onBack: () => void
  onClear: () => void
  onStart: () => void
}

export function HistoryScreen({ history, onBack, onClear, onStart }: HistoryScreenProps) {
  const totalCorrect = history.reduce((total, match) => total + match.correct.length, 0)
  const best = history.reduce((highest, match) => Math.max(highest, match.correct.length), 0)

  return (
    <div className="page-container">
      <BackButton onClick={onBack} label="Menu" />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageTitle eyebrow="Salvo neste dispositivo" title="Histórico" description="Reveja as últimas partidas e acompanhe a evolução dos jogadores." />
        {history.length > 0 && <Button variant="danger" className="mb-8" onClick={onClear} icon={<Trash2 className="h-4 w-4" />}>Apagar histórico</Button>}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <span><History /></span>
          <h2>Nenhuma partida ainda</h2>
          <p>Seu histórico aparecerá aqui depois da primeira rodada.</p>
          <Button onClick={onStart}>Começar agora</Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="history-summary"><History /><span>Partidas</span><strong>{history.length}</strong></div>
            <div className="history-summary"><Trophy /><span>Total de acertos</span><strong>{totalCorrect}</strong></div>
            <div className="history-summary"><span className="text-xl">★</span><span>Melhor rodada</span><strong>{best}</strong></div>
          </div>
          <div className="space-y-3">
            {history.map((match, index) => (
              <article className="history-card" key={match.id}>
                <div className="history-rank">#{history.length - index}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <strong className="font-display text-lg text-white">{match.correct.length} de {match.total} acertos</strong>
                    <span className="history-meta"><CalendarDays /> {new Date(match.playedAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="mini-pill"><Clock3 />{match.settings.duration}s</span>
                    <span className="mini-pill"><Settings2 />{difficultyLabels[match.settings.difficulty]}</span>
                    <span className="mini-pill">{categoryLabels[match.settings.category]}</span>
                    <span className="mini-pill text-rose-300">{match.wrong.length} erros</span>
                    <span className="mini-pill text-amber-300">{match.pending.length} pendentes</span>
                  </div>
                  <details className="mt-3">
                    <summary>Ver palavras da partida</summary>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {match.correct.map((word) => <span className="word-pill pill-success" key={word.id}>{word.text}</span>)}
                      {match.wrong.map((word) => <span className="word-pill pill-danger" key={word.id}>{word.text}</span>)}
                      {match.pending.map((word) => <span className="word-pill pill-warning" key={word.id}>{word.text}</span>)}
                    </div>
                  </details>
                </div>
                <div className="history-score"><strong>{Math.round(match.correct.length / match.total * 100)}%</strong><span>APROVEITAMENTO</span></div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

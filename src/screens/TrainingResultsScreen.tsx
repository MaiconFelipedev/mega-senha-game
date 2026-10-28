import { History, Home, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { Button, StatCard } from '../components/Ui'
import type { TrainingSessionResult } from '../types'

export function TrainingResultsScreen({ result, onReplay, onHome, onHistory }: {
  result: TrainingSessionResult
  onReplay: () => void
  onHome: () => void
  onHistory: () => void
}) {
  const average = result.averageHintsPerCorrect === null
    ? 'Sem acertos'
    : result.averageHintsPerCorrect.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mb-8 text-center">
        <div className="result-trophy"><Trophy /></div>
        <p className="eyebrow justify-center">Treinamento concluído</p>
        <h1 className="font-display text-4xl font-black text-white sm:text-6xl">Resumo do treinamento</h1>
        <p className="mt-3 text-slate-400">Cada palavra praticada ajuda a melhorar sua associação de ideias.</p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Palavras acertadas" value={result.correctCount} tone="success" />
          <StatCard label="Palavras puladas" value={result.skippedCount} tone="warning" />
          <StatCard label="Palpites incorretos" value={result.incorrectGuesses} tone="danger" />
          <StatCard label="Média de dicas" value={average} />
        </div>

        <div className="results-panel">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/8 pb-5">
            <p className="text-sm text-slate-400">{new Date(result.playedAt).toLocaleString('pt-BR')}</p>
            <span className="score-badge"><Sparkles className="h-4 w-4" /> {result.rounds.length} palavras praticadas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.rounds.length > 0 ? result.rounds.map((round, index) => (
              <span className={`word-pill pill-${round.outcome === 'correct' ? 'success' : 'warning'}`} key={`${round.word.id}-${index}`}>
                {round.word.text} · {round.hintsUsed} {round.hintsUsed === 1 ? 'dica' : 'dicas'}
              </span>
            )) : <p className="text-sm text-slate-500">Nenhuma palavra foi concluída nesta sessão.</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onReplay} icon={<RotateCcw className="h-5 w-5" />}>Treinar novamente</Button>
          <Button variant="secondary" onClick={onHome} icon={<Home className="h-5 w-5" />}>Voltar ao menu</Button>
          <Button variant="ghost" onClick={onHistory} icon={<History className="h-5 w-5" />}>Ver histórico</Button>
        </div>
      </div>
    </div>
  )
}

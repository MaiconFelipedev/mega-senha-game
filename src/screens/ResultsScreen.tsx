import { CalendarClock, History, Home, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { Button, StatCard } from '../components/Ui'
import type { MatchResult, WordEntry } from '../types'

function WordList({ title, words, tone }: { title: string; words: WordEntry[]; tone: 'success' | 'danger' | 'warning' }) {
  return (
    <div className="result-list">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">{title}</h3>
        <span className={`result-count count-${tone}`}>{words.length}</span>
      </div>
      {words.length ? (
        <div className="flex flex-wrap gap-2">{words.map((word) => <span className={`word-pill pill-${tone}`} key={word.id}>{word.text}</span>)}</div>
      ) : <p className="text-sm text-slate-500">Nenhuma palavra nesta lista.</p>}
    </div>
  )
}

export function ResultsScreen({ result, onReplay, onHome, onHistory }: { result: MatchResult; onReplay: () => void; onHome: () => void; onHistory: () => void }) {
  const scorePercent = Math.round((result.correct.length / result.total) * 100)

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mb-8 text-center">
        <div className="result-trophy"><Trophy /></div>
        <p className="eyebrow justify-center">Rodada encerrada</p>
        <h1 className="font-display text-4xl font-black text-white sm:text-6xl">{scorePercent >= 70 ? 'Mandou muito bem!' : scorePercent >= 40 ? 'Boa rodada!' : 'Vale a revanche!'}</h1>
        <p className="mt-3 text-slate-400">Você acertou <strong className="text-white">{result.correct.length} de {result.total}</strong> palavras.</p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Acertos" value={result.correct.length} tone="success" />
          <StatCard label="Erros" value={result.wrong.length} tone="danger" />
          <StatCard label="Pendentes" value={result.pending.length} tone="warning" />
          <StatCard label="Total" value={result.total} />
          <StatCard label="Tempo" value={`${result.settings.duration}s`} />
        </div>

        <div className="results-panel">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
            <div className="flex items-center gap-2 text-sm text-slate-400"><CalendarClock className="h-4 w-4" /> {new Date(result.playedAt).toLocaleString('pt-BR')}</div>
            <div className="score-badge"><Sparkles className="h-4 w-4" /> {scorePercent}% de aproveitamento</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <WordList title="Acertadas" words={result.correct} tone="success" />
            <WordList title="Erradas" words={result.wrong} tone="danger" />
            <WordList title="Pendentes" words={result.pending} tone="warning" />
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onReplay} icon={<RotateCcw className="h-5 w-5" />}>Jogar novamente</Button>
          <Button variant="secondary" onClick={onHome} icon={<Home className="h-5 w-5" />}>Voltar ao menu</Button>
          <Button variant="ghost" onClick={onHistory} icon={<History className="h-5 w-5" />}>Ver histórico</Button>
        </div>
      </div>
    </div>
  )
}

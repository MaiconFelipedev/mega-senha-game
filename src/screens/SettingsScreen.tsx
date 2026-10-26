import { Check, Database, Play, RotateCcw, Shuffle, Volume2 } from 'lucide-react'
import { BackButton, Button, PageTitle } from '../components/Ui'
import type { WordStatistics } from '../lib/wordStatistics'
import { categories, categoryLabels, difficulties, difficultyLabels, type GameSettings } from '../types'

interface SettingsScreenProps {
  settings: GameSettings
  statistics: WordStatistics
  onChange: (settings: GameSettings) => void
  onBack: () => void
  onStart: () => void
  onResetWordHistory: () => void
  error?: string
}

function ChoiceGroup<T extends string | number>({ label, values, current, format, onChange }: {
  label: string
  values: readonly T[]
  current: T
  format: (value: T) => string
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="setting-label">{label}</legend>
      <div className="choice-grid">
        {values.map((value) => (
          <button type="button" key={value} onClick={() => onChange(value)} className={`choice-button ${current === value ? 'choice-active' : ''}`} aria-pressed={current === value}>
            {current === value && <Check className="h-4 w-4" />}
            {format(value)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function SettingsScreen({ settings, statistics, onChange, onBack, onStart, onResetWordHistory, error }: SettingsScreenProps) {
  const durations = [30, 60, 90, 120] as const
  const wordCounts = [5, 10, 15, 20] as const
  const allDifficulties = [...difficulties, 'misturado'] as const
  const allCategories = ['todas', ...categories] as const

  return (
    <div className="page-container">
      <BackButton onClick={onBack} label="Menu" />
      <PageTitle eyebrow="Monte sua rodada" title="Configurações" description="Escolha o ritmo e o tipo de palavra. Suas preferências ficam salvas neste dispositivo." />

      <div className="settings-panel space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ChoiceGroup label="Duração" values={durations} current={settings.duration} format={(value) => `${value} segundos`} onChange={(duration) => onChange({ ...settings, duration })} />
          <ChoiceGroup label="Quantidade de palavras" values={wordCounts} current={settings.wordCount} format={(value) => `${value} palavras`} onChange={(wordCount) => onChange({ ...settings, wordCount })} />
        </div>
        <ChoiceGroup label="Dificuldade" values={allDifficulties} current={settings.difficulty} format={(value) => difficultyLabels[value]} onChange={(difficulty) => onChange({ ...settings, difficulty })} />
        <fieldset>
          <legend className="setting-label">Categoria</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {allCategories.map((category) => (
              <button type="button" key={category} onClick={() => onChange({ ...settings, category })} className={`choice-button ${settings.category === category ? 'choice-active' : ''}`} aria-pressed={settings.category === category}>
                {settings.category === category && <Check className="h-4 w-4" />}
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className={`toggle-row ${settings.allowFallback ? 'toggle-on' : ''}`} onClick={() => onChange({ ...settings, allowFallback: !settings.allowFallback })}>
            <Shuffle className="h-5 w-5" />
            <span><strong>Complementar categoria</strong><small>Usar outras categorias somente se faltarem palavras</small></span>
            <i aria-hidden="true" />
          </button>
          <button type="button" className={`toggle-row ${settings.soundEnabled ? 'toggle-on' : ''}`} onClick={() => onChange({ ...settings, soundEnabled: !settings.soundEnabled })}>
            <Volume2 className="h-5 w-5" />
            <span><strong>Efeitos sonoros</strong><small>Sons curtos para acerto, erro e fim do tempo</small></span>
            <i aria-hidden="true" />
          </button>
        </div>

        <section className="word-bank-panel" aria-labelledby="word-bank-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="word-bank-icon"><Database /></span>
              <div>
                <h2 id="word-bank-title" className="font-display text-lg font-bold text-white">Banco de Palavras</h2>
                <p className="text-sm text-slate-500">Estatísticas para os filtros selecionados</p>
              </div>
            </div>
            <button type="button" className="reset-words-button" onClick={onResetWordHistory}>
              <RotateCcw className="h-4 w-4" /> Reiniciar palavras utilizadas
            </button>
          </div>

          <div className="word-stats-grid">
            <div><span>Total cadastrado</span><strong>{statistics.total.toLocaleString('pt-BR')}</strong></div>
            <div><span>Já utilizadas</span><strong>{statistics.used.toLocaleString('pt-BR')}</strong></div>
            <div><span>Ainda inéditas</span><strong className="text-lime">{statistics.unused.toLocaleString('pt-BR')}</strong></div>
            <div><span>Banco explorado</span><strong>{statistics.exploredPercent}%</strong></div>
          </div>
          <div className="word-progress" role="progressbar" aria-label="Progresso do banco de palavras" aria-valuemin={0} aria-valuemax={100} aria-valuenow={statistics.exploredPercent}>
            <div style={{ width: `${statistics.exploredPercent}%` }} />
          </div>
          <p className="mt-2 text-right text-xs font-bold text-slate-500">{statistics.unused.toLocaleString('pt-BR')} palavras disponíveis antes do próximo ciclo</p>
        </section>

        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="flex justify-end border-t border-white/8 pt-6">
          <Button className="w-full sm:w-auto sm:min-w-64" onClick={onStart} icon={<Play className="h-5 w-5" fill="currentColor" />}>Iniciar partida</Button>
        </div>
      </div>
    </div>
  )
}

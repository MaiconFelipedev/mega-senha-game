import { Check, History, Play, RotateCcw, Sparkles } from 'lucide-react'
import { trainingWords } from '../data/trainingHints'
import { filterTrainingWords } from '../lib/trainingEngine'
import { BackButton, Button, PageTitle } from '../components/Ui'
import {
  categories,
  categoryLabels,
  difficulties,
  difficultyLabels,
  type TrainingSettings,
} from '../types'

interface TrainingSettingsScreenProps {
  settings: TrainingSettings
  usedWordCount: number
  onChange: (settings: TrainingSettings) => void
  onBack: () => void
  onStart: () => void
  onHistory: () => void
  onResetWords: () => void
  error?: string
}

export function TrainingSettingsScreen({
  settings,
  usedWordCount,
  onChange,
  onBack,
  onStart,
  onHistory,
  onResetWords,
  error,
}: TrainingSettingsScreenProps) {
  const allDifficulties = [...difficulties, 'misturado'] as const
  const selectedCategories = new Set(settings.categories)
  const eligibleCount = filterTrainingWords(settings).length

  const toggleCategory = (category: (typeof categories)[number]) => {
    const categoriesSelection = selectedCategories.has(category)
      ? settings.categories.filter((selected) => selected !== category)
      : categories.filter((available) => selectedCategories.has(available) || available === category)
    onChange({ ...settings, categories: categoriesSelection })
  }

  return (
    <div className="page-container">
      <BackButton onClick={onBack} label="Menu" />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageTitle
          eyebrow="Aprenda no seu ritmo"
          title="Modo Treinamento"
          description="Escolha as categorias e a dificuldade. Não há cronômetro nem limite de tentativas."
        />
        <Button variant="ghost" className="mb-8" onClick={onHistory} icon={<History className="h-4 w-4" />}>Histórico de treino</Button>
      </div>

      <div className="settings-panel space-y-8">
        <fieldset>
          <legend className="setting-label">Dificuldade</legend>
          <div className="choice-grid">
            {allDifficulties.map((difficulty) => (
              <button
                type="button"
                key={difficulty}
                onClick={() => onChange({ ...settings, difficulty })}
                className={`choice-button ${settings.difficulty === difficulty ? 'choice-active' : ''}`}
                aria-pressed={settings.difficulty === difficulty}
              >
                {settings.difficulty === difficulty && <Check className="h-4 w-4" />}
                {difficultyLabels[difficulty]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset aria-describedby="training-category-count">
          <div className="category-selection-header">
            <legend className="setting-label mb-0">Categorias</legend>
            <div className="category-selection-tools">
              <span id="training-category-count" aria-live="polite">{settings.categories.length} de {categories.length} selecionadas</span>
              <button type="button" onClick={() => onChange({ ...settings, categories: [...categories] })}>Selecionar todas</button>
              <button type="button" onClick={() => onChange({ ...settings, categories: [] })}>Limpar seleção</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => toggleCategory(category)}
                className={`choice-button ${selectedCategories.has(category) ? 'choice-active' : ''}`}
                aria-pressed={selectedCategories.has(category)}
              >
                {selectedCategories.has(category) && <Check className="h-4 w-4" />}
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </fieldset>

        <section className="word-bank-panel" aria-labelledby="training-bank-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="word-bank-icon"><Sparkles /></span>
              <div>
                <h2 id="training-bank-title" className="font-display text-lg font-bold text-white">Banco de treinamento</h2>
                <p className="text-sm text-slate-500">Dicas cadastradas e revisadas para esta modalidade</p>
              </div>
            </div>
            <button type="button" className="reset-words-button" onClick={onResetWords}>
              <RotateCcw className="h-4 w-4" /> Reiniciar palavras utilizadas
            </button>
          </div>
          <div className="word-stats-grid">
            <div><span>Total cadastrado</span><strong>{trainingWords.length}</strong></div>
            <div><span>Elegíveis agora</span><strong className="text-lime">{eligibleCount}</strong></div>
            <div><span>Já utilizadas</span><strong>{usedWordCount}</strong></div>
            <div><span>Ritmo</span><strong className="text-base">Livre</strong></div>
          </div>
          {settings.categories.length > 0 && eligibleCount < 5 && (
            <p className="mt-3 text-sm text-amber-300">Há poucas palavras para esta combinação. Nenhuma palavra fora do filtro será usada.</p>
          )}
        </section>

        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="flex justify-end border-t border-white/8 pt-6">
          <Button className="w-full sm:w-auto sm:min-w-64" onClick={onStart} icon={<Play className="h-5 w-5" fill="currentColor" />}>Começar treinamento</Button>
        </div>
      </div>
    </div>
  )
}

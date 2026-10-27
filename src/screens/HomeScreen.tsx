import { ArrowRight, BookOpen, Clock3, History, Settings, Sparkles, Trophy } from 'lucide-react'
import type { GameSettings } from '../types'
import { difficultyLabels, formatCategorySelection } from '../types'
import { Button } from '../components/Ui'

interface HomeScreenProps {
  settings: GameSettings
  onStart: () => void
  onHowTo: () => void
  onSettings: () => void
  onHistory: () => void
}

export function HomeScreen({ settings, onStart, onHowTo, onSettings, onHistory }: HomeScreenProps) {
  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1500px] items-center px-4 pb-10 pt-14 sm:px-8 lg:py-16">
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <div className="grid w-full items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <section className="relative z-10 max-w-3xl">
          <div className="mb-7 hidden items-center gap-3 lg:flex">
            <span className="h-px w-12 bg-lime" />
            <span className="text-sm font-bold uppercase tracking-[0.28em] text-lime">Jogo de palavras</span>
          </div>
          <h1 className="font-display text-[clamp(4rem,10vw,8.5rem)] font-black leading-[0.78] tracking-[-0.065em] text-white">
            SENHA<br /><span className="gradient-text">RÁPIDA</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-slate-300 sm:text-2xl">
            Uma palavra. Uma dica.<br /><span className="text-white">Quanto você consegue acertar?</span>
          </p>
          <div className="home-actions mt-10 flex flex-col gap-3 sm:flex-row">
            <Button className="home-primary-action w-full sm:w-auto sm:min-w-64" onClick={onStart} icon={<Sparkles className="h-5 w-5" />}>
              Começar jogo <ArrowRight className="ml-auto h-5 w-5" />
            </Button>
            <Button variant="secondary" className="home-secondary-action w-full sm:w-auto" onClick={onHowTo} icon={<BookOpen className="h-5 w-5" />}>Como jogar</Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="text-action" onClick={onSettings}><Settings className="h-4 w-4" /> Configurações</button>
            <button className="text-action" onClick={onHistory}><History className="h-4 w-4" /> Histórico</button>
          </div>
        </section>

        <section className="game-preview" aria-label="Resumo da próxima partida">
          <div className="preview-topline">
            <span>PRÓXIMA RODADA</span>
            <span className="live-dot"><i /> PRONTO</span>
          </div>
          <div className="preview-word">
            <span>SUA PALAVRA</span>
            <strong>?</strong>
            <small>UMA DICA POR VEZ</small>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="preview-stat"><Clock3 /><strong>{settings.duration}s</strong><span>Tempo</span></div>
            <div className="preview-stat"><Trophy /><strong>{settings.wordCount}</strong><span>Palavras</span></div>
            <div className="preview-stat"><Sparkles /><strong className="truncate text-sm sm:text-lg">{difficultyLabels[settings.difficulty]}</strong><span>{formatCategorySelection(settings.categories)}</span></div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-lime" />
          </div>
        </section>
      </div>
    </div>
  )
}

import { Check, CornerDownRight, Lightbulb, MessageCircle, Play, ShieldAlert, UsersRound, X } from 'lucide-react'
import { BackButton, Button, PageTitle } from '../components/Ui'

export function HowToScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <div className="page-container">
      <BackButton onClick={onBack} label="Menu" />
      <PageTitle eyebrow="Regras simples" title="Como jogar" description="Duas pessoas, uma tela e muita criatividade. A rodada inteira leva só alguns minutos." />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="how-card"><span>01</span><UsersRound /><h2>Escolham os papéis</h2><p>O Participante A vê a palavra e dá as dicas. O Participante B fica sem olhar para a tela e tenta adivinhar.</p></article>
        <article className="how-card"><span>02</span><MessageCircle /><h2>Uma palavra por dica</h2><p>As dicas devem ter somente uma palavra. Não vale dizer a senha, partes dela ou variações diretas.</p></article>
        <article className="how-card"><span>03</span><Lightbulb /><h2>Façam o máximo de pontos</h2><p>Acertem o maior número de palavras antes que o cronômetro chegue a zero.</p></article>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_.72fr]">
        <section className="rules-panel">
          <h2 className="font-display text-2xl font-bold text-white">Durante a rodada</h2>
          <div className="mt-5 space-y-3">
            <div className="rule-row rule-correct"><Check /><span><strong>Acertou</strong><small>Soma um ponto e avança para a próxima palavra.</small></span><kbd>A</kbd></div>
            <div className="rule-row rule-skip"><CornerDownRight /><span><strong>Pulou</strong><small>A palavra volta para o fim da fila e pode reaparecer.</small></span><kbd>P</kbd></div>
            <div className="rule-row rule-wrong"><X /><span><strong>Errou</strong><small>Descarta a palavra sem marcar ponto.</small></span><kbd>E</kbd></div>
          </div>
        </section>
        <section className="rules-panel flex flex-col justify-between">
          <div>
            <ShieldAlert className="mb-4 h-8 w-8 text-violet-300" />
            <h2 className="font-display text-2xl font-bold text-white">Lembrete importante</h2>
            <p className="mt-3 leading-relaxed text-slate-400">Quem controla a tela decide quando encerrar uma tentativa como erro. Palpites falados incorretos não precisam ser registrados.</p>
          </div>
          <Button className="mt-7 w-full" onClick={onStart} icon={<Play className="h-5 w-5" fill="currentColor" />}>Configurar partida</Button>
        </section>
      </div>
    </div>
  )
}

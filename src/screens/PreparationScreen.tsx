import { EyeOff, MessageCircle, UserRound } from 'lucide-react'

export function PreparationScreen({ countdown }: { countdown: number }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-24 text-center">
      <div className="relative">
        <p className="eyebrow justify-center">Preparem-se</p>
        <div key={countdown} className="countdown-number" aria-live="assertive">{countdown}</div>
        <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">A rodada vai começar</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-slate-400">Quem dá as dicas olha para a tela. Quem adivinha fica de costas.</p>
        <div className="mx-auto mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
          <div className="prep-tip"><UserRound /><span>Dê a dica</span></div>
          <div className="prep-tip"><MessageCircle /><span>Uma palavra</span></div>
          <div className="prep-tip"><EyeOff /><span>Sem espiar</span></div>
        </div>
      </div>
    </div>
  )
}

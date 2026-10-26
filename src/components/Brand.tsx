import { Zap } from 'lucide-react'

interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Senha Rápida">
      <span className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} brand-mark`}>
        <Zap className={compact ? 'h-5 w-5' : 'h-7 w-7'} fill="currentColor" />
      </span>
      <span className={`${compact ? 'text-lg' : 'text-2xl'} font-display font-bold tracking-tight text-white`}>
        SENHA <span className="text-lime">RÁPIDA</span>
      </span>
    </div>
  )
}

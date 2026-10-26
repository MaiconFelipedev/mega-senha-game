import { ArrowLeft } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
}

export function Button({ variant = 'primary', icon, className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export function BackButton({ onClick, label = 'Voltar' }: { onClick: () => void; label?: string }) {
  return (
    <button className="back-button" onClick={onClick}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}

export function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">{description}</p>}
    </div>
  )
}

export function StatCard({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'success' | 'danger' | 'warning' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <strong className="font-display text-3xl text-white">{value}</strong>
    </div>
  )
}

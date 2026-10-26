import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Brand } from './Brand'

interface AppShellProps {
  children: ReactNode
  soundEnabled: boolean
  onToggleSound: () => void
  minimal?: boolean
}

export function AppShell({ children, soundEnabled, onToggleSound, minimal = false }: AppShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  return (
    <div className="app-background min-h-dvh overflow-hidden text-slate-100">
      <div className="noise-layer" aria-hidden="true" />
      <header className={`relative z-30 mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-8 ${minimal ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
        <Brand compact />
        <div className="flex items-center gap-2">
          <button className="icon-button" onClick={onToggleSound} aria-label={soundEnabled ? 'Desativar sons' : 'Ativar sons'} title={soundEnabled ? 'Desativar sons' : 'Ativar sons'}>
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </button>
          <button className="icon-button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'} title="Tela cheia">
            {isFullscreen ? <Minimize /> : <Maximize />}
          </button>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  )
}

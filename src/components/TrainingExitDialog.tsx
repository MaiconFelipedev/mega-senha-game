import { Flag, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from './Ui'

interface TrainingExitDialogProps {
  open: boolean
  onContinue: () => void
  onFinish: () => void
  onAbandon: () => void
}

export function TrainingExitDialog({ open, onContinue, onFinish, onAbandon }: TrainingExitDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onContinue()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onContinue])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="cancel-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-exit-title"
        aria-describedby="training-exit-description"
      >
        <span className="cancel-dialog-icon" aria-hidden="true"><Flag /></span>
        <h2 id="training-exit-title">Encerrar treinamento?</h2>
        <p id="training-exit-description">Você pode continuar, salvar a sessão e ver o resumo ou abandonar sem registrar os resultados.</p>
        <div className="training-exit-actions">
          <Button variant="secondary" onClick={onContinue}>Continuar treinando</Button>
          <Button onClick={onFinish}>Finalizar e ver resumo</Button>
          <Button variant="danger" onClick={onAbandon} icon={<Trash2 className="h-4 w-4" />}>Abandonar sem salvar</Button>
        </div>
      </section>
    </div>
  )
}

import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from './Ui'

interface CancelGameDialogProps {
  open: boolean
  onContinue: () => void
  onCancel: () => void
}

export function CancelGameDialog({ open, onContinue, onCancel }: CancelGameDialogProps) {
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
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <span className="cancel-dialog-icon" aria-hidden="true"><AlertTriangle /></span>
        <h2 id="cancel-dialog-title">Deseja cancelar a partida?</h2>
        <p id="cancel-dialog-description">Seu progresso nesta partida será descartado. Deseja voltar ao menu inicial?</p>
        <div className="cancel-dialog-actions">
          <Button variant="secondary" onClick={onContinue}>Continuar jogando</Button>
          <Button variant="danger" onClick={onCancel}>Cancelar partida</Button>
        </div>
      </section>
    </div>
  )
}

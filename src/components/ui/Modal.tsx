import { Button } from './Button'
import { BottomSheet } from './BottomSheet'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({ open, title, description, confirmLabel, destructive, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <div className='flex flex-col gap-2.5'>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          size='lg'
          block
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant='ghost' size='lg' block onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </BottomSheet>
  )
}

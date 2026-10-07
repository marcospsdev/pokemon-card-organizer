import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/format'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}

export function BottomSheet({ open, onClose, title, description, children, tone = 'light', className }: BottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>('input, button:not([data-handle]), [tabindex="0"]')
      focusable?.focus()
    }, 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
      previous?.focus?.()
    }
  }, [open, onClose])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center'>
          <motion.div
            className='absolute inset-0 bg-ink-950/40 backdrop-blur-[3px]'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role='dialog'
            aria-modal='true'
            aria-labelledby={title ? titleId : undefined}
            className={cn(
              'relative w-full max-w-lg rounded-t-[28px] px-5 pt-2 pb-safe shadow-lift sm:mb-6 sm:rounded-[28px]',
              tone === 'light' ? 'bg-white text-ink-900' : 'bg-ink-900 text-white ring-1 ring-white/10',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag='y'
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
          >
            <button
              type='button'
              data-handle
              aria-label='Fechar'
              onClick={onClose}
              onPointerDown={(event) => dragControls.start(event)}
              className='mx-auto mb-3 block h-5 w-16 touch-none'
            >
              <span className={cn('mx-auto block h-1.5 w-10 rounded-full', tone === 'light' ? 'bg-ink-200' : 'bg-white/20')} />
            </button>
            {title && (
              <div className='mb-4'>
                <h2 id={titleId} className='text-[22px] font-bold tracking-tight'>
                  {title}
                </h2>
                {description && <p className={cn('mt-1 text-[15px]', tone === 'light' ? 'text-ink-500' : 'text-white/60')}>{description}</p>}
              </div>
            )}
            <div className='pb-5'>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

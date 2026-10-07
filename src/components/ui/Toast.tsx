import { CircleAlert, CircleCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div
      aria-live='polite'
      className='pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]'
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className='glass-dark pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-3.5 text-[15px] font-medium text-white shadow-lift ring-1 ring-white/10'
          >
            {item.tone === 'success' && <CircleCheck className='h-5 w-5 shrink-0 text-emerald-400' aria-hidden />}
            {item.tone === 'error' && <CircleAlert className='h-5 w-5 shrink-0 text-dex-400' aria-hidden />}
            <span className={cn('min-w-0 flex-1', !item.action && 'pr-1.5')}>{item.message}</span>
            {item.action && (
              <button
                type='button'
                onClick={() => {
                  item.action?.onClick()
                  dismiss(item.id)
                }}
                className='rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25'
              >
                {item.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

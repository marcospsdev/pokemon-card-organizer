import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { cn } from '@/lib/format'
import type { ScannerState } from '@/types'

interface ScannerOverlayProps {
  state: ScannerState
}

const CORNER = 'absolute h-9 w-9 border-white'

export const ScannerOverlay = forwardRef<HTMLDivElement, ScannerOverlayProps>(function ScannerOverlay({ state }, guideRef) {
  const identified = state === 'identified'
  const waiting = state === 'scanning-next'
  const scanning = state === 'scanning' || state === 'processing'

  return (
    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
      <div
        ref={guideRef}
        className='relative aspect-[63/88] w-[min(70vw,330px,calc((100dvh-300px)*0.716))] rounded-[22px] shadow-[0_0_0_9999px_rgb(11_12_16/0.58)]'
      >
        <motion.div
          className={cn('absolute inset-0 rounded-[22px] ring-2 transition-colors duration-300', identified ? 'ring-emerald-400' : waiting ? 'ring-white/25' : 'ring-white/10')}
          animate={identified ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        />
        <span className={cn(CORNER, '-top-px -left-px rounded-tl-[22px] border-t-4 border-l-4', identified && 'border-emerald-400')} />
        <span className={cn(CORNER, '-top-px -right-px rounded-tr-[22px] border-t-4 border-r-4', identified && 'border-emerald-400')} />
        <span className={cn(CORNER, '-bottom-px -left-px rounded-bl-[22px] border-b-4 border-l-4', identified && 'border-emerald-400')} />
        <span className={cn(CORNER, '-right-px -bottom-px rounded-br-[22px] border-r-4 border-b-4', identified && 'border-emerald-400')} />
        {scanning && (
          <div className='absolute inset-x-3 top-0 bottom-0 overflow-hidden'>
            <div className='scan-line absolute inset-x-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-dex-400 to-transparent shadow-[0_0_18px_4px_rgb(242_70_94/0.45)]' />
          </div>
        )}
      </div>
    </div>
  )
})

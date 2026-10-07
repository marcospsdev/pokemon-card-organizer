import { motion } from 'motion/react'
import { cn } from '@/lib/format'

interface ProgressBarProps {
  value: number
  label: string
  tone?: 'red' | 'blue' | 'light'
  className?: string
}

export function ProgressBar({ value, label, tone = 'red', className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('h-2 w-full overflow-hidden rounded-full', tone === 'light' ? 'bg-white/20' : 'bg-ink-100', className)}
    >
      <motion.div
        className={cn(
          'h-full rounded-full',
          tone === 'red' && 'bg-gradient-to-r from-dex-400 to-dex-600',
          tone === 'blue' && 'bg-gradient-to-r from-lens-400 to-lens-600',
          tone === 'light' && 'bg-white',
        )}
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 24 }}
      />
    </div>
  )
}

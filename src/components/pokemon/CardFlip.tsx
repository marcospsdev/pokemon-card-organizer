import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/format'

interface CardFlipProps {
  front: ReactNode
  back: ReactNode
  label: string
  className?: string
  flipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
}

export function CardFlip({ front, back, label, className, flipped: controlled, onFlippedChange }: CardFlipProps) {
  const [internal, setInternal] = useState(false)
  const flipped = controlled ?? internal

  const toggle = () => {
    const next = !flipped
    setInternal(next)
    onFlippedChange?.(next)
  }

  return (
    <div className={cn('[perspective:1400px]', className)}>
      <motion.button
        type='button'
        aria-label={label}
        aria-pressed={flipped}
        onClick={toggle}
        className='preserve-3d relative block h-full w-full cursor-pointer text-left'
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <div className='backface-hidden absolute inset-0' aria-hidden={flipped}>
          {front}
        </div>
        <div className='backface-hidden absolute inset-0 [transform:rotateY(180deg)]' aria-hidden={!flipped}>
          {back}
        </div>
      </motion.button>
    </div>
  )
}

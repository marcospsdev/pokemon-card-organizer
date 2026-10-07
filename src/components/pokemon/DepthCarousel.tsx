import { motion, useReducedMotion, type PanInfo } from 'motion/react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/format'

interface DepthCarouselProps<T> {
  items: T[]
  getKey: (item: T) => string | number
  renderItem: (item: T, state: { active: boolean; offset: number }) => ReactNode
  index?: number
  onIndexChange?: (index: number) => void
  onSelect?: (item: T) => void
  spacing?: number
  height: number
  label: string
  windowSize?: number
  className?: string
}

export function DepthCarousel<T>({
  items,
  getKey,
  renderItem,
  index: controlled,
  onIndexChange,
  onSelect,
  spacing = 150,
  height,
  label,
  windowSize = 3,
  className,
}: DepthCarouselProps<T>) {
  const [internal, setInternal] = useState(0)
  const reduceMotion = useReducedMotion()
  const index = Math.min(controlled ?? internal, Math.max(0, items.length - 1))

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next))
    setInternal(clamped)
    onIndexChange?.(clamped)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const projected = info.offset.x + info.velocity.x * 0.18
    const steps = Math.round(-projected / spacing)
    if (steps !== 0) goTo(index + Math.max(-4, Math.min(4, steps)))
  }

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') goTo(index + 1)
    if (event.key === 'ArrowLeft') goTo(index - 1)
    if (event.key === 'Enter' && items[index]) onSelect?.(items[index])
  }

  return (
    <div
      role='listbox'
      aria-label={label}
      aria-activedescendant={items[index] ? `carousel-${getKey(items[index])}` : undefined}
      tabIndex={0}
      onKeyDown={handleKey}
      className={cn('relative w-full touch-pan-y overflow-hidden outline-none [perspective:1200px]', className)}
      style={{ height }}
    >
      <motion.div
        className='absolute inset-0'
        drag='x'
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {items.map((item, position) => {
          const offset = position - index
          if (Math.abs(offset) > windowSize) return null
          const distance = Math.abs(offset)
          const active = offset === 0
          return (
            <motion.div
              key={getKey(item)}
              id={`carousel-${getKey(item)}`}
              role='option'
              aria-selected={active}
              className='absolute top-1/2 left-1/2'
              style={{ zIndex: 100 - distance }}
              initial={false}
              animate={{
                x: `calc(-50% + ${offset * spacing}px)`,
                y: '-50%',
                scale: 1 - distance * 0.12,
                rotateY: reduceMotion ? 0 : offset * -18,
                opacity: distance > windowSize - 1 ? 0 : 1 - distance * 0.22,
                filter: distance === 0 ? 'blur(0px)' : `blur(${Math.min(distance, 2) * 0.6}px)`,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              onTap={() => (active ? onSelect?.(item) : goTo(position))}
            >
              {renderItem(item, { active, offset })}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

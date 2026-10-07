import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { SortGroup } from '@/services/sortingService'
import { SortingSlot } from './SortingSlot'

interface SortingBoardProps {
  groups: SortGroup[]
  currentIndex: number
  columns: number
}

export function SortingBoard({ groups, currentIndex, columns }: SortingBoardProps) {
  const reduceMotion = useReducedMotion()
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [currentIndex, reduceMotion])

  return (
    <motion.div
      layoutScroll
      className='felt relative h-full overflow-y-auto rounded-[28px] px-4 pt-6 pb-10 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] ring-1 ring-black/20'
      aria-label='Mesa vista de cima'
    >
      <div className='[perspective:1100px]'>
        <div
          className='mx-auto grid max-w-3xl origin-top gap-x-2 gap-y-3'
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: reduceMotion ? undefined : 'rotateX(16deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {groups.map((group, position) => (
            <SortingSlot key={group.pokedexNumber} ref={position === currentIndex ? currentRef : undefined} group={group} current={position === currentIndex} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

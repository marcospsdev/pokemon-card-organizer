import { AnimatePresence, motion } from 'motion/react'
import type { Pokemon } from '@/types'
import { PokemonCard } from '@/components/pokemon/PokemonCard'

export interface RecentCapture {
  cardId: string
  pokemon: Pokemon
}

const FAN = [-10, -5, 0, 5, 10]

export function RecentCaptures({ captures }: { captures: RecentCapture[] }) {
  const visible = captures.slice(-5)
  return (
    <div className='relative flex h-[104px] items-end justify-center' aria-label='Últimas cartas registradas'>
      <AnimatePresence initial={false}>
        {visible.map((capture, position) => {
          const offset = position - (visible.length - 1) / 2
          const rotate = FAN[Math.round(offset + 2)] ?? 0
          return (
            <motion.div
              key={capture.cardId}
              layout
              className='absolute bottom-0 origin-bottom'
              initial={{ opacity: 0, scale: 0.2, y: -220, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, y: Math.abs(offset) * 5, x: offset * 46, rotate }}
              exit={{ opacity: 0, scale: 0.6, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20, mass: 0.8 }}
              style={{ zIndex: position }}
            >
              <PokemonCard size='xs' pokemon={{ name: capture.pokemon.displayName, number: capture.pokemon.nationalDexNumber, imageUrl: capture.pokemon.imageUrl, types: capture.pokemon.types }} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

import { motion } from 'motion/react'
import { DECK_ACCENTS, cn } from '@/lib/format'
import type { DeckAccent, ScannedCard } from '@/types'
import { PokeballMark } from '@/components/ui/Primitives'
import { PokemonImage } from './PokemonImage'

interface DeckProps {
  cards: ScannedCard[]
  accent: DeckAccent
  spread?: boolean
  className?: string
}

const RESTING = [
  { rotate: -7, x: -6, y: 4 },
  { rotate: 5, x: 5, y: 2 },
  { rotate: -2, x: -2, y: 1 },
  { rotate: 0, x: 0, y: 0 },
]

const SPREAD = [
  { rotate: -18, x: -38, y: 8 },
  { rotate: 9, x: 34, y: 4 },
  { rotate: -6, x: -14, y: -4 },
  { rotate: 2, x: 6, y: -10 },
]

export function Deck({ cards, accent, spread, className }: DeckProps) {
  const palette = DECK_ACCENTS[accent]
  const preview = [...new Map([...cards].sort((a, b) => a.pokedexNumber - b.pokedexNumber).map((card) => [card.pokedexNumber, card])).values()].slice(0, 3)
  const layers = Math.max(1, Math.min(4, cards.length))
  const positions = spread ? SPREAD : RESTING

  return (
    <div className={cn('relative aspect-[63/88] w-[104px]', className)} aria-hidden>
      {Array.from({ length: 4 }, (_, layer) => {
        const visible = layer >= 4 - layers || layer === 3
        const face = layer === 3 ? preview[0] : layer === 2 ? preview[1] : layer === 1 ? preview[2] : undefined
        return (
          <motion.div
            key={layer}
            className='absolute inset-0 rounded-[12px] p-[5px] shadow-card ring-1 ring-black/10'
            style={{ background: face ? '#fff' : `linear-gradient(150deg, ${palette.from}, ${palette.to})`, opacity: visible ? 1 : 0 }}
            animate={positions[layer]}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: spread ? layer * 0.025 : 0 }}
          >
            {face ? (
              <div className='flex h-full w-full items-center justify-center rounded-[8px] bg-gradient-to-b from-ink-50 to-white'>
                <PokemonImage src={face.imageUrl} name={face.pokemonName} className='h-[78%] w-[78%]' />
              </div>
            ) : (
              <div className='flex h-full w-full items-center justify-center rounded-[8px] ring-1 ring-white/25'>
                <PokeballMark className='h-10 w-10 text-white/70' />
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

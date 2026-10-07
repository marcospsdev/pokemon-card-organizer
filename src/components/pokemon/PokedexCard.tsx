import { Check, Circle } from 'lucide-react'
import { motion } from 'motion/react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatDexNumber, typeMeta } from '@/lib/format'
import type { Pokemon } from '@/types'
import { PokemonImage } from './PokemonImage'

interface PokedexCardProps {
  pokemon: Pokemon
  owned: number
}

export const PokedexCard = memo(function PokedexCard({ pokemon, owned }: PokedexCardProps) {
  const primary = typeMeta(pokemon.types[0] ?? 'normal')
  return (
    <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
      <Link
        to={`/pokedex/${pokemon.id}`}
        aria-label={`${pokemon.displayName}, ${formatDexNumber(pokemon.nationalDexNumber)}, ${owned > 0 ? `possui ${owned}` : 'não possui'}`}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-[20px] bg-white p-2.5 shadow-soft ring-1 transition-shadow hover:shadow-card',
          owned > 0 ? 'ring-ink-200/70' : 'ring-ink-200/40',
        )}
      >
        <div className='flex items-center justify-between px-1'>
          <span className='font-mono text-[11px] font-semibold text-ink-400 tabular'>{formatDexNumber(pokemon.nationalDexNumber)}</span>
          {owned > 0 ? (
            <span className='flex items-center gap-0.5 rounded-full bg-dex-500 px-1.5 py-0.5 text-[10px] font-bold text-white tabular'>
              <Check className='h-3 w-3' strokeWidth={3} aria-hidden />
              {owned > 1 ? `×${owned}` : ''}
            </span>
          ) : (
            <Circle className='h-3.5 w-3.5 text-ink-300' aria-hidden />
          )}
        </div>
        <div
          className='mx-auto my-1 flex aspect-square w-full items-center justify-center rounded-2xl'
          style={{ background: `radial-gradient(circle at 50% 60%, ${primary.soft} 0%, transparent 70%)` }}
        >
          <PokemonImage
            src={pokemon.spriteUrl}
            name={pokemon.displayName}
            pixel
            className={cn('h-[88%] w-[88%] transition-transform duration-300 group-hover:scale-105', owned === 0 && 'opacity-60 grayscale-[35%]')}
          />
        </div>
        <div className='truncate px-1 text-[14px] font-semibold tracking-tight'>{pokemon.displayName}</div>
        <div className='mt-1 flex gap-1 px-1 pb-0.5'>
          {pokemon.types.map((type) => (
            <span key={type} className='h-1.5 flex-1 rounded-full' style={{ backgroundColor: typeMeta(type).color }} title={typeMeta(type).label} />
          ))}
        </div>
      </Link>
    </motion.div>
  )
})

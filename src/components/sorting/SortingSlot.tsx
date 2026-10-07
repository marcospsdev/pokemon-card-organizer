import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { cn, formatDexNumber } from '@/lib/format'
import type { SortGroup } from '@/services/sortingService'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

interface SortingSlotProps {
  group: SortGroup
  current: boolean
}

export const SortingSlot = forwardRef<HTMLDivElement, SortingSlotProps>(function SortingSlot({ group, current }, ref) {
  const placed = group.placed > 0 && !current
  return (
    <div ref={ref} className='relative aspect-[63/88] w-full'>
      <div
        className={cn(
          'absolute inset-0 rounded-[9px] border-[1.5px] border-dashed transition-colors',
          current ? 'border-white/0' : placed ? 'border-transparent' : 'border-white/15',
        )}
      />
      {current && (
        <motion.div
          className='absolute -inset-[3px] rounded-[11px] ring-2 ring-dex-400'
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {placed ? (
        <motion.div
          layoutId={`sort-card-${group.pokedexNumber}`}
          className='absolute inset-0 flex flex-col overflow-hidden rounded-[9px] bg-white shadow-[0_3px_0_rgb(0_0_0/0.25),0_8px_14px_-6px_rgb(0_0_0/0.5)]'
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className='flex min-h-0 flex-1 items-center justify-center p-[8%]'>
            <PokemonImage src={group.imageUrl} name={group.name} className='h-full w-full' />
          </div>
          <div className='truncate bg-ink-900 px-1 py-[3px] text-center font-mono text-[9px] leading-none font-semibold text-white tabular'>
            {formatDexNumber(group.pokedexNumber)}
          </div>
          {group.count > 1 && (
            <span className='absolute top-1 right-1 rounded-full bg-dex-500 px-1 text-[8px] leading-[14px] font-bold text-white tabular'>×{group.count}</span>
          )}
        </motion.div>
      ) : (
        <div className={cn('absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold tabular', current ? 'text-dex-200' : 'text-white/25')}>
          {formatDexNumber(group.pokedexNumber)}
        </div>
      )}
    </div>
  )
})

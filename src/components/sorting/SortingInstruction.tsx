import { ArrowDown, ArrowRight, CornerDownRight, Layers } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDexNumber } from '@/lib/format'
import type { SortInstruction } from '@/services/sortingService'
import { PokemonCard } from '@/components/pokemon/PokemonCard'

interface SortingInstructionProps {
  instruction: SortInstruction
  types?: string[]
}

export function SortingInstruction({ instruction, types }: SortingInstructionProps) {
  const { group, previous, slot } = instruction
  const Icon = instruction.kind === 'stack' ? Layers : instruction.startsNewRow ? CornerDownRight : instruction.kind === 'first' ? ArrowDown : ArrowRight

  return (
    <div className='flex items-center gap-5' aria-live='polite'>
      <div className='relative shrink-0'>
        <AnimatePresence mode='popLayout'>
          <motion.div
            key={group.pokedexNumber}
            layoutId={`sort-card-${group.pokedexNumber}`}
            initial={{ opacity: 0, scale: 0.7, rotate: -6, y: 24 }}
            animate={{ opacity: 1, scale: 1, rotate: -2, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className='rounded-[var(--radius-card)]'
          >
            <PokemonCard
              size='md'
              eager
              count={group.count}
              pokemon={{ name: group.name, number: group.pokedexNumber, imageUrl: group.imageUrl, types }}
              className='w-[128px] shadow-lift sm:w-[150px]'
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={`${group.pokedexNumber}-${group.placed}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className='min-w-0 flex-1'
        >
          <div className='text-[12px] font-semibold tracking-[0.08em] text-white/50 uppercase'>Procure na pilha</div>
          <div className='mt-1 font-mono text-[15px] font-semibold text-dex-200 tabular'>{formatDexNumber(group.pokedexNumber)}</div>
          <h2 className='truncate text-[30px] leading-[1.05] font-bold tracking-[-0.03em] uppercase sm:text-[36px]'>{group.name}</h2>
          <p className='mt-3 flex items-start gap-2 text-[16px] leading-snug font-semibold text-white'>
            <Icon className='mt-0.5 h-5 w-5 shrink-0 text-dex-400' aria-hidden />
            <span>{instruction.headline}</span>
          </p>
          {instruction.detail && <p className='mt-1.5 text-[14px] leading-snug text-white/60'>{instruction.detail}</p>}
          <div className='mt-3 flex flex-wrap gap-1.5'>
            <span className='rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/80 tabular'>
              Fileira {slot.row} · Posição {slot.column}
            </span>
            {previous && (
              <span className='rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/60 tabular'>
                após {formatDexNumber(previous.pokedexNumber)}
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDexNumber } from '@/lib/format'
import type { Pokemon } from '@/types'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

export interface ScanResultData {
  key: string
  pokemon: Pokemon
  count: number
}

export function ScanResult({ result }: { result: ScanResultData | null }) {
  return (
    <div className='pointer-events-none absolute inset-0 flex items-center justify-center' aria-live='assertive'>
      <AnimatePresence>
        {result && (
          <motion.div
            key={result.key}
            initial={{ opacity: 0, scale: 0.6, rotate: -8, y: 30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 140, rotate: 4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className='flex w-[210px] flex-col items-center rounded-[26px] bg-white px-5 pt-4 pb-5 text-ink-900 shadow-lift'
          >
            <div className='flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700'>
              <Check className='h-3.5 w-3.5' strokeWidth={3} aria-hidden />
              Identificado
            </div>
            <PokemonImage src={result.pokemon.imageUrl} name={result.pokemon.displayName} eager className='mt-2 h-28 w-28' />
            <div className='font-mono text-[13px] font-semibold text-ink-400 tabular'>{formatDexNumber(result.pokemon.nationalDexNumber)}</div>
            <div className='text-[22px] leading-tight font-bold tracking-tight'>{result.pokemon.displayName}</div>
            {result.count > 1 && <div className='mt-1 text-[13px] font-semibold text-ink-500 tabular'>×{result.count} nesta organização</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

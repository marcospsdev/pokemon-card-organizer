import { Check, Keyboard } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { cn, formatDexNumber } from '@/lib/format'
import type { MatchCandidate, Pokemon } from '@/types'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

interface PokemonConfirmationProps {
  candidates: MatchCandidate[]
  onConfirm: (pokemon: Pokemon, confidence: number) => void
  onSkip: () => void
  onManual: () => void
}

export function PokemonConfirmation({ candidates, onConfirm, onSkip, onManual }: PokemonConfirmationProps) {
  const [selection, setSelection] = useState({ candidates, index: 0 })
  const selected = selection.candidates === candidates ? selection.index : 0
  const setSelected = (index: number) => setSelection({ candidates, index })
  const open = candidates.length > 0

  const chosen = candidates[selected]

  return (
    <BottomSheet
      open={open}
      onClose={onSkip}
      tone='dark'
      title='Não conseguimos identificar com certeza'
      description='Você quis dizer:'
    >
      <div role='radiogroup' aria-label='Sugestões' className='flex flex-col gap-2'>
        {candidates.map((candidate, position) => {
          const active = position === selected
          return (
            <motion.button
              key={candidate.pokemon.id}
              type='button'
              role='radio'
              aria-checked={active}
              onClick={() => setSelected(position)}
              onDoubleClick={() => onConfirm(candidate.pokemon, candidate.score)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: position * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl p-2.5 pr-4 text-left ring-1 transition-colors',
                active ? 'bg-white text-ink-900 ring-white' : 'bg-white/5 text-white ring-white/10 hover:bg-white/10',
              )}
            >
              <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl', active ? 'bg-ink-100' : 'bg-white/5')}>
                <PokemonImage src={candidate.pokemon.spriteUrl} name={candidate.pokemon.displayName} pixel eager className='h-14 w-14' />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-[17px] font-semibold'>{candidate.pokemon.displayName}</span>
                <span className={cn('block font-mono text-[13px] tabular', active ? 'text-ink-500' : 'text-white/50')}>
                  {formatDexNumber(candidate.pokemon.nationalDexNumber)} · {Math.round(candidate.score * 100)}%
                </span>
              </span>
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full ring-2',
                  active ? 'bg-dex-500 text-white ring-dex-500' : 'ring-white/25',
                )}
              >
                {active && <Check className='h-4 w-4' strokeWidth={3} />}
              </span>
            </motion.button>
          )
        })}
      </div>
      <div className='mt-5 flex flex-col gap-2'>
        <Button size='lg' block disabled={!chosen} onClick={() => chosen && onConfirm(chosen.pokemon, chosen.score)}>
          Confirmar {chosen ? chosen.pokemon.displayName : ''}
        </Button>
        <div className='grid grid-cols-2 gap-2'>
          <Button variant='glass' onClick={onManual} icon={<Keyboard className='h-4 w-4' />}>
            Digitar nome
          </Button>
          <Button variant='glass' onClick={onSkip}>
            Ignorar carta
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

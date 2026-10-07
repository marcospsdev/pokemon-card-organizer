import { Check, CircleCheck, GripVertical, RotateCcw, TriangleAlert } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, formatDexNumber } from '@/lib/format'
import { outOfOrderItems, type SortGroup } from '@/services/sortingService'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Primitives'
import { PokemonImage } from '@/components/pokemon/PokemonImage'
import { SortableStrip } from './SortableStrip'

type Mode = 'sequence' | 'check'

interface SequenceViewProps {
  groups: SortGroup[]
  currentIndex: number
}

function MiniCard({ group, tone }: { group: SortGroup; tone: 'done' | 'current' | 'next' | 'table' | 'wrong' }) {
  return (
    <div
      className={cn(
        'relative flex w-[78px] flex-col overflow-hidden rounded-[12px] bg-white text-ink-900 transition-all duration-300',
        tone === 'current' && 'w-[96px] shadow-lift ring-[3px] ring-dex-400',
        tone === 'done' && 'opacity-60',
        tone === 'next' && 'opacity-40 blur-[0.6px]',
        tone === 'wrong' && 'ring-[3px] ring-volt-500',
        tone === 'table' && 'shadow-card',
      )}
    >
      <div className='flex aspect-square items-center justify-center bg-gradient-to-b from-ink-50 to-white p-1.5'>
        <PokemonImage src={group.imageUrl} name={group.name} className='h-full w-full' />
      </div>
      <div className='px-1.5 pt-0.5 pb-1.5 text-center'>
        <div className='font-mono text-[10px] font-semibold text-ink-400 tabular'>{formatDexNumber(group.pokedexNumber)}</div>
        <div className='truncate text-[11px] font-bold uppercase'>{group.name}</div>
      </div>
      {tone === 'done' && (
        <span className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white'>
          <Check className='h-3 w-3' strokeWidth={3.2} />
        </span>
      )}
      {group.count > 1 && tone !== 'done' && (
        <span className='absolute top-1 right-1 rounded-full bg-ink-900 px-1.5 text-[9px] leading-4 font-bold text-white tabular'>×{group.count}</span>
      )}
    </div>
  )
}

export function SequenceView({ groups, currentIndex }: SequenceViewProps) {
  const [mode, setMode] = useState<Mode>('sequence')
  const reduceMotion = useReducedMotion()
  const currentRef = useRef<HTMLLIElement>(null)
  const onTable = useMemo(() => groups.filter((group) => group.placed > 0), [groups])
  const [arranged, setArranged] = useState<number[]>([])

  const tableOrder = useMemo(() => {
    const present = new Set(onTable.map((group) => group.pokedexNumber))
    const kept = arranged.filter((dex) => present.has(dex))
    const added = onTable.map((group) => group.pokedexNumber).filter((dex) => !kept.includes(dex))
    return [...kept, ...added]
  }, [arranged, onTable])

  useEffect(() => {
    if (mode === 'sequence') currentRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [currentIndex, mode, reduceMotion])

  const byDex = useMemo(() => new Map(groups.map((group) => [group.pokedexNumber, group])), [groups])
  const misplaced = useMemo(() => new Set(outOfOrderItems(tableOrder)), [tableOrder])

  const hints = useMemo(() => {
    const correct = [...tableOrder].sort((a, b) => a - b)
    return [...misplaced].slice(0, 3).map((dex) => {
      const group = byDex.get(dex)
      const position = correct.indexOf(dex)
      const before = position > 0 ? byDex.get(correct[position - 1]) : undefined
      return { dex, text: before ? `Mova ${group?.name} para depois de ${before.name}.` : `Mova ${group?.name} para o início da mesa.` }
    })
  }, [misplaced, tableOrder, byDex])

  const reorder = (from: number, to: number) => {
    const next = [...tableOrder]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setArranged(next)
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      <SegmentedControl
        label='Modo da sequência'
        tone='dark'
        value={mode}
        onChange={setMode}
        options={[
          { value: 'sequence', label: 'Sequência completa' },
          { value: 'check', label: 'Conferir mesa' },
        ]}
      />

      {mode === 'sequence' ? (
        <div className='felt -mx-4 flex flex-1 items-center rounded-none py-8 sm:mx-0 sm:rounded-[28px]'>
          <ol className='no-scrollbar flex w-full snap-x items-center gap-2 overflow-x-auto px-[40vw] py-4 sm:px-[30%]' aria-label='Sequência pela Pokédex'>
            {groups.map((group, position) => {
              const tone = group.done ? 'done' : position === currentIndex ? 'current' : 'next'
              return (
                <motion.li
                  key={group.pokedexNumber}
                  ref={position === currentIndex ? currentRef : undefined}
                  layout
                  className='flex shrink-0 snap-center items-center gap-2'
                  aria-current={position === currentIndex ? 'step' : undefined}
                >
                  <MiniCard group={group} tone={tone} />
                  {position < groups.length - 1 && <span className='text-white/20' aria-hidden>→</span>}
                </motion.li>
              )
            })}
          </ol>
        </div>
      ) : (
        <div className='flex flex-1 flex-col gap-3'>
          <p className='text-[14px] leading-snug text-white/60'>
            Arraste as cartas para reproduzir o que está na sua mesa agora. Mostramos quais estão fora de ordem e como corrigir.
          </p>
          {tableOrder.length === 0 ? (
            <div className='rounded-2xl bg-white/5 p-6 text-center text-[15px] text-white/60'>Nenhuma carta foi colocada na mesa ainda.</div>
          ) : (
            <>
              <div className='felt -mx-4 overflow-x-auto px-4 py-6 sm:mx-0 sm:rounded-[28px] [perspective:1000px]'>
                <div className='origin-bottom [transform:rotateX(10deg)]'>
                  <SortableStrip
                    label='Cartas na mesa (arraste para reordenar)'
                    items={tableOrder}
                    getKey={(dex) => dex}
                    onReorder={reorder}
                    className='w-max gap-2.5'
                    renderItem={(dex) => {
                      const group = byDex.get(dex)
                      if (!group) return null
                      return (
                        <div className='relative cursor-grab active:cursor-grabbing'>
                          <MiniCard group={group} tone={misplaced.has(dex) ? 'wrong' : 'table'} />
                          <GripVertical className='absolute top-1 left-0.5 h-3.5 w-3.5 text-ink-300' aria-hidden />
                        </div>
                      )
                    }}
                  />
                </div>
              </div>
              {misplaced.size === 0 ? (
                <div className='flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 p-4 text-[15px] font-semibold text-emerald-300'>
                  <CircleCheck className='h-5 w-5 shrink-0' /> Mesa em ordem. Tudo segue a Pokédex.
                </div>
              ) : (
                <div className='rounded-2xl bg-volt-500/10 p-4 ring-1 ring-volt-500/25'>
                  <div className='flex items-center gap-2 text-[15px] font-semibold text-volt-400'>
                    <TriangleAlert className='h-5 w-5 shrink-0' />
                    {misplaced.size === 1 ? '1 carta fora de ordem' : `${misplaced.size} cartas fora de ordem`}
                  </div>
                  <ul className='mt-2 space-y-1 text-[14px] text-white/80'>
                    {hints.map((hint) => (
                      <li key={hint.dex}>{hint.text}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                variant='glass'
                size='sm'
                className='self-start'
                icon={<RotateCcw className='h-4 w-4' />}
                onClick={() => setArranged([...tableOrder].sort((a, b) => a - b))}
              >
                Restaurar ordem correta
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

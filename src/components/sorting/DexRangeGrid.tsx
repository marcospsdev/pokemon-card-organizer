import { useMemo, useState } from 'react'
import { cn, formatDexNumber, pluralize } from '@/lib/format'
import { artworkUrl } from '@/services/pokeApiService'
import { dexRange, type SortGroup } from '@/services/sortingService'
import type { Pokemon } from '@/types'
import { SegmentedControl } from '@/components/ui/Primitives'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

type Scope = 'collection' | 'full'

interface DexRangeGridProps {
  groups: SortGroup[]
  pokemonById: Map<number, Pokemon>
  totalSpecies: number
}

export function DexRangeGrid({ groups, pokemonById, totalSpecies }: DexRangeGridProps) {
  const [scope, setScope] = useState<Scope>('collection')
  const first = groups[0]?.pokedexNumber ?? 1
  const last = groups.at(-1)?.pokedexNumber ?? 1

  const generationBounds = useMemo(() => {
    const bounds = new Map<number, { from: number; to: number }>()
    for (const pokemon of pokemonById.values()) {
      const current = bounds.get(pokemon.generation)
      if (!current) bounds.set(pokemon.generation, { from: pokemon.nationalDexNumber, to: pokemon.nationalDexNumber })
      else {
        current.from = Math.min(current.from, pokemon.nationalDexNumber)
        current.to = Math.max(current.to, pokemon.nationalDexNumber)
      }
    }
    return bounds
  }, [pokemonById])

  const firstGeneration = pokemonById.get(first)?.generation
  const lastGeneration = pokemonById.get(last)?.generation
  const collectionFrom = (firstGeneration !== undefined ? generationBounds.get(firstGeneration)?.from : undefined) ?? first
  const collectionTo = (lastGeneration !== undefined ? generationBounds.get(lastGeneration)?.to : undefined) ?? last
  const from = scope === 'full' ? 1 : collectionFrom
  const to = scope === 'full' ? Math.max(totalSpecies, last) : collectionTo

  const items = useMemo(() => dexRange(groups, from, to), [groups, from, to])
  const missing = items.filter((item) => !item.group).length

  return (
    <section className='w-full text-left' aria-label='Sua coleção na Pokédex'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-[20px] font-bold tracking-[-0.02em]'>Sua coleção na Pokédex</h2>
          <p className='mt-0.5 text-[14px] text-white/75 tabular'>
            {formatDexNumber(from)} → {formatDexNumber(to)} · {items.length - missing} de {items.length} ·{' '}
            {missing === 0 ? 'nenhuma lacuna' : pluralize(missing, 'falta', 'faltam')}
          </p>
        </div>
        <SegmentedControl
          label='Faixa da Pokédex'
          tone='dark'
          value={scope}
          onChange={setScope}
          options={[
            { value: 'collection', label: 'Suas gerações' },
            { value: 'full', label: 'Pokédex inteira' },
          ]}
        />
      </div>

      <ol className='mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8'>
        {items.map(({ pokedexNumber, group }) => {
          const pokemon = pokemonById.get(pokedexNumber)
          const name = group?.name ?? pokemon?.displayName ?? ''
          return (
            <li
              key={pokedexNumber}
              aria-label={`${formatDexNumber(pokedexNumber)} ${name}${group ? `, ${pluralize(group.count, 'carta', 'cartas')}` : ', falta'}`}
              className={cn(
                'relative flex aspect-[63/88] flex-col overflow-hidden rounded-[10px]',
                group ? 'bg-white text-ink-900 shadow-card' : 'border-[1.5px] border-dashed border-white/35 bg-white/5 text-white',
              )}
            >
              <div className={cn('flex min-h-0 flex-1 items-center justify-center p-[10%]', !group && 'opacity-60')}>
                <PokemonImage
                  src={group?.imageUrl ?? pokemon?.imageUrl ?? artworkUrl(pokedexNumber)}
                  name={name}
                  className={cn('h-full w-full', !group && 'brightness-0 invert')}
                />
              </div>
              <div className={cn('px-1 pb-1 text-center', !group && 'text-white/60')}>
                <div className='font-mono text-[9px] leading-tight font-semibold tabular'>{formatDexNumber(pokedexNumber)}</div>
                <div className='truncate text-[10px] leading-tight font-bold uppercase'>{name}</div>
              </div>
              {group && group.count > 1 && (
                <span className='absolute top-1 right-1 rounded-full bg-dex-500 px-1 text-[9px] leading-[14px] font-bold text-white tabular'>×{group.count}</span>
              )}
              {!group && (
                <span className='absolute top-1 left-1 rounded-full bg-white/15 px-1.5 text-[8px] leading-[14px] font-bold tracking-wide uppercase'>Falta</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

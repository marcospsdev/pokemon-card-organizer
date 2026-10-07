import { cn, formatDexNumber, typeMeta } from '@/lib/format'
import { PokemonImage } from './PokemonImage'

export interface PokemonCardData {
  name: string
  number: number
  imageUrl: string
  types?: string[]
}

type CardSize = 'xs' | 'sm' | 'md' | 'lg'

interface PokemonCardProps {
  pokemon: PokemonCardData
  size?: CardSize
  count?: number
  className?: string
  muted?: boolean
  eager?: boolean
}

const SIZES: Record<CardSize, { width: string; name: string; number: string; padding: string }> = {
  xs: { width: 'w-[64px]', name: 'text-[9px]', number: 'text-[9px]', padding: 'p-1' },
  sm: { width: 'w-[92px]', name: 'text-[11px]', number: 'text-[10px]', padding: 'p-1.5' },
  md: { width: 'w-[150px]', name: 'text-[15px]', number: 'text-xs', padding: 'p-2.5' },
  lg: { width: 'w-[220px]', name: 'text-xl', number: 'text-sm', padding: 'p-3' },
}

export function PokemonCard({ pokemon, size = 'md', count, className, muted, eager }: PokemonCardProps) {
  const primary = typeMeta(pokemon.types?.[0] ?? 'normal')
  const secondary = typeMeta(pokemon.types?.[1] ?? pokemon.types?.[0] ?? 'normal')
  const scale = SIZES[size]

  return (
    <div
      className={cn(
        'relative aspect-[63/88] shrink-0 rounded-[var(--radius-card)] bg-white shadow-card ring-1 ring-black/5',
        scale.width,
        scale.padding,
        muted && 'opacity-45 saturate-50',
        className,
      )}
    >
      <div
        className='relative flex h-full flex-col overflow-hidden rounded-[10px]'
        style={{ background: `linear-gradient(160deg, ${primary.soft} 0%, #ffffff 55%, ${secondary.soft} 100%)` }}
      >
        <div className={cn('flex items-center justify-between px-1.5 pt-1 font-mono font-semibold text-ink-500 tabular', scale.number)}>
          <span>{formatDexNumber(pokemon.number)}</span>
          {size !== 'xs' && <span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: primary.color }} aria-hidden />}
        </div>
        <div className='flex min-h-0 flex-1 items-center justify-center px-1'>
          <PokemonImage src={pokemon.imageUrl} name={pokemon.name} eager={eager} className='h-full max-h-full w-full drop-shadow-[0_6px_8px_rgb(17_19_24/0.18)]' />
        </div>
        <div className={cn('truncate px-1.5 pb-1.5 text-center font-bold tracking-tight text-ink-900 uppercase', scale.name)}>
          {pokemon.name}
        </div>
        <div className='h-1 w-full' style={{ background: `linear-gradient(90deg, ${primary.color}, ${secondary.color})` }} aria-hidden />
      </div>
      {count !== undefined && count > 1 && (
        <span className='absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink-900 px-1.5 text-[11px] font-bold text-white tabular shadow-card ring-2 ring-white'>
          ×{count}
        </span>
      )}
    </div>
  )
}

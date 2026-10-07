import { useState } from 'react'
import { cn } from '@/lib/format'
import { PokeballMark } from '@/components/ui/Primitives'

interface PokemonImageProps {
  src: string
  name: string
  className?: string
  pixel?: boolean
  eager?: boolean
}

export function PokemonImage({ src, name, className, pixel, eager }: PokemonImageProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) {
    return (
      <div role='img' aria-label={name} className={cn('flex items-center justify-center text-ink-300', className)}>
        <PokeballMark className='h-1/2 w-1/2' />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      loading={eager ? 'eager' : 'lazy'}
      decoding='async'
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        'object-contain transition-opacity duration-300 select-none',
        pixel && 'pixelated',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}

import { ChevronLeft, ChevronRight, Layers, RotateCw } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cn, formatDexNumber, pluralize, regionLabel, typeMeta } from '@/lib/format'
import { usePokemonDetail, usePokemonIndex } from '@/hooks/usePokemonData'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { IconButton } from '@/components/ui/Button'
import { TypeBadge } from '@/components/ui/Primitives'
import { CardFlip } from '@/components/pokemon/CardFlip'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidade',
}

export function PokedexDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const { byId, list } = usePokemonIndex()
  const pokemon = byId.get(id)
  const detail = usePokemonDetail(Number.isFinite(id) ? id : undefined)
  const organizations = useOrganizationsStore((state) => state.organizations)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)

  const ownership = useMemo(
    () =>
      organizations
        .map((organization) => ({ organization, count: organization.cards.filter((card) => card.pokedexNumber === id).length }))
        .filter((item) => item.count > 0),
    [organizations, id],
  )
  const total = ownership.reduce((sum, item) => sum + item.count, 0)

  const position = list.findIndex((item) => item.id === id)
  const previous = position > 0 ? list[position - 1] : undefined
  const next = position >= 0 && position < list.length - 1 ? list[position + 1] : undefined

  const go = (target: typeof previous, dir: number) => {
    if (!target) return
    setDirection(dir)
    setFlipped(false)
    navigate(`/pokedex/${target.id}`, { replace: true })
  }

  const handleSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70) go(next, 1)
    else if (info.offset.x > 70) go(previous, -1)
  }

  if (!pokemon) {
    return (
      <div className='pt-20 text-center text-ink-500'>
        {list.length ? 'Pokémon não encontrado.' : 'Carregando…'}
        <div className='mt-4'>
          <Link to='/pokedex' className='font-semibold text-dex-500'>
            Voltar para a Pokédex
          </Link>
        </div>
      </div>
    )
  }

  const primary = typeMeta(pokemon.types[0] ?? 'normal')
  const secondary = typeMeta(pokemon.types[1] ?? pokemon.types[0] ?? 'normal')
  const data = detail.data

  const front = (
    <div
      className='flex h-full flex-col overflow-hidden rounded-[30px] p-3 shadow-lift ring-1 ring-black/5'
      style={{ background: `linear-gradient(155deg, ${primary.color} 0%, ${secondary.color} 100%)` }}
    >
      <div className='relative flex h-full flex-col rounded-[22px] bg-white/95'>
        <div className='flex items-center justify-between px-5 pt-4'>
          <span className='font-mono text-[15px] font-bold text-ink-400 tabular'>{formatDexNumber(pokemon.nationalDexNumber)}</span>
          <span className='flex items-center gap-1 text-[12px] font-semibold text-ink-400'>
            <RotateCw className='h-3.5 w-3.5' aria-hidden /> Toque para virar
          </span>
        </div>
        <div className='relative flex min-h-0 flex-1 items-center justify-center'>
          <div className='absolute h-[70%] w-[70%] rounded-full' style={{ background: `radial-gradient(circle, ${primary.soft} 0%, transparent 70%)` }} />
          <PokemonImage src={pokemon.imageUrl} name={pokemon.displayName} eager className='relative h-[82%] w-[82%] drop-shadow-[0_18px_22px_rgb(17_19_24/0.25)]' />
        </div>
        <div className='px-5 pb-5 text-center'>
          <h1 className='text-[30px] leading-tight font-bold tracking-[-0.03em] uppercase'>{pokemon.displayName}</h1>
          <div className='mt-2 flex justify-center gap-1.5'>
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const back = (
    <div className='flex h-full flex-col overflow-hidden rounded-[30px] bg-ink-900 p-5 text-left text-white shadow-lift'>
      <div className='flex items-center justify-between'>
        <span className='font-mono text-[15px] font-bold text-white/50 tabular'>{formatDexNumber(pokemon.nationalDexNumber)}</span>
        <span className='rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold'>
          Geração {pokemon.generation} · {regionLabel(pokemon.region)}
        </span>
      </div>
      <div className='mt-3 text-[24px] font-bold tracking-tight'>{pokemon.displayName}</div>
      <div className='text-[14px] text-white/60'>{data?.genus || (detail.isLoading ? 'Carregando…' : '')}</div>
      {data?.flavorText && <p className='mt-3 line-clamp-4 text-[14px] leading-snug text-white/80'>{data.flavorText}</p>}
      {data && (
        <>
          <div className='mt-4 grid grid-cols-2 gap-2'>
            <div className='rounded-2xl bg-white/5 p-3'>
              <div className='text-[12px] text-white/50'>Altura</div>
              <div className='text-[17px] font-semibold tabular'>{data.heightMeters.toLocaleString('pt-BR')} m</div>
            </div>
            <div className='rounded-2xl bg-white/5 p-3'>
              <div className='text-[12px] text-white/50'>Peso</div>
              <div className='text-[17px] font-semibold tabular'>{data.weightKg.toLocaleString('pt-BR')} kg</div>
            </div>
          </div>
          <div className='mt-4 space-y-1.5'>
            {data.stats.map((stat) => (
              <div key={stat.name} className='flex items-center gap-2 text-[12px]'>
                <span className='w-[72px] shrink-0 text-white/60'>{STAT_LABELS[stat.name] ?? stat.name}</span>
                <span className='w-7 shrink-0 text-right font-semibold tabular'>{stat.value}</span>
                <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-white/10'>
                  <span className='block h-full rounded-full' style={{ width: `${Math.min(100, (stat.value / 180) * 100)}%`, backgroundColor: primary.color }} />
                </span>
              </div>
            ))}
          </div>
          {data.abilities.length > 0 && <div className='mt-auto pt-3 text-[12px] text-white/50'>Habilidades: {data.abilities.join(', ')}</div>}
        </>
      )}
    </div>
  )

  return (
    <div className='pb-6'>
      <div className='flex items-center justify-between pt-3 pb-4'>
        <IconButton label='Voltar' tone='plain' onClick={() => navigate('/pokedex')}>
          <ChevronLeft className='h-5 w-5' />
        </IconButton>
        <div className='flex gap-2'>
          <IconButton label={previous ? `Anterior: ${previous.displayName}` : 'Sem anterior'} disabled={!previous} onClick={() => go(previous, -1)}>
            <ChevronLeft className='h-5 w-5' />
          </IconButton>
          <IconButton label={next ? `Próximo: ${next.displayName}` : 'Sem próximo'} disabled={!next} onClick={() => go(next, 1)}>
            <ChevronRight className='h-5 w-5' />
          </IconButton>
        </div>
      </div>

      <div className='mx-auto max-w-md'>
        <AnimatePresence mode='popLayout' custom={direction} initial={false}>
          <motion.div
            key={pokemon.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, rotate: direction * 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: direction * -80, rotate: direction * -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag='x'
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleSwipe}
          >
            <CardFlip
              label={`Carta de ${pokemon.displayName}. ${flipped ? 'Mostrando informações' : 'Mostrar informações'}`}
              flipped={flipped}
              onFlippedChange={setFlipped}
              front={front}
              back={back}
              className='aspect-[63/88] w-full'
            />
          </motion.div>
        </AnimatePresence>

        <section className='mt-5 rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-ink-200/60' aria-label='Suas cartas'>
          <div className='flex items-center gap-3'>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', total ? 'bg-dex-500 text-white' : 'bg-ink-100 text-ink-400')}>
              <Layers className='h-5 w-5' aria-hidden />
            </div>
            <div>
              <div className='text-[17px] font-bold tracking-tight tabular'>{total ? `Você possui ×${total}` : 'Não possui'}</div>
              <div className='text-[13px] text-ink-500'>
                {total ? `Em ${pluralize(ownership.length, 'organização', 'organizações')}` : 'Escaneie uma carta deste Pokémon para registrá-la.'}
              </div>
            </div>
          </div>
          {ownership.length > 0 && (
            <ul className='mt-3 divide-y divide-ink-100'>
              {ownership.map(({ organization, count }) => (
                <li key={organization.id}>
                  <Link to={`/organizations/${organization.id}`} className='flex items-center justify-between py-2.5 text-[15px]'>
                    <span className='font-medium'>{organization.name}</span>
                    <span className='font-semibold text-ink-500 tabular'>×{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

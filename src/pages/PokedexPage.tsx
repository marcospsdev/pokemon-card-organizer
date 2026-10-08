import { Check, Copy, GalleryHorizontal, LayoutGrid, MapPin, Shapes, X } from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TYPE_META, cn, copyText, formatDexNumber, normalizeText, pluralize, regionLabel, typeMeta } from '@/lib/format'
import { useOwnedCounts, usePokemonIndex } from '@/hooks/usePokemonData'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { toast } from '@/store/toastStore'
import type { Pokemon } from '@/types'
import { Button, IconButton } from '@/components/ui/Button'
import { LargeTitle, SegmentedControl, TypeBadge } from '@/components/ui/Primitives'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DepthCarousel } from '@/components/pokemon/DepthCarousel'
import { PokedexCard } from '@/components/pokemon/PokedexCard'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { PokemonSearch, type SearchSuggestion } from '@/components/pokemon/PokemonSearch'

type Ownership = 'all' | 'owned' | 'missing'
type ViewMode = 'grid' | 'carousel'

const PAGE_SIZE = 60

function matchesQuery(pokemon: Pokemon, query: string) {
  const numeric = query.replace(/^#/, '')
  if (/^\d+$/.test(numeric)) return String(pokemon.nationalDexNumber).startsWith(String(Number(numeric)))
  const key = normalizeText(query)
  if (!key) return true
  return (
    normalizeText(pokemon.name).includes(key) ||
    normalizeText(pokemon.region) === key ||
    pokemon.types.some((type) => type === key || normalizeText(typeMeta(type).label) === key)
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
        active ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  )
}

export function PokedexPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { list, regions, matcher, isLoading, isError, refetch } = usePokemonIndex()
  const organizations = useOrganizationsStore((state) => state.organizations)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const owned = useOwnedCounts(organizationId)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [paging, setPaging] = useState({ key: '', visible: PAGE_SIZE, carousel: 0 })
  const sentinelRef = useRef<HTMLDivElement>(null)

  const ownership = (params.get('show') as Ownership | null) ?? 'all'
  const generation = params.get('gen') ? Number(params.get('gen')) : null
  const type = params.get('type')
  const view = (params.get('view') as ViewMode | null) ?? 'grid'

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value === null) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const filterKey = [ownership, generation, type, deferredQuery, organizationId].join('|')
  const visible = paging.key === filterKey ? paging.visible : PAGE_SIZE
  const carouselIndex = paging.key === filterKey ? paging.carousel : 0
  const setCarouselIndex = (carousel: number) => setPaging({ key: filterKey, visible, carousel })

  const filtered = useMemo(
    () =>
      list.filter((pokemon) => {
        const count = owned.get(pokemon.nationalDexNumber) ?? 0
        if (ownership === 'owned' && count === 0) return false
        if (ownership === 'missing' && count > 0) return false
        if (generation !== null && pokemon.generation !== generation) return false
        if (type && !pokemon.types.includes(type)) return false
        return matchesQuery(pokemon, deferredQuery.trim())
      }),
    [list, owned, ownership, generation, type, deferredQuery],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || view !== 'grid') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPaging({ key: filterKey, carousel: 0, visible: visible + PAGE_SIZE })
      },
      { rootMargin: '800px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [view, filtered.length, filterKey, visible])

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    const key = normalizeText(trimmed)
    const pokemon = matcher.search(trimmed, 5).map<SearchSuggestion>((item) => ({
      id: `p-${item.id}`,
      title: item.displayName,
      subtitle: item.types.map((value) => typeMeta(value).label).join(' · '),
      imageUrl: item.spriteUrl,
      number: item.nationalDexNumber,
      onSelect: () => navigate(`/pokedex/${item.id}`),
    }))
    const typeMatches = key.length < 2 ? [] : Object.entries(TYPE_META).filter(([value, meta]) => value.startsWith(key) || normalizeText(meta.label).startsWith(key))
    const types = typeMatches.slice(0, 2).map<SearchSuggestion>(([value, meta]) => ({
      id: `t-${value}`,
      title: meta.label,
      subtitle: 'Filtrar por tipo',
      icon: <Shapes className='h-5 w-5' style={{ color: meta.color }} />,
      onSelect: () => {
        setParam('type', value)
        setQuery('')
      },
    }))
    const regionMatches = key.length < 2 ? [] : regions.filter(([, region]) => region.startsWith(key))
    const regionItems = regionMatches.slice(0, 2).map<SearchSuggestion>(([gen, region]) => ({
      id: `r-${gen}`,
      title: regionLabel(region),
      subtitle: `Geração ${gen}`,
      icon: <MapPin className='h-5 w-5 text-lens-500' />,
      onSelect: () => {
        setParam('gen', String(gen))
        setQuery('')
      },
    }))
    return [...regionItems, ...types, ...pokemon]
  }, [query, matcher, regions, navigate, setParam])

  const ownedCount = owned.size
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyList = async () => {
    const text = filtered.map((pokemon) => `${formatDexNumber(pokemon.nationalDexNumber)} ${pokemon.displayName}`).join('\n')
    if (await copyText(text)) {
      setCopied(true)
      toast(pluralize(filtered.length, 'Pokémon copiado', 'Pokémon copiados'), { tone: 'success' })
    } else {
      toast('Não foi possível copiar a lista', { tone: 'error' })
    }
  }

  return (
    <div>
      <LargeTitle
        title='Pokédex'
        subtitle={list.length ? `Você possui ${ownedCount} de ${list.length}` : 'National Pokédex'}
        trailing={
          <div className='flex items-center gap-2'>
            <IconButton
              label={`Copiar lista (${pluralize(filtered.length, 'Pokémon', 'Pokémon')})`}
              onClick={() => void copyList()}
              disabled={filtered.length === 0}
              className='disabled:opacity-40'
            >
              {copied ? <Check className='h-[18px] w-[18px] text-emerald-600' /> : <Copy className='h-[18px] w-[18px]' />}
            </IconButton>
            <div className='w-[112px]'>
              <SegmentedControl
                label='Visualização'
                value={view}
                onChange={(value) => setParam('view', value === 'grid' ? null : value)}
                options={[
                  { value: 'grid', label: '', icon: <LayoutGrid className='h-4 w-4' aria-label='Grade' /> },
                  { value: 'carousel', label: '', icon: <GalleryHorizontal className='h-4 w-4' aria-label='Carrossel' /> },
                ]}
              />
            </div>
          </div>
        }
      />

      {list.length > 0 && <ProgressBar value={ownedCount / list.length} tone='blue' label='Pokédex completada' className='-mt-2 mb-5 h-1.5' />}

      <div className='sticky top-0 z-20 -mx-4 bg-ink-50/85 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10'>
        <PokemonSearch
          label='Pesquisar na Pokédex'
          placeholder='Pikachu, 025, Elétrico, Kanto…'
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
        />
        <div className='no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
          <Chip active={ownership === 'all'} onClick={() => setParam('show', null)}>
            Todos
          </Chip>
          <Chip active={ownership === 'owned'} onClick={() => setParam('show', 'owned')}>
            Possuo
          </Chip>
          <Chip active={ownership === 'missing'} onClick={() => setParam('show', 'missing')}>
            Não possuo
          </Chip>
          <span className='mx-1 w-px shrink-0 bg-ink-200' aria-hidden />
          {regions.map(([gen, region]) => (
            <Chip key={gen} active={generation === gen} onClick={() => setParam('gen', generation === gen ? null : String(gen))}>
              {regionLabel(region)}
            </Chip>
          ))}
        </div>
        {(type || organizations.length > 1) && (
          <div className='mt-2.5 flex flex-wrap items-center gap-2'>
            {type && (
              <button type='button' onClick={() => setParam('type', null)} className='flex items-center gap-1' aria-label={`Remover filtro ${typeMeta(type).label}`}>
                <TypeBadge type={type} />
                <X className='h-3.5 w-3.5 text-ink-400' />
              </button>
            )}
            {organizations.length > 1 && (
              <select
                aria-label='Contar cartas de'
                value={organizationId ?? ''}
                onChange={(event) => setOrganizationId(event.target.value || null)}
                className='h-8 rounded-full bg-white px-3 text-[13px] font-semibold text-ink-600 ring-1 ring-ink-200 outline-none'
              >
                <option value=''>Todas as organizações</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {isError ? (
        <div className='mt-10 text-center'>
          <p className='text-[17px] font-semibold'>Não foi possível carregar a Pokédex</p>
          <p className='mt-1 text-[15px] text-ink-500'>Verifique sua conexão com a internet.</p>
          <Button className='mt-4' onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className='mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6' aria-busy='true' aria-label='Carregando Pokédex'>
          {Array.from({ length: 18 }, (_, index) => (
            <div key={index} className='aspect-[4/5] animate-pulse rounded-[20px] bg-ink-100' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='mt-12 text-center text-[15px] text-ink-500'>Nenhum Pokémon encontrado.</div>
      ) : view === 'carousel' ? (
        <div className='mt-4'>
          <DepthCarousel
            items={filtered}
            getKey={(item) => item.id}
            label='Pokédex em carrossel'
            index={carouselIndex}
            onIndexChange={setCarouselIndex}
            onSelect={(item) => navigate(`/pokedex/${item.id}`)}
            height={380}
            spacing={150}
            renderItem={(item, { active }) => (
              <div className='flex flex-col items-center'>
                <PokemonCard
                  size='lg'
                  eager={active}
                  count={owned.get(item.nationalDexNumber)}
                  muted={!owned.get(item.nationalDexNumber) && !active}
                  pokemon={{ name: item.displayName, number: item.nationalDexNumber, imageUrl: item.imageUrl, types: item.types }}
                />
              </div>
            )}
          />
          {filtered[carouselIndex] && (
            <div className='mt-2 flex flex-col items-center gap-2 text-center'>
              <div className='flex gap-1.5'>
                {filtered[carouselIndex].types.map((value) => (
                  <TypeBadge key={value} type={value} />
                ))}
              </div>
              <div className='text-[14px] text-ink-500 tabular'>
                {owned.get(filtered[carouselIndex].nationalDexNumber)
                  ? `Você possui ×${owned.get(filtered[carouselIndex].nationalDexNumber)}`
                  : 'Não possui'}{' '}
                · {carouselIndex + 1} de {filtered.length}
              </div>
              <input
                type='range'
                min={0}
                max={filtered.length - 1}
                value={carouselIndex}
                onChange={(event) => setCarouselIndex(Number(event.target.value))}
                aria-label='Navegar pela Pokédex'
                className='mt-2 w-full max-w-sm accent-dex-500'
              />
              <div className='font-mono text-[12px] text-ink-400 tabular'>
                {formatDexNumber(filtered[0].nationalDexNumber)} — {formatDexNumber(filtered.at(-1)?.nationalDexNumber ?? 0)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className='mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
            {filtered.slice(0, visible).map((pokemon) => (
              <PokedexCard key={pokemon.id} pokemon={pokemon} owned={owned.get(pokemon.nationalDexNumber) ?? 0} />
            ))}
          </div>
          {visible < filtered.length && <div ref={sentinelRef} className='h-10' aria-hidden />}
        </>
      )}
    </div>
  )
}

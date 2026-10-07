import { ArrowLeft, ArrowRight, Minus, Plus, RefreshCcw, ScanLine, Shuffle } from 'lucide-react'
import { LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatDexNumber, pluralize } from '@/lib/format'
import { usePokemonIndex, useSortPlan } from '@/hooks/usePokemonData'
import { organizationStatus, summarize, type SortGroup } from '@/services/sortingService'
import { useOrganization, useOrganizationsStore } from '@/store/organizationsStore'
import { toast } from '@/store/toastStore'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { SegmentedControl, Stat } from '@/components/ui/Primitives'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Deck } from '@/components/pokemon/Deck'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { PokemonImage } from '@/components/pokemon/PokemonImage'
import { PokemonSearch } from '@/components/pokemon/PokemonSearch'

type PileView = 'sorted' | 'pile'

export function OrganizationSummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organization = useOrganization(id)
  const groups = useSortPlan(id)
  const { byId, matcher } = usePokemonIndex()
  const { addCard, removeCard, replaceCardPokemon, resetProgress, setActive } = useOrganizationsStore()
  const [view, setView] = useState<PileView>('sorted')
  const [editing, setEditing] = useState<SortGroup | null>(null)
  const [correcting, setCorrecting] = useState(false)
  const [query, setQuery] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const summary = useMemo(() => summarize(groups), [groups])
  const pileOrder = useMemo(() => {
    if (!organization) return []
    const seen = new Set<number>()
    return organization.cards.filter((card) => !seen.has(card.pokedexNumber) && seen.add(card.pokedexNumber)).map((card) => card.pokedexNumber)
  }, [organization])

  if (!organization || !id) return <Navigate to='/organizations' replace />

  const status = organizationStatus(organization)
  const groupByDex = new Map(groups.map((group) => [group.pokedexNumber, group]))
  const displayed = view === 'sorted' ? groups : pileOrder.map((dex) => groupByDex.get(dex)).filter((group) => group !== undefined)
  const editingGroup = editing ? groupByDex.get(editing.pokedexNumber) ?? null : null

  const startSorting = () => {
    setActive(id)
    navigate(`/organizations/${id}/sort`)
  }

  const removeOne = (group: SortGroup) => {
    const cardId = group.cardIds.at(-1)
    if (!cardId) return
    removeCard(id, cardId)
    if (group.count === 1) setEditing(null)
  }

  const correctTo = (pokemonId: number) => {
    const pokemon = byId.get(pokemonId)
    if (!editingGroup || !pokemon) return
    editingGroup.cardIds.forEach((cardId) => replaceCardPokemon(id, cardId, pokemon))
    toast(`${pluralize(editingGroup.count, 'carta corrigida', 'cartas corrigidas')} para ${pokemon.displayName}`, { tone: 'success' })
    setCorrecting(false)
    setEditing(null)
    setQuery('')
  }

  return (
    <div className='pb-28'>
      <div className='flex items-center justify-between pt-3'>
        <IconButton label='Voltar' tone='plain' onClick={() => navigate(-1)}>
          <ArrowLeft className='h-5 w-5' />
        </IconButton>
        <Link to={`/organizations/${id}/scan`} className='flex items-center gap-1.5 text-[15px] font-semibold text-dex-500'>
          <ScanLine className='h-4 w-4' /> Escanear mais
        </Link>
      </div>

      <header className='flex items-center gap-5 pt-3 pb-6'>
        <Deck cards={organization.cards} accent={organization.accent} className='w-[82px] shrink-0' />
        <div className='min-w-0'>
          <div className='text-[13px] font-semibold tracking-wide text-ink-400 uppercase'>Sua organização</div>
          <h1 className='truncate text-[30px] leading-tight font-bold tracking-[-0.03em]'>{organization.name}</h1>
          <div className='text-[15px] text-ink-500 tabular'>{pluralize(summary.totalCards, 'carta', 'cartas')}</div>
        </div>
      </header>

      {summary.totalCards === 0 ? (
        <div className='rounded-[26px] border-2 border-dashed border-ink-200 px-6 py-12 text-center'>
          <p className='text-[17px] font-semibold'>Nenhuma carta escaneada</p>
          <p className='mt-1 text-[15px] text-ink-500'>Abra o scanner e passe as cartas uma a uma em frente à câmera.</p>
          <Button className='mt-5' onClick={() => navigate(`/organizations/${id}/scan`)} icon={<ScanLine className='h-4 w-4' />}>
            Abrir scanner
          </Button>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-3 gap-2.5'>
            <Stat value={summary.totalCards} label='cartas' />
            <Stat value={summary.uniquePokemon} label='Pokémon diferentes' accent />
            <Stat value={summary.duplicates} label='duplicadas' />
          </div>

          <div className='mt-3 rounded-[22px] bg-white p-4 shadow-soft ring-1 ring-ink-200/60'>
            <div className='flex items-center justify-between text-[15px]'>
              <span className='font-semibold'>Progresso da organização</span>
              <span className='font-semibold text-ink-500 tabular'>{Math.round(summary.progress * 100)}%</span>
            </div>
            <ProgressBar value={summary.progress} label='Progresso da organização' className='mt-2.5' />
            <div className='mt-4 grid grid-cols-2 gap-3'>
              {summary.first && <Endpoint label='Primeiro' group={summary.first} />}
              {summary.last && <Endpoint label='Último' group={summary.last} />}
            </div>
          </div>

          <div className='mt-8 mb-4 flex items-center justify-between gap-3'>
            <h2 className='text-[22px] font-bold tracking-tight'>Cartas</h2>
            <div className='w-[220px]'>
              <SegmentedControl
                label='Visualização das cartas'
                value={view}
                onChange={setView}
                options={[
                  { value: 'pile', label: 'Pilha', icon: <Shuffle className='h-3.5 w-3.5' /> },
                  { value: 'sorted', label: 'Pokédex', icon: <ArrowRight className='h-3.5 w-3.5' /> },
                ]}
              />
            </div>
          </div>
          <p className='-mt-2 mb-4 text-[14px] text-ink-500'>
            {view === 'pile' ? 'A ordem em que você escaneou — sua pilha bagunçada.' : 'A ordem final, pela National Pokédex. Toque para corrigir.'}
          </p>

          <LayoutGroup>
            <ul className='grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-6'>
              {displayed.map((group) => (
                <motion.li key={group.pokedexNumber} layout transition={{ type: 'spring', stiffness: 260, damping: 26 }} className='flex justify-center'>
                  <button
                    type='button'
                    onClick={() => setEditing(group)}
                    aria-label={`${group.name} ${formatDexNumber(group.pokedexNumber)}, ${group.count} ${group.count === 1 ? 'carta' : 'cartas'}`}
                    className='rounded-[14px]'
                  >
                    <PokemonCard
                      size='sm'
                      count={group.count}
                      muted={group.done}
                      pokemon={{ name: group.name, number: group.pokedexNumber, imageUrl: group.imageUrl, types: byId.get(group.pokemonId)?.types }}
                    />
                  </button>
                </motion.li>
              ))}
            </ul>
          </LayoutGroup>

          {summary.placedCards > 0 && (
            <button type='button' onClick={() => setConfirmReset(true)} className='mx-auto mt-8 flex items-center gap-2 text-[14px] font-semibold text-ink-500'>
              <RefreshCcw className='h-4 w-4' /> Recomeçar organização física
            </button>
          )}

          <div className='fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 px-4 lg:bottom-6 lg:left-64'>
            <div className='mx-auto max-w-md'>
              <Button size='lg' block onClick={status === 'completed' ? () => navigate(`/organizations/${id}/done`) : startSorting} icon={<ArrowRight className='h-5 w-5' />}>
                {status === 'completed' ? 'Ver resultado' : status === 'sorting' ? 'Continuar organização' : 'Começar organização'}
              </Button>
            </div>
          </div>
        </>
      )}

      <BottomSheet open={editingGroup !== null && !correcting} onClose={() => setEditing(null)}>
        {editingGroup && (
          <div className='flex flex-col items-center text-center'>
            <PokemonImage src={editingGroup.imageUrl} name={editingGroup.name} className='h-32 w-32' eager />
            <div className='mt-2 font-mono text-[13px] font-semibold text-ink-400'>{formatDexNumber(editingGroup.pokedexNumber)}</div>
            <div className='text-[24px] font-bold tracking-tight'>{editingGroup.name}</div>
            <div className='mt-4 flex items-center gap-4'>
              <IconButton label='Remover uma carta' onClick={() => removeOne(editingGroup)}>
                <Minus className='h-5 w-5' />
              </IconButton>
              <div className='min-w-[90px] text-[15px] font-semibold tabular'>×{editingGroup.count} {editingGroup.count === 1 ? 'carta' : 'cartas'}</div>
              <IconButton
                label='Adicionar uma carta'
                onClick={() => {
                  const pokemon = byId.get(editingGroup.pokemonId)
                  if (pokemon) addCard(id, pokemon, 1, 'manual')
                }}
              >
                <Plus className='h-5 w-5' />
              </IconButton>
            </div>
            <div className='mt-6 flex w-full flex-col gap-2'>
              <Button variant='secondary' size='lg' block onClick={() => setCorrecting(true)}>
                Corrigir Pokémon
              </Button>
              <Button variant='ghost' size='lg' block onClick={() => navigate(`/pokedex/${editingGroup.pokemonId}`)}>
                Ver na Pokédex
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={correcting}
        onClose={() => {
          setCorrecting(false)
          setQuery('')
        }}
        title='Corrigir identificação'
        description={editingGroup ? `Qual Pokémon está nas cartas marcadas como ${editingGroup.name}?` : undefined}
      >
        <PokemonSearch
          label='Pesquisar Pokémon'
          placeholder='Nome ou número'
          value={query}
          onChange={setQuery}
          autoFocus
          inline
          suggestions={matcher.search(query, 6).map((pokemon) => ({
            id: String(pokemon.id),
            title: pokemon.displayName,
            imageUrl: pokemon.spriteUrl,
            number: pokemon.nationalDexNumber,
            onSelect: () => correctTo(pokemon.id),
          }))}
        />
      </BottomSheet>

      <ConfirmModal
        open={confirmReset}
        title='Recomeçar organização?'
        description='O progresso da mesa será zerado. As cartas escaneadas continuam salvas.'
        confirmLabel='Recomeçar'
        onClose={() => setConfirmReset(false)}
        onConfirm={() => resetProgress(id)}
      />
    </div>
  )
}

function Endpoint({ label, group }: { label: string; group: SortGroup }) {
  return (
    <div className='flex items-center gap-3 rounded-2xl bg-ink-50 p-2.5'>
      <PokemonImage src={group.imageUrl} name={group.name} className='h-11 w-11 shrink-0' />
      <div className='min-w-0'>
        <div className='text-[12px] font-medium text-ink-500'>{label}</div>
        <div className='truncate text-[15px] font-semibold'>
          <span className='font-mono text-ink-400'>{formatDexNumber(group.pokedexNumber)}</span> {group.name}
        </div>
      </div>
    </div>
  )
}

import { Check, ChevronLeft, Minus, Plus, Undo2 } from 'lucide-react'
import { LayoutGroup } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePokemonIndex, useSortPlan } from '@/hooks/usePokemonData'
import { buildDeck, instructionFor, lastPlacedDeckIndex, nextDeckIndex, summarize } from '@/services/sortingService'
import { useSettingsStore, vibrate } from '@/store/settingsStore'
import { useOrganization, useOrganizationsStore } from '@/store/organizationsStore'
import { Button, IconButton } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Primitives'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SequenceView } from '@/components/sorting/SequenceView'
import { SortingBoard } from '@/components/sorting/SortingBoard'
import { SortingInstruction } from '@/components/sorting/SortingInstruction'

type View = 'guided' | 'sequence'

export function SortingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organization = useOrganization(id)
  const groups = useSortPlan(id)
  const { byId } = usePokemonIndex()
  const setPlaced = useOrganizationsStore((state) => state.setPlaced)
  const setActive = useOrganizationsStore((state) => state.setActive)
  const columns = useSettingsStore((state) => state.tableColumns)
  const setColumns = useSettingsStore((state) => state.setTableColumns)
  const [view, setView] = useState<View>('guided')

  const summary = useMemo(() => summarize(groups), [groups])
  const deck = useMemo(() => (organization ? buildDeck(organization.cards, organization.placed) : []), [organization])
  const deckIndex = nextDeckIndex(deck)
  const currentCard = deck[deckIndex]?.card
  const currentIndex = currentCard ? groups.findIndex((group) => group.pokedexNumber === currentCard.pokedexNumber) : -1
  const instruction = currentIndex >= 0 ? instructionFor(groups, currentIndex, columns) : null

  useEffect(() => {
    if (id) setActive(id)
  }, [id, setActive])

  useEffect(() => {
    if (id && deck.length > 0 && deckIndex === -1) {
      const timer = window.setTimeout(() => navigate(`/organizations/${id}/done`, { replace: true }), 650)
      return () => window.clearTimeout(timer)
    }
  }, [id, deck.length, deckIndex, navigate])

  if (!organization || !id) return <Navigate to='/organizations' replace />
  if (groups.length === 0) return <Navigate to={`/organizations/${id}`} replace />

  const placeCurrent = () => {
    if (!instruction) return
    const { group } = instruction
    setPlaced(id, group.pokedexNumber, group.placed + 1)
    vibrate(14)
  }

  const undo = () => {
    const last = deck[lastPlacedDeckIndex(deck)]
    if (!last) return
    const dex = last.card.pokedexNumber
    setPlaced(id, dex, (organization.placed[dex] ?? 1) - 1)
  }

  const canUndo = summary.placedCards > 0

  return (
    <div className='fixed inset-0 z-40 flex flex-col bg-ink-900 text-white'>
      <header className='flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3'>
        <IconButton label='Voltar para o resumo' tone='dark' onClick={() => navigate(`/organizations/${id}`)}>
          <ChevronLeft className='h-5 w-5' />
        </IconButton>
        <div className='min-w-0 flex-1'>
          <div className='flex items-baseline justify-between gap-2'>
            <span className='truncate text-[15px] font-semibold'>{organization.name}</span>
            <span className='shrink-0 text-[13px] font-semibold text-white/60 tabular'>
              {summary.placedCards} / {summary.totalCards} cartas
            </span>
          </div>
          <ProgressBar value={summary.progress} tone='light' label='Cartas organizadas' className='mt-1.5 h-1.5' />
        </div>
      </header>

      <div className='px-4 pb-3'>
        <SegmentedControl
          label='Modo de organização'
          tone='dark'
          value={view}
          onChange={setView}
          options={[
            { value: 'guided', label: 'Guiado' },
            { value: 'sequence', label: 'Avançado' },
          ]}
        />
      </div>

      {view === 'guided' ? (
        <LayoutGroup>
          <div className='flex min-h-0 flex-1 flex-col gap-4 px-4 lg:mx-auto lg:w-full lg:max-w-5xl lg:flex-row lg:gap-8'>
            <section className='shrink-0 lg:w-[420px] lg:pt-6' aria-label='Próxima carta'>
              {instruction ? (
                <SortingInstruction
                  instruction={instruction}
                  deckPosition={deckIndex + 1}
                  deckSize={deck.length}
                  types={byId.get(instruction.group.pokemonId)?.types}
                />
              ) : (
                <div className='flex h-[190px] items-center justify-center text-[20px] font-bold'>Tudo no lugar!</div>
              )}
            </section>
            <section className='flex min-h-0 flex-1 flex-col pb-3' aria-label='Mesa'>
              <div className='mb-2 flex items-center justify-between text-[12px] font-semibold text-white/50'>
                <span>Sua mesa · vista de cima</span>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    aria-label='Menos cartas por fileira'
                    onClick={() => setColumns(columns - 1)}
                    className='flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20'
                  >
                    <Minus className='h-3.5 w-3.5' />
                  </button>
                  <span className='min-w-[72px] text-center tabular'>{columns} por fileira</span>
                  <button
                    type='button'
                    aria-label='Mais cartas por fileira'
                    onClick={() => setColumns(columns + 1)}
                    className='flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20'
                  >
                    <Plus className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
              <div className='min-h-0 flex-1'>
                <SortingBoard groups={groups} currentIndex={currentIndex} columns={columns} />
              </div>
            </section>
          </div>
        </LayoutGroup>
      ) : (
        <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:mx-auto lg:w-full lg:max-w-5xl'>
          <SequenceView groups={groups} deck={deck} deckIndex={deckIndex} />
        </div>
      )}

      <footer className='flex items-center gap-3 border-t border-white/10 bg-ink-900/90 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:justify-center'>
        <Button variant='glass' size='lg' onClick={undo} disabled={!canUndo} icon={<Undo2 className='h-5 w-5' />} aria-label='Desfazer última carta'>
          <span className='hidden sm:inline'>Desfazer</span>
        </Button>
        <Button size='lg' block className='lg:w-[360px] lg:flex-none' onClick={placeCurrent} disabled={!instruction} icon={<Check className='h-5 w-5' strokeWidth={2.6} />}>
          Coloquei · Próxima
        </Button>
      </footer>
    </div>
  )
}

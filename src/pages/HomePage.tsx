import { ArrowRight, BookOpen, Plus, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pluralize } from '@/lib/format'
import { useOwnedCounts, usePokemonIndex } from '@/hooks/usePokemonData'
import { buildSortPlan, organizationStatus, summarize } from '@/services/sortingService'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { PokedexLens, SectionHeader } from '@/components/ui/Primitives'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DepthCarousel } from '@/components/pokemon/DepthCarousel'
import { Deck } from '@/components/pokemon/Deck'
import { OrganizationCard } from '@/components/pokemon/OrganizationCard'
import { PokemonImage } from '@/components/pokemon/PokemonImage'

export function HomePage() {
  const navigate = useNavigate()
  const organizations = useOrganizationsStore((state) => state.organizations)
  const lastActiveId = useOrganizationsStore((state) => state.lastActiveId)
  const openNew = useUiStore((state) => state.openNewOrganization)
  const owned = useOwnedCounts()
  const { list, byId } = usePokemonIndex()

  const resume = useMemo(() => {
    const candidates = [...organizations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const preferred = candidates.find((item) => item.id === lastActiveId) ?? candidates[0]
    if (!preferred) return null
    const status = organizationStatus(preferred)
    if (status === 'completed' || status === 'empty') return null
    return { organization: preferred, status, summary: summarize(buildSortPlan(preferred.cards, preferred.placed)) }
  }, [organizations, lastActiveId])

  const showcase = useMemo(
    () => [...owned.keys()].sort((a, b) => a - b).map((id) => byId.get(id)).filter((pokemon) => pokemon !== undefined).slice(0, 24),
    [owned, byId],
  )

  const sortedOrganizations = useMemo(() => [...organizations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [organizations])
  const totalSpecies = list.length || 1025

  return (
    <div className='flex flex-col gap-8'>
      <section className='relative -mx-4 overflow-hidden rounded-b-[34px] bg-gradient-to-b from-dex-500 to-dex-600 px-5 pt-6 pb-7 text-white shadow-[0_20px_40px_-24px_rgb(143_10_28/0.8)] sm:mx-0 sm:mt-4 sm:rounded-[34px]'>
        <div className='absolute -top-24 -right-20 h-64 w-64 rounded-full border-[18px] border-white/10' aria-hidden />
        <div className='absolute top-[70px] -right-20 h-1 w-56 bg-white/10' aria-hidden />
        <div className='relative'>
          <PokedexLens />
          <h1 className='mt-6 text-[34px] leading-[1.02] font-bold tracking-[-0.035em]'>PokéDex Sorter</h1>
          <p className='mt-2 max-w-xs text-[17px] leading-snug text-white/85'>Organize suas cartas pela National Pokédex.</p>
          <div className='mt-6 flex flex-wrap gap-2.5'>
            <Button
              variant='secondary'
              size='lg'
              onClick={openNew}
              icon={<Plus className='h-5 w-5' strokeWidth={2.6} />}
              className='text-dex-600 ring-0'
            >
              Nova organização
            </Button>
          </div>
        </div>
      </section>

      {resume && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center gap-4 rounded-[26px] bg-ink-900 p-4 pr-5 text-white shadow-lift'
          aria-label='Continuar organização'
        >
          <Deck cards={resume.organization.cards} accent={resume.organization.accent} className='ml-1 w-[64px] shrink-0' />
          <div className='min-w-0 flex-1'>
            <div className='text-[13px] font-medium text-white/60'>Você estava organizando</div>
            <div className='truncate text-[19px] font-bold tracking-tight'>{resume.organization.name}</div>
            <div className='mt-2 flex items-center gap-2.5'>
              <ProgressBar value={resume.summary.progress} tone='light' label='Progresso' className='h-1.5' />
              <span className='shrink-0 text-[13px] font-semibold text-white/80 tabular'>
                {resume.summary.placedCards} / {resume.summary.totalCards}
              </span>
            </div>
          </div>
          <Button
            variant='primary'
            size='sm'
            aria-label={`Continuar ${resume.organization.name}`}
            onClick={() => navigate(`/organizations/${resume.organization.id}${resume.status === 'sorting' ? '/sort' : ''}`)}
            icon={<RotateCcw className='h-4 w-4' />}
          >
            Continuar
          </Button>
        </motion.section>
      )}

      <section>
        <SectionHeader
          title='Minhas organizações'
          action={
            organizations.length > 0 && (
              <Link to='/organizations' className='text-[15px] font-semibold text-dex-500'>
                Ver todas
              </Link>
            )
          }
        />
        {organizations.length === 0 ? (
          <div className='flex flex-col items-center rounded-[26px] border-2 border-dashed border-ink-200 px-6 py-10 text-center'>
            <Deck cards={[]} accent='red' className='w-[72px]' />
            <p className='mt-6 text-[17px] font-semibold'>Nenhuma organização ainda</p>
            <p className='mt-1 max-w-xs text-[15px] text-ink-500'>Pegue sua pilha bagunçada, crie uma organização e comece a escanear.</p>
            <Button className='mt-5' onClick={openNew} icon={<Plus className='h-4 w-4' strokeWidth={2.6} />}>
              Criar a primeira
            </Button>
          </div>
        ) : sortedOrganizations.length >= 3 ? (
          <DepthCarousel
            items={sortedOrganizations}
            getKey={(item) => item.id}
            label='Organizações'
            height={320}
            spacing={170}
            onSelect={(item) => navigate(`/organizations/${item.id}`)}
            renderItem={(item) => <OrganizationCard variant='tile' organization={item} onOpen={() => navigate(`/organizations/${item.id}`)} />}
          />
        ) : (
          <div className='flex flex-col gap-3'>
            {sortedOrganizations.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} onOpen={() => navigate(`/organizations/${organization.id}`)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title='Pokédex' />
        <Link
          to='/pokedex'
          className='group block overflow-hidden rounded-[26px] bg-white shadow-soft ring-1 ring-ink-200/60 transition-shadow hover:shadow-card'
        >
          <div className='flex items-center gap-4 p-5'>
            <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lens-500 text-white shadow-[0_8px_18px_-8px_rgb(47_124_246/0.8)]'>
              <BookOpen className='h-7 w-7' aria-hidden />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-[17px] font-bold tracking-tight'>Abrir Pokédex</div>
              <div className='text-[14px] text-ink-500 tabular'>
                Você possui {owned.size} de {totalSpecies} · {pluralize([...owned.values()].reduce((a, b) => a + b, 0), 'carta', 'cartas')}
              </div>
              <ProgressBar value={owned.size / totalSpecies} tone='blue' label='Pokédex completada' className='mt-2.5 h-1.5' />
            </div>
            <ArrowRight className='h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1' aria-hidden />
          </div>
          {showcase.length > 0 && (
            <div className='no-scrollbar flex gap-1 overflow-x-auto border-t border-ink-100 px-4 py-3'>
              {showcase.map((pokemon) => (
                <PokemonImage key={pokemon.id} src={pokemon.spriteUrl} name={pokemon.displayName} pixel className='h-12 w-12 shrink-0' />
              ))}
            </div>
          )}
        </Link>
      </section>
    </div>
  )
}

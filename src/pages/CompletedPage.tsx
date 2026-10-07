import { BookOpen, PartyPopper, Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatDexNumber, pluralize } from '@/lib/format'
import { usePokemonIndex, useSortPlan } from '@/hooks/usePokemonData'
import { summarize } from '@/services/sortingService'
import { useOrganization } from '@/store/organizationsStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { DexRangeGrid } from '@/components/sorting/DexRangeGrid'

const MAX_CARDS = 18

export function CompletedPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organization = useOrganization(id)
  const groups = useSortPlan(id)
  const { byId, list } = usePokemonIndex()
  const openNew = useUiStore((state) => state.openNewOrganization)
  const reduceMotion = useReducedMotion()

  if (!organization || !id) return <Navigate to='/organizations' replace />
  const summary = summarize(groups)
  const shown = groups.slice(0, MAX_CARDS)

  return (
    <div className='fixed inset-0 z-40 flex flex-col overflow-y-auto bg-gradient-to-b from-dex-500 via-dex-600 to-dex-800 text-white'>
      <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pt-[max(48px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] text-center'>
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
          className='flex h-16 w-16 items-center justify-center rounded-full bg-white text-dex-500 shadow-lift'
        >
          <PartyPopper className='h-8 w-8' aria-hidden />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className='mt-6 text-[36px] leading-tight font-bold tracking-[-0.035em]'
        >
          Tudo organizado!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className='mt-2 text-[17px] text-white/80 tabular'>
          {pluralize(summary.totalCards, 'carta', 'cartas')} · {pluralize(summary.uniquePokemon, 'Pokémon', 'Pokémon')}
        </motion.p>
        {summary.first && summary.last && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className='mt-3 rounded-full bg-white/15 px-4 py-1.5 font-mono text-[15px] font-semibold tabular'
          >
            {formatDexNumber(summary.first.pokedexNumber)} → {formatDexNumber(summary.last.pokedexNumber)}
          </motion.div>
        )}

        <div className='my-10 flex w-full flex-wrap justify-center gap-x-2 gap-y-3'>
          {shown.map((group, position) => (
            <motion.div
              key={group.pokedexNumber}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 60, rotate: position % 2 ? 8 : -8, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.55 + position * 0.06 }}
            >
              <PokemonCard
                size='xs'
                count={group.count}
                pokemon={{ name: group.name, number: group.pokedexNumber, imageUrl: group.imageUrl, types: byId.get(group.pokemonId)?.types }}
              />
            </motion.div>
          ))}
          {groups.length > MAX_CARDS && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + MAX_CARDS * 0.06 }}
              className='flex aspect-[63/88] w-[64px] items-center justify-center rounded-[14px] bg-white/15 text-[13px] font-bold tabular'
            >
              +{groups.length - MAX_CARDS}
            </motion.div>
          )}
        </div>

        <p className='max-w-xs text-[17px] leading-snug text-white/85'>Sua coleção agora está organizada pela Pokédex.</p>

        <div className='mt-10 w-full rounded-[28px] bg-black/15 p-4 ring-1 ring-white/10 sm:p-6'>
          <DexRangeGrid groups={groups} pokemonById={byId} totalSpecies={list.length} />
        </div>

        <div className='mt-auto flex w-full max-w-sm flex-col gap-2.5 pt-10'>
          <Button variant='secondary' size='lg' block className='text-dex-600 ring-0' onClick={() => navigate('/pokedex')} icon={<BookOpen className='h-5 w-5' />}>
            Ver Pokédex
          </Button>
          <Button
            variant='glass'
            size='lg'
            block
            onClick={() => {
              navigate('/')
              openNew()
            }}
            icon={<Plus className='h-5 w-5' />}
          >
            Nova organização
          </Button>
          <button type='button' onClick={() => navigate(`/organizations/${id}`)} className='mt-1 text-[15px] font-semibold text-white/70'>
            Voltar para {organization.name}
          </button>
        </div>
      </div>
    </div>
  )
}

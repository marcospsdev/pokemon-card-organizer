import { ChevronRight, Ellipsis } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { DECK_ACCENTS, cn, formatDexNumber, formatRelativeDate, pluralize } from '@/lib/format'
import { buildSortPlan, organizationStatus, summarize } from '@/services/sortingService'
import type { Organization, OrganizationStatus } from '@/types'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Deck } from './Deck'

const STATUS_LABEL: Record<OrganizationStatus, string> = {
  empty: 'Sem cartas',
  'ready-to-sort': 'Pronta para organizar',
  sorting: 'Organizando',
  completed: 'Organizada',
}

interface OrganizationCardProps {
  organization: Organization
  onOpen: () => void
  onMenu?: () => void
  variant?: 'row' | 'tile'
}

export function OrganizationCard({ organization, onOpen, onMenu, variant = 'row' }: OrganizationCardProps) {
  const [spread, setSpread] = useState(false)
  const summary = summarize(buildSortPlan(organization.cards, organization.placed))
  const status = organizationStatus(organization)
  const accent = DECK_ACCENTS[organization.accent]

  const open = () => {
    setSpread(true)
    window.setTimeout(onOpen, 220)
  }

  if (variant === 'tile') {
    return (
      <motion.button
        type='button'
        onClick={open}
        whileTap={{ scale: 0.97 }}
        onHoverStart={() => setSpread(true)}
        onHoverEnd={() => setSpread(false)}
        className='flex w-[220px] flex-col items-center rounded-[26px] bg-white px-5 pt-7 pb-5 text-center shadow-card ring-1 ring-ink-200/60'
        aria-label={`Abrir ${organization.name}`}
      >
        <Deck cards={organization.cards} accent={organization.accent} spread={spread} />
        <div className='mt-6 w-full truncate text-[17px] font-bold tracking-tight'>{organization.name}</div>
        <div className='mt-0.5 text-[13px] text-ink-500 tabular'>
          {pluralize(summary.totalCards, 'carta', 'cartas')} · {pluralize(summary.uniquePokemon, 'Pokémon', 'Pokémon')}
        </div>
        <ProgressBar value={summary.progress} label={`Progresso de ${organization.name}`} className='mt-4 h-1.5' />
      </motion.button>
    )
  }

  return (
    <motion.div
      layout
      className='relative flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-ink-200/60'
      onHoverStart={() => setSpread(true)}
      onHoverEnd={() => setSpread(false)}
    >
      <button type='button' onClick={open} className='absolute inset-0 rounded-[24px]' aria-label={`Abrir ${organization.name}`} />
      <div className='pointer-events-none flex w-[92px] shrink-0 justify-center py-1'>
        <Deck cards={organization.cards} accent={organization.accent} spread={spread} className='w-[70px]' />
      </div>
      <div className='pointer-events-none min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: accent.ring }} aria-hidden />
          <span className='truncate text-[17px] font-bold tracking-tight'>{organization.name}</span>
        </div>
        <div className='mt-0.5 text-[13px] text-ink-500 tabular'>
          {pluralize(summary.totalCards, 'carta', 'cartas')} · {pluralize(summary.uniquePokemon, 'Pokémon', 'Pokémon')}
          {summary.first && summary.last && summary.uniquePokemon > 1 && (
            <span className='text-ink-400'>
              {' '}
              · {formatDexNumber(summary.first.pokedexNumber)}–{formatDexNumber(summary.last.pokedexNumber)}
            </span>
          )}
        </div>
        <div className='mt-2.5 flex items-center gap-2.5'>
          <ProgressBar value={summary.progress} label={`Progresso de ${organization.name}`} className='h-1.5' />
          <span className={cn('shrink-0 text-[12px] font-semibold', status === 'completed' ? 'text-emerald-600' : 'text-ink-500')}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className='mt-1 text-[12px] text-ink-400'>Atualizada {formatRelativeDate(organization.updatedAt)}</div>
      </div>
      {onMenu ? (
        <button
          type='button'
          onClick={onMenu}
          aria-label={`Mais opções para ${organization.name}`}
          className='relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100'
        >
          <Ellipsis className='h-5 w-5' />
        </button>
      ) : (
        <ChevronRight className='h-5 w-5 shrink-0 text-ink-300' aria-hidden />
      )}
    </motion.div>
  )
}

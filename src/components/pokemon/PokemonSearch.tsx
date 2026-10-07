import { Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn, formatDexNumber } from '@/lib/format'
import { PokemonImage } from './PokemonImage'

export interface SearchSuggestion {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  number?: number
  icon?: ReactNode
  onSelect: () => void
}

interface PokemonSearchProps {
  value: string
  onChange: (value: string) => void
  suggestions: SearchSuggestion[]
  placeholder?: string
  label: string
  tone?: 'light' | 'dark'
  autoFocus?: boolean
  inline?: boolean
}

export function PokemonSearch({ value, onChange, suggestions, placeholder, label, tone = 'light', autoFocus, inline }: PokemonSearchProps) {
  const listId = useId()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  const open = (focused || inline) && value.trim().length > 0 && suggestions.length > 0
  const highlighted = useMemo(() => Math.min(active, suggestions.length - 1), [active, suggestions.length])

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (current - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      suggestions[highlighted]?.onSelect()
    } else if (event.key === 'Escape') {
      onChange('')
    }
  }

  const dark = tone === 'dark'

  return (
    <div className='relative'>
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-[13px] px-3 transition-shadow',
          dark ? 'bg-white/10 text-white' : 'bg-ink-100 text-ink-900',
          focused && (dark ? 'ring-2 ring-white/25' : 'bg-white shadow-soft ring-2 ring-lens-400/50'),
        )}
      >
        <Search className={cn('h-[18px] w-[18px] shrink-0', dark ? 'text-white/50' : 'text-ink-400')} aria-hidden />
        <input
          type='search'
          role='combobox'
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete='list'
          aria-activedescendant={open ? `${listId}-${highlighted}` : undefined}
          autoFocus={autoFocus}
          autoComplete='off'
          autoCorrect='off'
          spellCheck={false}
          enterKeyHint='search'
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            setActive(0)
            onChange(event.target.value)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={handleKey}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none [&::-webkit-search-cancel-button]:hidden',
            dark ? 'placeholder:text-white/40' : 'placeholder:text-ink-400',
          )}
        />
        {value && (
          <button
            type='button'
            aria-label='Limpar pesquisa'
            onClick={() => onChange('')}
            className={cn('flex h-5 w-5 items-center justify-center rounded-full', dark ? 'bg-white/25 text-ink-900' : 'bg-ink-300 text-white')}
          >
            <X className='h-3 w-3' strokeWidth={3} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role='listbox'
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'z-30 mt-2 max-h-[min(60vh,380px)] overflow-y-auto rounded-2xl p-1.5',
              inline ? 'relative' : 'absolute inset-x-0',
              dark ? 'bg-ink-800 ring-1 ring-white/10' : 'bg-white shadow-lift ring-1 ring-ink-200/70',
            )}
          >
            {suggestions.map((suggestion, position) => (
              <li
                key={suggestion.id}
                id={`${listId}-${position}`}
                role='option'
                aria-selected={position === highlighted}
                onMouseDown={(event) => event.preventDefault()}
                onClick={suggestion.onSelect}
                onMouseEnter={() => setActive(position)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2',
                  position === highlighted && (dark ? 'bg-white/10' : 'bg-ink-100'),
                )}
              >
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', dark ? 'bg-white/5' : 'bg-ink-50')}>
                  {suggestion.imageUrl ? (
                    <PokemonImage src={suggestion.imageUrl} name={suggestion.title} pixel className='h-10 w-10' />
                  ) : (
                    suggestion.icon
                  )}
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-[15px] font-semibold'>{suggestion.title}</span>
                  {suggestion.subtitle && (
                    <span className={cn('block truncate text-[13px]', dark ? 'text-white/50' : 'text-ink-500')}>{suggestion.subtitle}</span>
                  )}
                </span>
                {suggestion.number !== undefined && (
                  <span className={cn('font-mono text-[12px] font-semibold tabular', dark ? 'text-white/40' : 'text-ink-400')}>
                    {formatDexNumber(suggestion.number)}
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

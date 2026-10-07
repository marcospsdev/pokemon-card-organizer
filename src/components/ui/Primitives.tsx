import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn, typeMeta } from '@/lib/format'

export function TypeBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const meta = typeMeta(type)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
      style={{ backgroundColor: meta.soft, color: meta.color }}
    >
      <span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: meta.color }} aria-hidden />
      {meta.label}
    </span>
  )
}

export function PokeballMark({ className, stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox='0 0 64 64' className={className} aria-hidden fill='none' stroke={stroke} strokeWidth='4'>
      <circle cx='32' cy='32' r='28' />
      <path d='M4 32h19M41 32h19' />
      <circle cx='32' cy='32' r='9' />
    </svg>
  )
}

export function PokedexLens({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const big = size === 'md' ? 'h-9 w-9' : 'h-6 w-6'
  const dot = size === 'md' ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'
  return (
    <div className='flex items-center gap-2' aria-hidden>
      <span className={cn('relative rounded-full bg-white p-[3px] shadow-soft ring-1 ring-ink-200', big)}>
        <span className='block h-full w-full rounded-full bg-[radial-gradient(circle_at_32%_30%,#bfe1ff_0%,#5aa6ff_35%,#1d5fd1_80%)] ring-1 ring-lens-600/40' />
      </span>
      <span className={cn('rounded-full bg-dex-500 ring-1 ring-dex-700/40', dot)} />
      <span className={cn('rounded-full bg-volt-500 ring-1 ring-amber-600/40', dot)} />
      <span className={cn('rounded-full bg-emerald-500 ring-1 ring-emerald-700/40', dot)} />
    </div>
  )
}

interface LargeTitleProps {
  title: string
  subtitle?: string
  eyebrow?: ReactNode
  trailing?: ReactNode
}

export function LargeTitle({ title, subtitle, eyebrow, trailing }: LargeTitleProps) {
  return (
    <header className='flex items-end justify-between gap-4 pt-4 pb-5'>
      <div className='min-w-0'>
        {eyebrow && <div className='mb-2'>{eyebrow}</div>}
        <h1 className='text-[34px] leading-[1.05] font-bold tracking-[-0.03em] text-ink-900'>{title}</h1>
        {subtitle && <p className='mt-1.5 text-[15px] text-ink-500'>{subtitle}</p>}
      </div>
      {trailing}
    </header>
  )
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string; icon?: ReactNode }>
  onChange: (value: T) => void
  label: string
  tone?: 'light' | 'dark'
}

export function SegmentedControl<T extends string>({ value, options, onChange, label, tone = 'light' }: SegmentedControlProps<T>) {
  return (
    <div
      role='tablist'
      aria-label={label}
      className={cn('relative flex rounded-[13px] p-1', tone === 'light' ? 'bg-ink-100' : 'bg-white/10')}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type='button'
            role='tab'
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition-colors',
              tone === 'light' ? (selected ? 'text-ink-900' : 'text-ink-500') : selected ? 'text-ink-900' : 'text-white/70',
            )}
          >
            {selected && (
              <motion.span
                layoutId={`segment-${label}`}
                className='absolute inset-0 -z-10 rounded-[10px] bg-white shadow-soft'
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Stat({ value, label, accent }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className='rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200/60'>
      <div className={cn('text-[28px] leading-none font-bold tracking-tight tabular', accent ? 'text-dex-500' : 'text-ink-900')}>{value}</div>
      <div className='mt-1.5 text-[13px] font-medium text-ink-500'>{label}</div>
    </div>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <h2 className='text-[22px] font-bold tracking-tight'>{title}</h2>
      {action}
    </div>
  )
}

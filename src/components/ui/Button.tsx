import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'glass'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-dex-500 text-white shadow-[0_8px_20px_-8px_rgb(220_10_45/0.7)] hover:bg-dex-600 disabled:bg-dex-200',
  secondary: 'bg-white text-ink-900 ring-1 ring-ink-200 shadow-soft hover:bg-ink-50 disabled:text-ink-400',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 disabled:text-ink-300',
  danger: 'bg-dex-50 text-dex-600 hover:bg-dex-100',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-600',
  glass: 'glass-dark text-white ring-1 ring-white/15 hover:bg-white/10',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-2xl',
  lg: 'h-14 px-6 text-[17px] gap-2.5 rounded-[18px]',
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em] transition-colors',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  )
}

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string
  children: ReactNode
  tone?: 'light' | 'dark' | 'plain'
}

export function IconButton({ label, children, tone = 'light', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
        tone === 'light' && 'bg-white text-ink-800 shadow-soft ring-1 ring-ink-200/70 hover:bg-ink-50',
        tone === 'dark' && 'glass-dark text-white ring-1 ring-white/15 hover:bg-white/10',
        tone === 'plain' && 'text-ink-600 hover:bg-ink-100',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

import { BookOpen, House, Layers, ScanLine, Settings } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/format'
import { organizationStatus } from '@/services/sortingService'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { useUiStore } from '@/store/uiStore'
import { PokedexLens } from '@/components/ui/Primitives'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/organizations', label: 'Decks', icon: Layers, end: false },
  { to: '/pokedex', label: 'Pokédex', icon: BookOpen, end: false },
  { to: '/settings', label: 'Ajustes', icon: Settings, end: false },
]

function useScanShortcut() {
  const navigate = useNavigate()
  const openNew = useUiStore((state) => state.openNewOrganization)
  const active = useOrganizationsStore((state) => state.organizations.find((item) => item.id === state.lastActiveId))
  return () => {
    if (active && organizationStatus(active) !== 'completed') navigate(`/organizations/${active.id}/scan`)
    else openNew()
  }
}

function NavItem({ to, label, icon: Icon, end }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors lg:flex-none lg:flex-row lg:gap-3 lg:rounded-2xl lg:px-4 lg:py-2.5 lg:text-[15px]',
          isActive ? 'text-dex-500 lg:bg-dex-50' : 'text-ink-400 hover:text-ink-700 lg:hover:bg-ink-100',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className='h-6 w-6 lg:h-5 lg:w-5' strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function ScanButton({ className, children }: { className?: string; children?: ReactNode }) {
  const scan = useScanShortcut()
  return (
    <motion.button
      type='button'
      onClick={scan}
      whileTap={{ scale: 0.9 }}
      aria-label='Escanear cartas'
      className={cn(
        'flex items-center justify-center gap-2 bg-dex-500 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(220_10_45/0.75)] ring-4 ring-white hover:bg-dex-600',
        className,
      )}
    >
      <ScanLine className='h-6 w-6' strokeWidth={2.2} aria-hidden />
      {children}
    </motion.button>
  )
}

export function AppShell() {
  const location = useLocation()

  return (
    <div className='min-h-dvh lg:flex'>
      <aside className='sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-ink-200/70 bg-white/70 px-4 py-6 lg:flex'>
        <div className='mb-6 flex items-center gap-3 px-2'>
          <PokedexLens size='sm' />
          <span className='text-[17px] font-bold tracking-tight'>PokéDex Sorter</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <ScanButton className='mt-6 h-12 rounded-2xl ring-0'>Escanear cartas</ScanButton>
      </aside>

      <main className='mx-auto w-full max-w-5xl px-4 pt-safe pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-12'>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <nav
        aria-label='Navegação principal'
        className='glass fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/60 pb-safe lg:hidden'
      >
        <div className='mx-auto flex max-w-lg items-end px-2 pt-1.5 pb-1'>
          <NavItem {...NAV_ITEMS[0]} />
          <NavItem {...NAV_ITEMS[1]} />
          <div className='flex flex-1 justify-center'>
            <ScanButton className='-mt-7 h-[58px] w-[58px] rounded-full' />
          </div>
          <NavItem {...NAV_ITEMS[2]} />
          <NavItem {...NAV_ITEMS[3]} />
        </div>
      </nav>
    </div>
  )
}

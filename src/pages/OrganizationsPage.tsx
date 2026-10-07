import { Copy, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DECK_ACCENTS, cn } from '@/lib/format'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { toast } from '@/store/toastStore'
import { useUiStore } from '@/store/uiStore'
import type { DeckAccent, Organization } from '@/types'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { LargeTitle } from '@/components/ui/Primitives'
import { OrganizationCard } from '@/components/pokemon/OrganizationCard'

export function OrganizationsPage() {
  const navigate = useNavigate()
  const organizations = useOrganizationsStore((state) => state.organizations)
  const { rename, duplicate, remove, setAccent } = useOrganizationsStore()
  const openNew = useUiStore((state) => state.openNewOrganization)
  const [menuFor, setMenuFor] = useState<Organization | null>(null)
  const [renaming, setRenaming] = useState<Organization | null>(null)
  const [deleting, setDeleting] = useState<Organization | null>(null)
  const [draftName, setDraftName] = useState('')

  const sorted = useMemo(() => [...organizations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [organizations])

  return (
    <div>
      <LargeTitle
        title='Decks'
        subtitle='Cada organização é uma pilha de cartas.'
        trailing={
          <IconButton label='Nova organização' onClick={openNew}>
            <Plus className='h-5 w-5' strokeWidth={2.4} />
          </IconButton>
        }
      />

      {sorted.length === 0 ? (
        <div className='rounded-[26px] border-2 border-dashed border-ink-200 px-6 py-12 text-center'>
          <p className='text-[17px] font-semibold'>Nenhuma organização</p>
          <p className='mt-1 text-[15px] text-ink-500'>Crie uma organização para começar a escanear.</p>
          <Button className='mt-5' onClick={openNew} icon={<Plus className='h-4 w-4' />}>
            Nova organização
          </Button>
        </div>
      ) : (
        <div className='grid gap-3 md:grid-cols-2'>
          <AnimatePresence initial={false}>
            {sorted.map((organization) => (
              <OrganizationCard
                key={organization.id}
                organization={organization}
                onOpen={() => navigate(`/organizations/${organization.id}`)}
                onMenu={() => setMenuFor(organization)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <BottomSheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        {menuFor && (
          <div className='flex flex-col gap-1'>
            <SheetAction icon={<Play className='h-5 w-5' />} label='Continuar' onClick={() => navigate(`/organizations/${menuFor.id}`)} />
            <SheetAction
              icon={<Pencil className='h-5 w-5' />}
              label='Renomear'
              onClick={() => {
                setDraftName(menuFor.name)
                setRenaming(menuFor)
                setMenuFor(null)
              }}
            />
            <SheetAction
              icon={<Copy className='h-5 w-5' />}
              label='Duplicar'
              onClick={() => {
                const copy = duplicate(menuFor.id)
                setMenuFor(null)
                if (copy) toast(`“${copy.name}” criada`, { tone: 'success' })
              }}
            />
            <div className='my-3 flex justify-between gap-2 px-1'>
              {(Object.keys(DECK_ACCENTS) as DeckAccent[]).map((key) => (
                <button
                  key={key}
                  type='button'
                  aria-label={`Cor ${DECK_ACCENTS[key].label}`}
                  aria-pressed={menuFor.accent === key}
                  onClick={() => {
                    setAccent(menuFor.id, key)
                    setMenuFor({ ...menuFor, accent: key })
                  }}
                  className={cn('h-9 w-9 rounded-full ring-offset-2', menuFor.accent === key && 'ring-2 ring-ink-900')}
                  style={{ background: `linear-gradient(150deg, ${DECK_ACCENTS[key].from}, ${DECK_ACCENTS[key].to})` }}
                />
              ))}
            </div>
            <SheetAction
              icon={<Trash2 className='h-5 w-5' />}
              label='Excluir'
              destructive
              onClick={() => {
                setDeleting(menuFor)
                setMenuFor(null)
              }}
            />
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={renaming !== null} onClose={() => setRenaming(null)} title='Renomear'>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (renaming) rename(renaming.id, draftName)
            setRenaming(null)
          }}
          className='flex flex-col gap-4'
        >
          <input
            aria-label='Nome da organização'
            value={draftName}
            maxLength={40}
            onChange={(event) => setDraftName(event.target.value)}
            className='h-12 w-full rounded-2xl bg-ink-100 px-4 text-[17px] outline-none focus:bg-white focus:ring-2 focus:ring-lens-400/50'
          />
          <Button type='submit' size='lg' block>
            Salvar
          </Button>
        </form>
      </BottomSheet>

      <ConfirmModal
        open={deleting !== null}
        title={`Excluir “${deleting?.name ?? ''}”?`}
        description='As cartas escaneadas e o progresso desta organização serão apagados. Suas cartas físicas continuam onde estão.'
        confirmLabel='Excluir organização'
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting.id)}
      />
    </div>
  )
}

function SheetAction({ icon, label, onClick, destructive }: { icon: ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex h-13 items-center gap-3.5 rounded-2xl px-3 text-[17px] font-medium transition-colors',
        destructive ? 'text-dex-600 hover:bg-dex-50' : 'text-ink-900 hover:bg-ink-100',
      )}
    >
      <span className={destructive ? 'text-dex-500' : 'text-ink-500'}>{icon}</span>
      {label}
    </button>
  )
}

import { Check, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DECK_ACCENTS, cn } from '@/lib/format'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { useUiStore } from '@/store/uiStore'
import type { DeckAccent } from '@/types'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'

export function NewOrganizationSheet() {
  const open = useUiStore((state) => state.newOrganizationOpen)
  const close = useUiStore((state) => state.closeNewOrganization)
  const create = useOrganizationsStore((state) => state.create)
  const count = useOrganizationsStore((state) => state.organizations.length)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [accent, setAccent] = useState<DeckAccent>('red')

  const submit = () => {
    const organization = create(name || `Organização ${count + 1}`, accent)
    close()
    setName('')
    navigate(`/organizations/${organization.id}/scan`)
  }

  return (
    <BottomSheet open={open} onClose={close} title='Nova organização' description='Dê um nome para esta pilha de cartas. Depois é só escanear.'>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className='flex flex-col gap-5'
      >
        <label className='block'>
          <span className='mb-1.5 block text-[13px] font-semibold text-ink-500'>Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={`Organização ${count + 1}`}
            maxLength={40}
            className='h-12 w-full rounded-2xl bg-ink-100 px-4 text-[17px] outline-none focus:bg-white focus:ring-2 focus:ring-lens-400/50'
          />
        </label>
        <fieldset>
          <legend className='mb-2 text-[13px] font-semibold text-ink-500'>Cor do deck</legend>
          <div className='flex flex-wrap gap-3'>
            {(Object.keys(DECK_ACCENTS) as DeckAccent[]).map((key) => (
              <button
                key={key}
                type='button'
                aria-label={DECK_ACCENTS[key].label}
                aria-pressed={accent === key}
                onClick={() => setAccent(key)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 transition-shadow',
                  accent === key && 'ring-2 ring-ink-900',
                )}
                style={{ background: `linear-gradient(150deg, ${DECK_ACCENTS[key].from}, ${DECK_ACCENTS[key].to})` }}
              >
                {accent === key && <Check className='h-5 w-5 text-white' strokeWidth={3} />}
              </button>
            ))}
          </div>
        </fieldset>
        <Button type='submit' size='lg' block icon={<ScanLine className='h-5 w-5' />}>
          Criar e escanear
        </Button>
      </form>
    </BottomSheet>
  )
}

import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/format'
import { pokeApiService } from '@/services/pokeApiService'
import { useOrganizationsStore } from '@/store/organizationsStore'
import { useSettingsStore, type ScanStrictness } from '@/store/settingsStore'
import { toast } from '@/store/toastStore'
import { IconButton } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { LargeTitle, SegmentedControl } from '@/components/ui/Primitives'

function Row({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-4 px-4 py-3.5'>
      <div className='min-w-0'>
        <div className='text-[16px] font-medium'>{title}</div>
        {description && <div className='text-[13px] leading-snug text-ink-500'>{description}</div>}
      </div>
      <div className='shrink-0'>{children}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='mb-7'>
      <h2 className='mb-2 px-4 text-[13px] font-semibold tracking-wide text-ink-500 uppercase'>{title}</h2>
      <div className='divide-y divide-ink-100 overflow-hidden rounded-[22px] bg-white shadow-soft ring-1 ring-ink-200/60'>{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const settings = useSettingsStore()
  const queryClient = useQueryClient()
  const organizations = useOrganizationsStore((state) => state.organizations)
  const remove = useOrganizationsStore((state) => state.remove)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div>
      <LargeTitle title='Ajustes' />

      <Group title='Mesa'>
        <Row title='Cartas por fileira' description='Quantas cartas cabem lado a lado na sua mesa.'>
          <div className='flex items-center gap-2'>
            <IconButton label='Diminuir' onClick={() => settings.setTableColumns(settings.tableColumns - 1)}>
              <Minus className='h-4 w-4' />
            </IconButton>
            <span className='w-6 text-center text-[17px] font-semibold tabular'>{settings.tableColumns}</span>
            <IconButton label='Aumentar' onClick={() => settings.setTableColumns(settings.tableColumns + 1)}>
              <Plus className='h-4 w-4' />
            </IconButton>
          </div>
        </Row>
      </Group>

      <Group title='Scanner'>
        <div className='px-4 py-3.5'>
          <div className='text-[16px] font-medium'>Confirmação automática</div>
          <div className='mb-3 text-[13px] leading-snug text-ink-500'>
            Quanto mais rígido, mais vezes pediremos para você confirmar o Pokémon identificado.
          </div>
          <SegmentedControl<ScanStrictness>
            label='Rigor do reconhecimento'
            value={settings.strictness}
            onChange={settings.setStrictness}
            options={[
              { value: 'strict', label: 'Rígido' },
              { value: 'balanced', label: 'Equilibrado' },
              { value: 'flexible', label: 'Flexível' },
            ]}
          />
        </div>
        <Row title='Vibração' description='Vibrar ao registrar cada carta (quando suportado).'>
          <button
            type='button'
            role='switch'
            aria-checked={settings.haptics}
            aria-label='Vibração'
            onClick={() => settings.setHaptics(!settings.haptics)}
            className={cn('relative h-[31px] w-[51px] rounded-full transition-colors', settings.haptics ? 'bg-emerald-500' : 'bg-ink-200')}
          >
            <span
              className={cn(
                'absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-card transition-transform duration-200',
                settings.haptics && 'translate-x-5',
              )}
            />
          </button>
        </Row>
      </Group>

      <Group title='Dados'>
        <button
          type='button'
          onClick={async () => {
            await pokeApiService.refreshPokemonIndex()
            await queryClient.invalidateQueries({ queryKey: ['pokemon-index'] })
            toast('Pokédex atualizada pela PokéAPI', { tone: 'success' })
          }}
          className='flex w-full items-center gap-3 px-4 py-3.5 text-left text-[16px] font-medium hover:bg-ink-50'
        >
          <RefreshCw className='h-5 w-5 text-lens-500' /> Atualizar dados da Pokédex
        </button>
        <button
          type='button'
          disabled={organizations.length === 0}
          onClick={() => setConfirmClear(true)}
          className='flex w-full items-center gap-3 px-4 py-3.5 text-left text-[16px] font-medium text-dex-600 hover:bg-dex-50 disabled:text-ink-300'
        >
          <Trash2 className='h-5 w-5' /> Apagar todas as organizações
        </button>
      </Group>

      <p className='px-4 text-center text-[12px] leading-relaxed text-ink-400'>
        Dados e imagens dos Pokémon fornecidos pela PokéAPI. Tudo fica salvo apenas neste dispositivo.
        <br />
        Pokémon e nomes relacionados são marcas de seus respectivos donos.
      </p>

      <ConfirmModal
        open={confirmClear}
        title='Apagar todas as organizações?'
        description='Todas as cartas escaneadas e o progresso serão removidos deste dispositivo.'
        confirmLabel='Apagar tudo'
        destructive
        onClose={() => setConfirmClear(false)}
        onConfirm={() => organizations.forEach((organization) => remove(organization.id))}
      />
    </div>
  )
}

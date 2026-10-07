import { useState } from 'react'
import { usePokemonIndex } from '@/hooks/usePokemonData'
import type { Pokemon } from '@/types'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PokemonSearch } from '@/components/pokemon/PokemonSearch'

interface ManualAddSheetProps {
  open: boolean
  onClose: () => void
  onPick: (pokemon: Pokemon) => void
}

export function ManualAddSheet({ open, onClose, onPick }: ManualAddSheetProps) {
  const { matcher } = usePokemonIndex()
  const [query, setQuery] = useState('')

  const close = () => {
    setQuery('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={close} tone='dark' title='Adicionar manualmente' description='Digite o nome que aparece na carta.'>
      <div className='min-h-[280px]'>
        <PokemonSearch
          label='Nome do Pokémon'
          placeholder='Ex.: Pikachu ou 25'
          tone='dark'
          inline
          autoFocus
          value={query}
          onChange={setQuery}
          suggestions={matcher.search(query, 6).map((pokemon) => ({
            id: String(pokemon.id),
            title: pokemon.displayName,
            imageUrl: pokemon.spriteUrl,
            number: pokemon.nationalDexNumber,
            onSelect: () => {
              onPick(pokemon)
              setQuery('')
            },
          }))}
        />
      </div>
    </BottomSheet>
  )
}

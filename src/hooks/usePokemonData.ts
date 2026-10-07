import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { pokeApiService } from '@/services/pokeApiService'
import { createPokemonMatcher } from '@/services/pokemonMatcher'
import { buildSortPlan } from '@/services/sortingService'
import { useOrganizationsStore } from '@/store/organizationsStore'
import type { Pokemon } from '@/types'

export function usePokemonIndex() {
  const query = useQuery({
    queryKey: ['pokemon-index'],
    queryFn: ({ signal }) => pokeApiService.getPokemonIndex(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  })

  const derived = useMemo(() => {
    const list = query.data ?? []
    const byId = new Map<number, Pokemon>(list.map((pokemon) => [pokemon.id, pokemon]))
    const regions = [...new Map(list.map((pokemon) => [pokemon.generation, pokemon.region])).entries()].sort(([a], [b]) => a - b)
    return { list, byId, regions, matcher: createPokemonMatcher(list) }
  }, [query.data])

  return { ...query, ...derived }
}

export function usePokemonDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['pokemon-detail', id],
    queryFn: ({ signal }) => pokeApiService.getPokemonDetail(id as number, signal),
    enabled: id !== undefined && Number.isFinite(id),
    staleTime: Infinity,
  })
}

export function useOwnedCounts(organizationId?: string | null) {
  const organizations = useOrganizationsStore((state) => state.organizations)
  return useMemo(() => {
    const counts = new Map<number, number>()
    for (const organization of organizations) {
      if (organizationId && organization.id !== organizationId) continue
      for (const card of organization.cards) counts.set(card.pokedexNumber, (counts.get(card.pokedexNumber) ?? 0) + 1)
    }
    return counts
  }, [organizations, organizationId])
}

export function useSortPlan(organizationId: string | undefined) {
  const organization = useOrganizationsStore((state) => state.organizations.find((item) => item.id === organizationId))
  return useMemo(
    () => (organization ? buildSortPlan(organization.cards, organization.placed) : []),
    [organization],
  )
}

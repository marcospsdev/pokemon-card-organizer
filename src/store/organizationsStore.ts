import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createId } from '@/lib/format'
import { storageService } from '@/services/storageService'
import type { CardSource, DeckAccent, Organization, Pokemon, ScannedCard } from '@/types'

interface OrganizationsState {
  organizations: Organization[]
  lastActiveId: string | null
  create: (name: string, accent: DeckAccent) => Organization
  rename: (id: string, name: string) => void
  setAccent: (id: string, accent: DeckAccent) => void
  duplicate: (id: string) => Organization | null
  remove: (id: string) => void
  setActive: (id: string | null) => void
  addCard: (organizationId: string, pokemon: Pokemon, confidence: number, source: CardSource) => ScannedCard
  removeCard: (organizationId: string, cardId: string) => void
  replaceCardPokemon: (organizationId: string, cardId: string, pokemon: Pokemon) => void
  setPlaced: (organizationId: string, pokedexNumber: number, count: number) => void
  resetProgress: (organizationId: string) => void
}

function now() {
  return new Date().toISOString()
}

function cardFrom(pokemon: Pokemon, confidence: number, source: CardSource): ScannedCard {
  return {
    id: createId(),
    pokemonId: pokemon.id,
    pokemonName: pokemon.displayName,
    pokedexNumber: pokemon.nationalDexNumber,
    imageUrl: pokemon.imageUrl,
    confidence,
    scannedAt: now(),
    source,
  }
}

export const useOrganizationsStore = create<OrganizationsState>()(
  persist(
    (set, get) => {
      const update = (id: string, change: (organization: Organization) => Organization) =>
        set((state) => ({
          organizations: state.organizations.map((organization) =>
            organization.id === id ? { ...change(organization), updatedAt: now() } : organization,
          ),
        }))

      return {
        organizations: [],
        lastActiveId: null,

        create(name, accent) {
          const organization: Organization = {
            id: createId(),
            name: name.trim() || 'Nova organização',
            accent,
            cards: [],
            placed: {},
            createdAt: now(),
            updatedAt: now(),
          }
          set((state) => ({ organizations: [organization, ...state.organizations], lastActiveId: organization.id }))
          return organization
        },

        rename(id, name) {
          update(id, (organization) => ({ ...organization, name: name.trim() || organization.name }))
        },

        setAccent(id, accent) {
          update(id, (organization) => ({ ...organization, accent }))
        },

        duplicate(id) {
          const source = get().organizations.find((organization) => organization.id === id)
          if (!source) return null
          const copy: Organization = {
            ...source,
            id: createId(),
            name: `${source.name} (cópia)`,
            cards: source.cards.map((card) => ({ ...card, id: createId() })),
            placed: {},
            createdAt: now(),
            updatedAt: now(),
          }
          set((state) => ({ organizations: [copy, ...state.organizations] }))
          return copy
        },

        remove(id) {
          set((state) => ({
            organizations: state.organizations.filter((organization) => organization.id !== id),
            lastActiveId: state.lastActiveId === id ? null : state.lastActiveId,
          }))
        },

        setActive(id) {
          set({ lastActiveId: id })
        },

        addCard(organizationId, pokemon, confidence, source) {
          const card = cardFrom(pokemon, confidence, source)
          update(organizationId, (organization) => ({ ...organization, cards: [...organization.cards, card] }))
          return card
        },

        removeCard(organizationId, cardId) {
          update(organizationId, (organization) => {
            const card = organization.cards.find((item) => item.id === cardId)
            const cards = organization.cards.filter((item) => item.id !== cardId)
            if (!card) return organization
            const remaining = cards.filter((item) => item.pokedexNumber === card.pokedexNumber).length
            const placed = { ...organization.placed }
            if ((placed[card.pokedexNumber] ?? 0) > remaining) placed[card.pokedexNumber] = remaining
            return { ...organization, cards, placed }
          })
        },

        replaceCardPokemon(organizationId, cardId, pokemon) {
          update(organizationId, (organization) => ({
            ...organization,
            cards: organization.cards.map((card) =>
              card.id === cardId ? { ...cardFrom(pokemon, 1, card.source), id: card.id, scannedAt: card.scannedAt } : card,
            ),
          }))
        },

        setPlaced(organizationId, pokedexNumber, count) {
          update(organizationId, (organization) => ({
            ...organization,
            placed: { ...organization.placed, [pokedexNumber]: Math.max(0, count) },
          }))
        },

        resetProgress(organizationId) {
          update(organizationId, (organization) => ({ ...organization, placed: {} }))
        },
      }
    },
    {
      name: 'pokedex-sorter:organizations',
      version: 1,
      storage: createJSONStorage(() => storageService.localState),
    },
  ),
)

export function useOrganization(id: string | undefined) {
  return useOrganizationsStore((state) => state.organizations.find((organization) => organization.id === id))
}

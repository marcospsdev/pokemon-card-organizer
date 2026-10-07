export interface Pokemon {
  id: number
  name: string
  displayName: string
  nationalDexNumber: number
  imageUrl: string
  spriteUrl: string
  types: string[]
  generation: number
  region: string
}

export interface PokemonStat {
  name: string
  value: number
}

export interface PokemonDetail {
  id: number
  genus: string
  flavorText: string
  heightMeters: number
  weightKg: number
  stats: PokemonStat[]
  abilities: string[]
  isLegendary: boolean
  isMythical: boolean
}

export type CardSource = 'scanner' | 'manual'

export interface ScannedCard {
  id: string
  pokemonId: number
  pokemonName: string
  pokedexNumber: number
  imageUrl: string
  confidence: number
  scannedAt: string
  source: CardSource
}

export type DeckAccent = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'ink'

export interface Organization {
  id: string
  name: string
  accent: DeckAccent
  cards: ScannedCard[]
  placed: Record<number, number>
  createdAt: string
  updatedAt: string
}

export type OrganizationStatus = 'empty' | 'ready-to-sort' | 'sorting' | 'completed'

export type ScannerState =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'processing'
  | 'identified'
  | 'confirmation'
  | 'scanning-next'
  | 'paused'
  | 'error'

export interface MatchCandidate {
  pokemon: Pokemon
  score: number
  matchedText: string
}

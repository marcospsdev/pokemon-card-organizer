import { toDisplayName } from '@/lib/format'
import type { Pokemon, PokemonDetail } from '@/types'
import { storageService } from './storageService'

const API_URL = 'https://pokeapi.co/api/v2'
const SPRITES_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const INDEX_CACHE_KEY = 'pokemon-index:v1'
const INDEX_MAX_AGE = 1000 * 60 * 60 * 24 * 30
const FORM_ID_OFFSET = 10000

interface NamedResource {
  name: string
  url: string
}

interface NamedList {
  results: NamedResource[]
}

interface GenerationResponse {
  id: number
  main_region: NamedResource
  pokemon_species: NamedResource[]
}

interface TypeResponse {
  name: string
  pokemon: Array<{ slot: number; pokemon: NamedResource }>
}

interface SpeciesResponse {
  id: number
  is_legendary: boolean
  is_mythical: boolean
  genera: Array<{ genus: string; language: NamedResource }>
  flavor_text_entries: Array<{ flavor_text: string; language: NamedResource }>
}

interface PokemonResponse {
  id: number
  height: number
  weight: number
  stats: Array<{ base_stat: number; stat: NamedResource }>
  abilities: Array<{ ability: NamedResource; is_hidden: boolean }>
}

export const artworkUrl = (id: number) => `${SPRITES_URL}/other/official-artwork/${id}.png`
export const spriteUrl = (id: number) => `${SPRITES_URL}/${id}.png`

function idFromUrl(url: string) {
  return Number(url.split('/').filter(Boolean).pop())
}

async function getJson<T>(pathOrUrl: string, signal?: AbortSignal): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_URL}${pathOrUrl}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`PokéAPI respondeu ${response.status} para ${url}`)
  return response.json() as Promise<T>
}

async function fetchPokemonIndex(signal?: AbortSignal): Promise<Pokemon[]> {
  const [generationList, typeList] = await Promise.all([
    getJson<NamedList>('/generation?limit=100', signal),
    getJson<NamedList>('/type?limit=100', signal),
  ])

  const [generations, types] = await Promise.all([
    Promise.all(generationList.results.map((item) => getJson<GenerationResponse>(item.url, signal))),
    Promise.all(typeList.results.map((item) => getJson<TypeResponse>(item.url, signal))),
  ])

  const entries = new Map<number, Pokemon>()
  for (const generation of generations) {
    for (const species of generation.pokemon_species) {
      const id = idFromUrl(species.url)
      entries.set(id, {
        id,
        name: species.name,
        displayName: toDisplayName(species.name),
        nationalDexNumber: id,
        imageUrl: artworkUrl(id),
        spriteUrl: spriteUrl(id),
        types: [],
        generation: generation.id,
        region: generation.main_region.name,
      })
    }
  }

  const slots = new Map<number, Array<{ slot: number; type: string }>>()
  for (const type of types) {
    for (const { slot, pokemon } of type.pokemon) {
      const id = idFromUrl(pokemon.url)
      if (id >= FORM_ID_OFFSET || !entries.has(id)) continue
      const list = slots.get(id) ?? []
      list.push({ slot, type: type.name })
      slots.set(id, list)
    }
  }

  for (const [id, list] of slots) {
    const entry = entries.get(id)
    if (entry) entry.types = list.sort((a, b) => a.slot - b.slot).map((item) => item.type)
  }

  return [...entries.values()].sort((a, b) => a.nationalDexNumber - b.nationalDexNumber)
}

function pickLanguage<T extends { language: NamedResource }>(entries: T[]) {
  return (
    entries.find((entry) => entry.language.name === 'pt-br') ??
    entries.find((entry) => entry.language.name === 'pt') ??
    entries.find((entry) => entry.language.name === 'en')
  )
}

export const pokeApiService = {
  async getPokemonIndex(signal?: AbortSignal): Promise<Pokemon[]> {
    const cached = await storageService.readCache<Pokemon[]>(INDEX_CACHE_KEY, INDEX_MAX_AGE)
    if (cached?.length) return cached
    const index = await fetchPokemonIndex(signal)
    await storageService.writeCache(INDEX_CACHE_KEY, index)
    return index
  },

  async refreshPokemonIndex() {
    await storageService.clearCache(INDEX_CACHE_KEY)
  },

  async getPokemonDetail(id: number, signal?: AbortSignal): Promise<PokemonDetail> {
    const [species, pokemon] = await Promise.all([
      getJson<SpeciesResponse>(`/pokemon-species/${id}`, signal),
      getJson<PokemonResponse>(`/pokemon/${id}`, signal),
    ])

    return {
      id,
      genus: pickLanguage(species.genera)?.genus ?? '',
      flavorText: (pickLanguage(species.flavor_text_entries)?.flavor_text ?? '').replace(/[\f\n\r­]+/g, ' ').replace(/\s+/g, ' ').trim(),
      heightMeters: pokemon.height / 10,
      weightKg: pokemon.weight / 10,
      stats: pokemon.stats.map((stat) => ({ name: stat.stat.name, value: stat.base_stat })),
      abilities: pokemon.abilities.filter((ability) => !ability.is_hidden).map((ability) => toDisplayName(ability.ability.name)),
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
    }
  },
}

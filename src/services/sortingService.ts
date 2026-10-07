import { formatDexNumber, pluralize } from '@/lib/format'
import type { Organization, OrganizationStatus, ScannedCard } from '@/types'

export interface SortGroup {
  pokedexNumber: number
  pokemonId: number
  name: string
  imageUrl: string
  count: number
  cardIds: string[]
  placed: number
  done: boolean
  position: number
}

export interface TableSlot {
  row: number
  column: number
}

export type InstructionKind = 'first' | 'after' | 'before' | 'between' | 'stack'

export interface SortInstruction {
  group: SortGroup
  kind: InstructionKind
  previous: SortGroup | null
  next: SortGroup | null
  slot: TableSlot
  headline: string
  detail: string | null
  startsNewRow: boolean
}

export interface CollectionSummary {
  totalCards: number
  uniquePokemon: number
  duplicates: number
  first: SortGroup | null
  last: SortGroup | null
  placedCards: number
  progress: number
}

export function buildSortPlan(cards: ScannedCard[], placed: Record<number, number> = {}): SortGroup[] {
  const groups = new Map<number, SortGroup>()
  for (const card of cards) {
    const group = groups.get(card.pokedexNumber)
    if (group) {
      group.count++
      group.cardIds.push(card.id)
      continue
    }
    groups.set(card.pokedexNumber, {
      pokedexNumber: card.pokedexNumber,
      pokemonId: card.pokemonId,
      name: card.pokemonName,
      imageUrl: card.imageUrl,
      count: 1,
      cardIds: [card.id],
      placed: 0,
      done: false,
      position: 0,
    })
  }

  return [...groups.values()]
    .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
    .map((group, position) => {
      const placedCount = Math.min(placed[group.pokedexNumber] ?? 0, group.count)
      return { ...group, position, placed: placedCount, done: placedCount >= group.count }
    })
}

export function summarize(groups: SortGroup[]): CollectionSummary {
  const totalCards = groups.reduce((sum, group) => sum + group.count, 0)
  const placedCards = groups.reduce((sum, group) => sum + group.placed, 0)
  return {
    totalCards,
    uniquePokemon: groups.length,
    duplicates: totalCards - groups.length,
    first: groups[0] ?? null,
    last: groups.at(-1) ?? null,
    placedCards,
    progress: totalCards === 0 ? 0 : placedCards / totalCards,
  }
}

export function organizationStatus(organization: Organization): OrganizationStatus {
  if (organization.cards.length === 0) return 'empty'
  const summary = summarize(buildSortPlan(organization.cards, organization.placed))
  if (summary.placedCards >= summary.totalCards) return 'completed'
  if (summary.placedCards > 0) return 'sorting'
  return 'ready-to-sort'
}

export function tableSlot(position: number, columns: number): TableSlot {
  return { row: Math.floor(position / columns) + 1, column: (position % columns) + 1 }
}

export interface DeckCard {
  card: ScannedCard
  deckIndex: number
  placed: boolean
}

export function buildDeck(cards: ScannedCard[], placed: Record<number, number> = {}): DeckCard[] {
  const seen = new Map<number, number>()
  return cards.map((card, deckIndex) => {
    const occurrence = seen.get(card.pokedexNumber) ?? 0
    seen.set(card.pokedexNumber, occurrence + 1)
    return { card, deckIndex, placed: occurrence < (placed[card.pokedexNumber] ?? 0) }
  })
}

export function nextDeckIndex(deck: DeckCard[]) {
  return deck.findIndex((item) => !item.placed)
}

export function lastPlacedDeckIndex(deck: DeckCard[]) {
  return deck.findLastIndex((item) => item.placed)
}

export interface DexRangeItem {
  pokedexNumber: number
  group: SortGroup | null
}

export function dexRange(groups: SortGroup[], from: number, to: number): DexRangeItem[] {
  const byDex = new Map(groups.map((group) => [group.pokedexNumber, group]))
  const items: DexRangeItem[] = []
  for (let dex = from; dex <= to; dex++) items.push({ pokedexNumber: dex, group: byDex.get(dex) ?? null })
  return items
}

function label(group: SortGroup) {
  return `${group.name} (${formatDexNumber(group.pokedexNumber)})`
}

export function instructionFor(groups: SortGroup[], index: number, columns: number): SortInstruction | null {
  const group = groups[index]
  if (!group) return null

  const previous = groups.slice(0, index).reverse().find((item) => item.placed > 0) ?? null
  const next = groups.slice(index + 1).find((item) => item.placed > 0) ?? null
  const slot = tableSlot(group.position, columns)
  const startsNewRow = slot.column === 1 && slot.row > 1

  let kind: InstructionKind
  let headline: string
  if (group.placed > 0) {
    kind = 'stack'
    headline = `Junte à pilha de ${group.name}.`
  } else if (previous && next) {
    kind = 'between'
    headline = `Coloque entre ${previous.name} e ${next.name}.`
  } else if (previous) {
    kind = 'after'
    headline = `Coloque depois de ${previous.name}.`
  } else if (next) {
    kind = 'before'
    headline = `Coloque antes de ${next.name}.`
  } else {
    kind = 'first'
    headline = `Primeira carta da mesa: fileira ${slot.row}, posição ${slot.column}.`
  }

  let detail: string | null = null
  if (kind === 'stack') {
    detail = `Carta ${group.placed + 1} de ${group.count} deste Pokémon.`
  } else if (kind === 'first' && group.position > 0) {
    detail = `Deixe ${pluralize(group.position, 'espaço livre', 'espaços livres')} antes dela para os Pokémon que vêm antes na Pokédex.`
  } else if (group.count > 1) {
    detail = `Você tem ${group.count} cartas de ${group.name}. As próximas vão para esta mesma pilha.`
  } else if (kind === 'between' && previous && next) {
    detail = `Abra espaço entre ${label(previous)} e ${label(next)}.`
  }

  return { group, kind, previous, next, slot, headline, detail, startsNewRow }
}

export function outOfOrderItems(order: number[]) {
  const n = order.length
  const lengths = new Array<number>(n).fill(1)
  const parents = new Array<number>(n).fill(-1)
  let bestEnd = n > 0 ? 0 : -1
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (order[j] < order[i] && lengths[j] + 1 > lengths[i]) {
        lengths[i] = lengths[j] + 1
        parents[i] = j
      }
    }
    if (lengths[i] > lengths[bestEnd]) bestEnd = i
  }
  const keep = new Set<number>()
  for (let i = bestEnd; i >= 0; i = parents[i]) keep.add(order[i])
  return order.filter((value) => !keep.has(value))
}

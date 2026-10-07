import { normalizeText } from '@/lib/format'
import type { MatchCandidate, Pokemon } from '@/types'

export interface TextFragment {
  text: string
  weight: number
}

interface IndexedName {
  pokemon: Pokemon
  key: string
}

const CONFUSABLE_PAIRS = [
  'o0', 'oq', 'od', 'il', 'i1', 'l1', 'lt', 's5', 'b8', 'b6', 'g6', 'g9', 'z2', 'uv', 'nh', 'ce', 'ec', 'mn', 'rn', 'ao', 'a4', 'tf', 'yv', 'kx',
]

const CONFUSABLE = new Set(CONFUSABLE_PAIRS.flatMap(([a, b]) => [`${a}${b}`, `${b}${a}`]))

const IGNORED_WORDS = new Set([
  'pokemon', 'basic', 'basico', 'stage', 'estagio', 'weakness', 'fraqueza', 'resistance', 'resistencia', 'retreat', 'recuo',
  'evolves', 'evolui', 'from', 'trainer', 'treinador', 'energy', 'energia', 'damage', 'dano', 'attack', 'ataque', 'ability', 'habilidade',
])

const SHORT_NAME_LENGTH = 4
const MAX_LENGTH_GAP = 3

function substitutionCost(a: string, b: string) {
  if (a === b) return 0
  return CONFUSABLE.has(`${a}${b}`) ? 0.35 : 1
}

function weightedDistance(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      let value = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost(a[i - 1], b[j - 1]),
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, matrix[i - 2][j - 2] + 0.6)
      }
      matrix[i][j] = value
    }
  }
  return matrix[a.length][b.length]
}

export function similarity(a: string, b: string) {
  if (a === b) return 1
  const longest = Math.max(a.length, b.length)
  if (longest === 0) return 0
  return Math.max(0, 1 - weightedDistance(a, b) / longest)
}

export function fragmentsFromText(text: string): TextFragment[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+/).map((word) => ({ text: word, weight: 1 })))
}

export function createPokemonMatcher(index: Pokemon[]) {
  const names: IndexedName[] = []
  for (const pokemon of index) {
    const keys = new Set([normalizeText(pokemon.name), normalizeText(pokemon.displayName)])
    for (const key of keys) if (key) names.push({ pokemon, key })
  }

  function candidateStrings(fragments: TextFragment[]) {
    const words = fragments
      .map((fragment) => ({ key: normalizeText(fragment.text), weight: fragment.weight }))
      .filter((word) => word.key.length > 0)

    const strings: TextFragment[] = []
    words.forEach((word, position) => {
      if (word.key.length >= 3 && !IGNORED_WORDS.has(word.key)) strings.push({ text: word.key, weight: word.weight })
      const next = words[position + 1]
      if (next) {
        const joined = word.key + next.key
        if (joined.length >= 5 && joined.length <= 14) strings.push({ text: joined, weight: Math.max(word.weight, next.weight) })
      }
    })
    return strings
  }

  function match(fragments: TextFragment[], limit = 3): MatchCandidate[] {
    const best = new Map<number, MatchCandidate>()
    const numbers = new Set(
      fragments.flatMap((fragment) => fragment.text.match(/\d{1,4}/g) ?? []).map((value) => Number(value)),
    )

    for (const candidate of candidateStrings(fragments)) {
      for (const { pokemon, key } of names) {
        if (Math.abs(key.length - candidate.text.length) > MAX_LENGTH_GAP) continue
        let score = similarity(candidate.text, key)
        if (key.length <= SHORT_NAME_LENGTH && score < 0.85) continue
        if (score < 0.5) continue
        score *= 0.88 + 0.12 * candidate.weight
        if (numbers.has(pokemon.nationalDexNumber)) score = Math.min(1, score + 0.08)
        const current = best.get(pokemon.id)
        if (!current || current.score < score) {
          best.set(pokemon.id, { pokemon, score, matchedText: candidate.text })
        }
      }
    }

    return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit)
  }

  function search(query: string, limit = 8): Pokemon[] {
    const trimmed = query.trim()
    if (!trimmed) return []
    const numeric = trimmed.replace(/^#/, '')
    if (/^\d+$/.test(numeric)) {
      const value = Number(numeric)
      return index.filter((pokemon) => String(pokemon.nationalDexNumber).startsWith(String(value))).slice(0, limit)
    }
    const key = normalizeText(trimmed)
    if (!key) return []
    const prefix = index.filter((pokemon) => normalizeText(pokemon.name).startsWith(key))
    const contains = index.filter((pokemon) => !prefix.includes(pokemon) && normalizeText(pokemon.name).includes(key))
    const direct = [...prefix, ...contains]
    if (direct.length >= limit || key.length < 4) return direct.slice(0, limit)
    const fuzzy = match([{ text: trimmed, weight: 1 }], limit)
      .filter((candidate) => candidate.score >= 0.6 && !direct.includes(candidate.pokemon))
      .map((candidate) => candidate.pokemon)
    return [...direct, ...fuzzy].slice(0, limit)
  }

  return { match, search }
}

export type PokemonMatcher = ReturnType<typeof createPokemonMatcher>

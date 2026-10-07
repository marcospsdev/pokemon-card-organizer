import type { MatchCandidate } from '@/types'
import type { OcrEngine, OcrImage } from './ocrService'
import type { PokemonMatcher, TextFragment } from './pokemonMatcher'

export interface RecognitionResult {
  name: string
  confidence: number
  pokemonId: number | null
  candidates: MatchCandidate[]
  rawText: string
}

export interface PokemonRecognitionService {
  recognize(image: OcrImage): Promise<RecognitionResult>
}

const MIN_WORD_CONFIDENCE = 30
const AMBIGUITY_GAP = 0.06

export function createOcrRecognitionService(engine: OcrEngine, matcher: PokemonMatcher): PokemonRecognitionService {
  return {
    async recognize(image) {
      const ocr = await engine.recognize(image)
      const words = ocr.words.filter((word) => word.confidence >= MIN_WORD_CONFIDENCE && word.text.trim())
      const tallest = Math.max(1, ...words.map((word) => word.height))
      const fragments: TextFragment[] = words.map((word) => ({ text: word.text, weight: word.height / tallest }))

      const candidates = matcher.match(fragments, 3)
      const [top, second] = candidates
      if (!top) return { name: '', confidence: 0, pokemonId: null, candidates, rawText: ocr.text }

      const ambiguous = second !== undefined && top.score - second.score < AMBIGUITY_GAP
      const confidence = ambiguous ? Math.min(top.score, 0.8) : top.score

      return {
        name: top.pokemon.displayName,
        confidence,
        pokemonId: top.pokemon.id,
        candidates,
        rawText: ocr.text,
      }
    },
  }
}

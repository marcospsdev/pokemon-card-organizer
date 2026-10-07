import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { captureGuideRegion, signatureDistance } from '@/services/frameService'
import { ocrService } from '@/services/ocrService'
import type { PokemonRecognitionService } from '@/services/pokemonRecognitionService'
import type { MatchCandidate, Pokemon, ScannerState } from '@/types'

const REMOVAL_DISTANCE = 0.5
const REMOVAL_FRAMES = 3
const MIN_LOCK_MS = 1400
const IDENTIFIED_HOLD_MS = 1400
const LOOP_INTERVAL_MS = 220
const LOCKED_POLL_MS = 150
const REPEAT_WINDOW_MS = 5000

interface CardLock {
  signature: Float32Array
  pokemonId: number | null
  lockedAt: number
  changedFrames: number
}

interface ReleasedCard {
  pokemonId: number
  releasedAt: number
}

export type ConfirmationReason = 'uncertain' | 'repeat'

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  guideRef: RefObject<HTMLElement | null>
  active: boolean
  recognition: PokemonRecognitionService | null
  thresholds: { auto: number; minimum: number }
  onIdentified: (pokemon: Pokemon, confidence: number) => void
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function useContinuousScanner({ videoRef, guideRef, active, recognition, thresholds, onIdentified }: Options) {
  const [state, setState] = useState<ScannerState>('idle')
  const [candidates, setCandidates] = useState<MatchCandidate[]>([])
  const [confirmationReason, setConfirmationReason] = useState<ConfirmationReason>('uncertain')
  const [engineProgress, setEngineProgress] = useState(0)
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState(false)
  const [lastText, setLastText] = useState('')

  const lockRef = useRef<CardLock | null>(null)
  const releasedRef = useRef<ReleasedCard | null>(null)
  const pausedRef = useRef(false)
  const userPausedRef = useRef(false)
  const holdUntilRef = useRef(0)
  const thresholdsRef = useRef(thresholds)
  const onIdentifiedRef = useRef(onIdentified)

  useEffect(() => {
    thresholdsRef.current = thresholds
    onIdentifiedRef.current = onIdentified
  })

  const setPhase = useCallback((next: ScannerState) => {
    if (next !== 'identified' && next !== 'confirmation' && Date.now() < holdUntilRef.current) return
    setState(next)
  }, [])

  const warmEngine = useCallback(() => {
    ocrService
      .warmup(setEngineProgress)
      .then(() => setEngineReady(true))
      .catch(() => setEngineError(true))
  }, [])

  useEffect(() => {
    warmEngine()
  }, [warmEngine])

  const loadEngine = useCallback(() => {
    setEngineError(false)
    warmEngine()
  }, [warmEngine])

  const identify = useCallback(
    (pokemon: Pokemon, confidence: number) => {
      onIdentifiedRef.current(pokemon, confidence)
      holdUntilRef.current = Date.now() + IDENTIFIED_HOLD_MS
      setPhase('identified')
    },
    [setPhase],
  )

  useEffect(() => {
    if (!active || !engineReady || !recognition) return
    let cancelled = false

    const handleResult = (result: Awaited<ReturnType<PokemonRecognitionService['recognize']>>, signature: Float32Array) => {
      const { auto, minimum } = thresholdsRef.current
      const [top] = result.candidates

      if (!top || top.score < minimum) {
        setPhase('scanning')
        return
      }

      lockRef.current = { signature, pokemonId: top.pokemon.id, lockedAt: Date.now(), changedFrames: 0 }
      const released = releasedRef.current
      const repeated = released !== null && released.pokemonId === top.pokemon.id && Date.now() - released.releasedAt < REPEAT_WINDOW_MS

      if (result.confidence >= auto && !repeated) {
        identify(top.pokemon, result.confidence)
        return
      }
      pausedRef.current = true
      setConfirmationReason(repeated ? 'repeat' : 'uncertain')
      setCandidates(result.candidates)
      setPhase('confirmation')
    }

    const watchRemoval = (lock: CardLock, signature: Float32Array) => {
      lock.changedFrames = signatureDistance(lock.signature, signature) >= REMOVAL_DISTANCE ? lock.changedFrames + 1 : 0
      if (lock.changedFrames < REMOVAL_FRAMES || Date.now() - lock.lockedAt < MIN_LOCK_MS) {
        setPhase('scanning-next')
        return
      }
      releasedRef.current = lock.pokemonId === null ? null : { pokemonId: lock.pokemonId, releasedAt: Date.now() }
      lockRef.current = null
      setPhase('scanning')
    }

    const loop = async () => {
      setPhase('scanning')
      while (!cancelled) {
        if (pausedRef.current || userPausedRef.current) {
          await wait(200)
          continue
        }
        const video = videoRef.current
        const guide = guideRef.current
        const frame = video && guide ? captureGuideRegion(video, guide) : null
        if (!frame) {
          await wait(250)
          continue
        }

        const lock = lockRef.current
        if (lock) {
          watchRemoval(lock, frame.signature)
          await wait(LOCKED_POLL_MS)
          continue
        }

        setPhase('processing')
        try {
          const result = await recognition.recognize(frame.canvas)
          if (cancelled) break
          setLastText(result.rawText.trim())
          handleResult(result, frame.signature)
        } catch {
          await wait(600)
        }
        await wait(LOOP_INTERVAL_MS)
      }
    }

    void loop()
    return () => {
      cancelled = true
    }
  }, [active, engineReady, recognition, videoRef, guideRef, setPhase, identify])

  const resolveConfirmation = useCallback(
    (pokemon: Pokemon | null, confidence = 1) => {
      setCandidates([])
      pausedRef.current = false
      const lock = lockRef.current
      if (lock) {
        lock.lockedAt = Date.now()
        lock.changedFrames = 0
        lock.pokemonId = pokemon?.id ?? null
      }
      if (pokemon) identify(pokemon, confidence)
      else setPhase('scanning-next')
    },
    [identify, setPhase],
  )

  const setUserPaused = useCallback((paused: boolean) => {
    userPausedRef.current = paused
    holdUntilRef.current = 0
    setState(paused ? 'paused' : lockRef.current ? 'scanning-next' : 'scanning')
  }, [])

  const releaseLock = useCallback(() => {
    lockRef.current = null
    releasedRef.current = null
  }, [])

  return {
    state,
    candidates,
    confirmationReason,
    engineReady,
    engineProgress,
    engineError,
    lastText,
    retryEngine: loadEngine,
    resolveConfirmation,
    setUserPaused,
    releaseLock,
  }
}

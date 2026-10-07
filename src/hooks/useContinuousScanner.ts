import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { captureGuideRegion, signatureDistance } from '@/services/frameService'
import { ocrService } from '@/services/ocrService'
import type { PokemonRecognitionService } from '@/services/pokemonRecognitionService'
import type { MatchCandidate, Pokemon, ScannerState } from '@/types'

const STILL_SCENE_DISTANCE = 0.22
const SAME_CARD_DISTANCE = 0.55
const MISSES_TO_RELEASE = 2
const IDENTIFIED_HOLD_MS = 1400
const LOOP_INTERVAL_MS = 220

interface CardLock {
  signature: Float32Array
  misses: number
}

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
  const [engineProgress, setEngineProgress] = useState(0)
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState(false)
  const [lastText, setLastText] = useState('')

  const lockRef = useRef<CardLock | null>(null)
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
      const lock = lockRef.current

      if (!top || top.score < minimum) {
        if (lock) {
          lock.misses++
          if (lock.misses >= MISSES_TO_RELEASE) lockRef.current = null
        }
        setPhase(lockRef.current ? 'scanning-next' : 'scanning')
        return
      }

      if (lock && signatureDistance(lock.signature, signature) < SAME_CARD_DISTANCE) {
        lock.misses = 0
        lock.signature = signature
        setPhase('scanning-next')
        return
      }

      lockRef.current = { signature, misses: 0 }
      if (result.confidence >= auto) {
        identify(top.pokemon, result.confidence)
        return
      }
      pausedRef.current = true
      setCandidates(result.candidates)
      setPhase('confirmation')
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
        if (lock && signatureDistance(lock.signature, frame.signature) < STILL_SCENE_DISTANCE) {
          setPhase('scanning-next')
          await wait(350)
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
  }, [])

  return {
    state,
    candidates,
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

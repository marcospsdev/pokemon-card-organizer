import { CameraOff, Flashlight, FlashlightOff, Keyboard, LoaderCircle, Pause, Play, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { cn, pluralize } from '@/lib/format'
import { useCamera } from '@/hooks/useCamera'
import { useContinuousScanner } from '@/hooks/useContinuousScanner'
import { usePokemonIndex } from '@/hooks/usePokemonData'
import { ocrService } from '@/services/ocrService'
import { createOcrRecognitionService } from '@/services/pokemonRecognitionService'
import { STRICTNESS_THRESHOLDS, useSettingsStore, vibrate } from '@/store/settingsStore'
import { useOrganization, useOrganizationsStore } from '@/store/organizationsStore'
import { toast } from '@/store/toastStore'
import type { Pokemon, ScannerState } from '@/types'
import { Button, IconButton } from '@/components/ui/Button'
import { ManualAddSheet } from '@/components/scanner/ManualAddSheet'
import { PokemonConfirmation } from '@/components/scanner/PokemonConfirmation'
import { RecentCaptures, type RecentCapture } from '@/components/scanner/RecentCaptures'
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay'
import { ScanResult, type ScanResultData } from '@/components/scanner/ScanResult'

const STATUS_TEXT: Record<ScannerState, string> = {
  idle: 'Preparando…',
  starting: 'Abrindo a câmera…',
  scanning: 'Aponte para o nome do Pokémon',
  processing: 'Lendo a carta…',
  identified: 'Registrado! Retire a carta',
  confirmation: 'Confirme o Pokémon',
  'scanning-next': 'Retire a carta e mostre a próxima',
  paused: 'Scanner pausado',
  error: 'Algo deu errado',
}

export function ScannerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const organization = useOrganization(id)
  const addCard = useOrganizationsStore((state) => state.addCard)
  const removeCard = useOrganizationsStore((state) => state.removeCard)
  const setActive = useOrganizationsStore((state) => state.setActive)
  const strictness = useSettingsStore((state) => state.strictness)
  const { matcher, list, isLoading: indexLoading, isError: indexError, refetch } = usePokemonIndex()
  const { videoRef, status: cameraStatus, start, stop, torchSupported, torchOn, toggleTorch } = useCamera()
  const guideRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<ScanResultData | null>(null)
  const [captures, setCaptures] = useState<RecentCapture[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const resultTimer = useRef<number | undefined>(undefined)

  const recognition = useMemo(() => (list.length ? createOcrRecognitionService(ocrService, matcher) : null), [list.length, matcher])

  const register = useCallback(
    (pokemon: Pokemon, confidence: number, source: 'scanner' | 'manual') => {
      if (!id) return
      const card = addCard(id, pokemon, confidence, source)
      const cards = useOrganizationsStore.getState().organizations.find((item) => item.id === id)?.cards ?? []
      const count = cards.filter((item) => item.pokedexNumber === pokemon.nationalDexNumber).length
      vibrate(source === 'scanner' ? [18, 40, 18] : 18)
      setCaptures((current) => [...current.slice(-9), { cardId: card.id, pokemon }])
      setResult({ key: card.id, pokemon, count })
      window.clearTimeout(resultTimer.current)
      resultTimer.current = window.setTimeout(() => setResult(null), 1300)
      toast(`${pokemon.displayName} registrado`, {
        duration: 2600,
        action: {
          label: 'Desfazer',
          onClick: () => {
            removeCard(id, card.id)
            setCaptures((current) => current.filter((item) => item.cardId !== card.id))
          },
        },
      })
    },
    [id, addCard, removeCard],
  )

  const scanner = useContinuousScanner({
    videoRef,
    guideRef,
    active: cameraStatus === 'ready' && !manualOpen,
    recognition,
    thresholds: STRICTNESS_THRESHOLDS[strictness],
    onIdentified: (pokemon, confidence) => register(pokemon, confidence, 'scanner'),
  })

  useEffect(() => {
    void start()
    return () => stop()
  }, [start, stop])

  useEffect(() => {
    if (id) setActive(id)
    return () => window.clearTimeout(resultTimer.current)
  }, [id, setActive])

  if (!organization || !id) return <Navigate to='/organizations' replace />

  const total = organization.cards.length
  const unique = new Set(organization.cards.map((card) => card.pokedexNumber)).size
  const cameraBlocked = cameraStatus === 'denied' || cameraStatus === 'unavailable' || cameraStatus === 'error'
  const preparing = !cameraBlocked && (cameraStatus !== 'ready' || !scanner.engineReady || indexLoading)
  const state: ScannerState = paused ? 'paused' : scanner.state

  const togglePause = () => {
    const next = !paused
    setPaused(next)
    scanner.setUserPaused(next)
  }

  const finish = () => navigate(`/organizations/${id}`, { replace: true })

  return (
    <div className='fixed inset-0 z-40 overflow-hidden bg-ink-950 text-white'>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label='Imagem da câmera'
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', cameraStatus === 'ready' ? 'opacity-100' : 'opacity-0')}
      />

      {!cameraBlocked && <ScannerOverlay ref={guideRef} state={preparing ? 'idle' : state} />}
      <ScanResult result={result} />

      <header className='absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))]'>
        <IconButton label='Fechar scanner' tone='dark' onClick={finish}>
          <X className='h-5 w-5' />
        </IconButton>
        <div className='glass-dark min-w-0 rounded-full px-4 py-2 text-center ring-1 ring-white/10'>
          <div className='truncate text-[13px] font-semibold'>{organization.name}</div>
          <div className='text-[12px] text-white/60 tabular'>
            {pluralize(total, 'carta', 'cartas')} · {pluralize(unique, 'Pokémon', 'Pokémon')}
          </div>
        </div>
        {torchSupported ? (
          <IconButton label={torchOn ? 'Desligar lanterna' : 'Ligar lanterna'} tone='dark' onClick={() => void toggleTorch()}>
            {torchOn ? <FlashlightOff className='h-5 w-5' /> : <Flashlight className='h-5 w-5' />}
          </IconButton>
        ) : (
          <span className='w-10' />
        )}
      </header>

      {cameraBlocked && (
        <div className='absolute inset-0 flex flex-col items-center justify-center px-8 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-white/10'>
            <CameraOff className='h-8 w-8 text-white/80' />
          </div>
          <h1 className='mt-5 text-[22px] font-bold'>
            {cameraStatus === 'denied' ? 'Sem acesso à câmera' : cameraStatus === 'unavailable' ? 'Câmera indisponível' : 'Não foi possível abrir a câmera'}
          </h1>
          <p className='mt-2 max-w-sm text-[15px] text-white/60'>
            {cameraStatus === 'denied'
              ? 'Permita o uso da câmera nas configurações do navegador. Em celulares, o site precisa estar em HTTPS.'
              : 'Você ainda pode adicionar as cartas digitando o nome do Pokémon.'}
          </p>
          <div className='mt-6 flex gap-2'>
            <Button variant='glass' onClick={() => void start()}>
              Tentar novamente
            </Button>
            <Button onClick={() => setManualOpen(true)} icon={<Keyboard className='h-4 w-4' />}>
              Digitar nome
            </Button>
          </div>
        </div>
      )}

      <div className='absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-[max(18px,env(safe-area-inset-bottom))]'>
        {!cameraBlocked && (
          <div className='flex flex-col items-center gap-1.5'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={preparing ? 'preparing' : state}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  'glass-dark flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold ring-1 ring-white/10',
                  state === 'identified' && !preparing && 'bg-emerald-500/85 ring-emerald-300/40',
                )}
                role='status'
              >
                {preparing && <LoaderCircle className='h-4 w-4 animate-spin' aria-hidden />}
                {preparing
                  ? indexError
                    ? 'Não foi possível carregar a Pokédex'
                    : scanner.engineError
                      ? 'Falha ao carregar o leitor de texto'
                      : `Preparando leitor… ${Math.round(scanner.engineProgress * 100)}%`
                  : STATUS_TEXT[state]}
              </motion.div>
            </AnimatePresence>
            {(indexError || scanner.engineError) && (
              <button
                type='button'
                className='text-[13px] font-semibold text-white/80 underline'
                onClick={() => (indexError ? void refetch() : scanner.retryEngine())}
              >
                Tentar novamente
              </button>
            )}
            {!preparing && scanner.lastText && (state === 'scanning' || state === 'processing') && (
              <div className='max-w-[80vw] truncate font-mono text-[11px] text-white/40' aria-hidden>
                lido: {scanner.lastText.replace(/\s+/g, ' ').slice(0, 48)}
              </div>
            )}
          </div>
        )}

        <RecentCaptures captures={captures} />

        <div className='flex w-full max-w-md items-center justify-between gap-3'>
          <Button variant='glass' size='md' onClick={() => setManualOpen(true)} icon={<Keyboard className='h-[18px] w-[18px]' />}>
            Digitar
          </Button>
          {!cameraBlocked && (
            <motion.button
              type='button'
              whileTap={{ scale: 0.9 }}
              onClick={togglePause}
              aria-label={paused ? 'Retomar scanner' : 'Pausar scanner'}
              className='flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/95 text-ink-900 ring-4 ring-white/25'
            >
              {paused ? <Play className='h-7 w-7 translate-x-0.5' fill='currentColor' /> : <Pause className='h-7 w-7' fill='currentColor' />}
            </motion.button>
          )}
          <Button size='md' onClick={finish} disabled={total === 0}>
            Concluir
          </Button>
        </div>
      </div>

      <PokemonConfirmation
        candidates={scanner.candidates}
        repeat={scanner.confirmationReason === 'repeat'}
        onConfirm={(pokemon, confidence) => scanner.resolveConfirmation(pokemon, confidence)}
        onSkip={() => scanner.resolveConfirmation(null)}
        onManual={() => {
          scanner.resolveConfirmation(null)
          setManualOpen(true)
        }}
      />

      <ManualAddSheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onPick={(pokemon) => {
          register(pokemon, 1, 'manual')
          setManualOpen(false)
        }}
      />
    </div>
  )
}

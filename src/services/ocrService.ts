import type { Worker } from 'tesseract.js'

export type OcrImage = Blob | HTMLCanvasElement

export interface OcrWord {
  text: string
  confidence: number
  height: number
}

export interface OcrResult {
  text: string
  confidence: number
  words: OcrWord[]
}

export interface OcrEngine {
  warmup(onProgress?: (progress: number) => void): Promise<void>
  recognize(image: OcrImage): Promise<OcrResult>
  dispose(): Promise<void>
}

const CHAR_WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÉéèÈ0123456789.'-:♀♂# "

export function createTesseractEngine(): OcrEngine {
  let worker: Worker | null = null
  let loading: Promise<Worker> | null = null
  let progressListener: ((progress: number) => void) | undefined

  async function load() {
    const { createWorker, PSM } = await import('tesseract.js')
    const instance = await createWorker('eng', undefined, {
      logger: (message) => {
        if (message.status.startsWith('loading') || message.status.startsWith('initializ')) {
          progressListener?.(message.progress)
        }
      },
    })
    await instance.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: CHAR_WHITELIST,
      preserve_interword_spaces: '1',
    })
    worker = instance
    return instance
  }

  async function ensureWorker() {
    if (worker) return worker
    loading ??= load().catch((error: unknown) => {
      loading = null
      throw error
    })
    return loading
  }

  return {
    async warmup(onProgress) {
      progressListener = onProgress
      await ensureWorker()
      onProgress?.(1)
    },

    async recognize(image) {
      const instance = await ensureWorker()
      const { data } = await instance.recognize(image, {}, { text: true, blocks: true })
      const words: OcrWord[] = []
      for (const block of data.blocks ?? []) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            for (const word of line.words) {
              words.push({ text: word.text, confidence: word.confidence, height: word.bbox.y1 - word.bbox.y0 })
            }
          }
        }
      }
      return { text: data.text, confidence: data.confidence, words }
    },

    async dispose() {
      const instance = worker
      worker = null
      loading = null
      await instance?.terminate()
    },
  }
}

export const ocrService = createTesseractEngine()

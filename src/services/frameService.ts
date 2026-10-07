export interface CapturedFrame {
  canvas: HTMLCanvasElement
  signature: Float32Array
}

const OCR_WIDTH = 720
const SIGNATURE_WIDTH = 18
const SIGNATURE_HEIGHT = 24

function videoRegionFor(video: HTMLVideoElement, guide: DOMRect) {
  const frame = video.getBoundingClientRect()
  const scale = Math.max(frame.width / video.videoWidth, frame.height / video.videoHeight)
  const offsetX = (video.videoWidth * scale - frame.width) / 2
  const offsetY = (video.videoHeight * scale - frame.height) / 2
  const x = (guide.left - frame.left + offsetX) / scale
  const y = (guide.top - frame.top + offsetY) / scale
  const width = guide.width / scale
  const height = guide.height / scale
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(video.videoWidth - Math.max(0, x), width),
    height: Math.min(video.videoHeight - Math.max(0, y), height),
  }
}

function enhanceContrast(context: CanvasRenderingContext2D, width: number, height: number) {
  const image = context.getImageData(0, 0, width, height)
  const pixels = image.data
  const histogram = new Uint32Array(256)
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114)
    pixels[i] = gray
    histogram[gray]++
  }
  const total = width * height
  let low = 0
  let high = 255
  let accumulated = 0
  for (let value = 0; value < 256; value++) {
    accumulated += histogram[value]
    if (accumulated > total * 0.02) {
      low = value
      break
    }
  }
  accumulated = 0
  for (let value = 255; value >= 0; value--) {
    accumulated += histogram[value]
    if (accumulated > total * 0.02) {
      high = value
      break
    }
  }
  const range = Math.max(1, high - low)
  for (let i = 0; i < pixels.length; i += 4) {
    const value = Math.min(255, Math.max(0, ((pixels[i] - low) * 255) / range))
    pixels[i] = value
    pixels[i + 1] = value
    pixels[i + 2] = value
  }
  context.putImageData(image, 0, 0)
}

function computeSignature(source: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  canvas.width = SIGNATURE_WIDTH
  canvas.height = SIGNATURE_HEIGHT
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const signature = new Float32Array(SIGNATURE_WIDTH * SIGNATURE_HEIGHT)
  if (!context) return signature
  context.drawImage(source, 0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT)
  const pixels = context.getImageData(0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT).data
  let sum = 0
  for (let i = 0; i < signature.length; i++) {
    signature[i] = pixels[i * 4]
    sum += signature[i]
  }
  const mean = sum / signature.length
  let variance = 0
  for (const value of signature) variance += (value - mean) ** 2
  const deviation = Math.sqrt(variance / signature.length) || 1
  for (let i = 0; i < signature.length; i++) signature[i] = (signature[i] - mean) / deviation
  return signature
}

export function signatureDistance(a: Float32Array, b: Float32Array) {
  let total = 0
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i])
  return total / a.length
}

export function captureGuideRegion(video: HTMLVideoElement, guide: HTMLElement): CapturedFrame | null {
  if (video.readyState < 2 || !video.videoWidth) return null
  const region = videoRegionFor(video, guide.getBoundingClientRect())
  if (region.width < 20 || region.height < 20) return null

  const canvas = document.createElement('canvas')
  const scale = Math.min(1.6, OCR_WIDTH / region.width)
  canvas.width = Math.round(region.width * scale)
  canvas.height = Math.round(region.height * scale)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(video, region.x, region.y, region.width, region.height, 0, 0, canvas.width, canvas.height)
  const signature = computeSignature(canvas)
  enhanceContrast(context, canvas.width, canvas.height)
  return { canvas, signature }
}

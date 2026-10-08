import type { DeckAccent } from '@/types'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback para contextos sem Clipboard API (ex.: HTTP na rede local)
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
    }
  }
}

export function formatDexNumber(value: number) {
  return `#${String(value).padStart(value > 999 ? 4 : 3, '0')}`
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const SPECIAL_DISPLAY_NAMES: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'type-null': 'Type: Null',
  flabebe: 'Flabébé',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
}

export function toDisplayName(slug: string) {
  return (
    SPECIAL_DISPLAY_NAMES[slug] ??
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  )
}

export const TYPE_META: Record<string, { label: string; color: string; soft: string }> = {
  normal: { label: 'Normal', color: '#9a9a7d', soft: '#f1f0e8' },
  fire: { label: 'Fogo', color: '#e8622c', soft: '#fdeee6' },
  water: { label: 'Água', color: '#4b8be8', soft: '#e8f0fc' },
  electric: { label: 'Elétrico', color: '#e0b100', soft: '#fdf6dc' },
  grass: { label: 'Planta', color: '#5aa83c', soft: '#ebf5e5' },
  ice: { label: 'Gelo', color: '#5cc2c4', soft: '#e7f6f6' },
  fighting: { label: 'Lutador', color: '#bf3f36', soft: '#f8e6e4' },
  poison: { label: 'Venenoso', color: '#9b4fb0', soft: '#f3e8f6' },
  ground: { label: 'Terrestre', color: '#c99a4d', soft: '#f8f0e2' },
  flying: { label: 'Voador', color: '#8c9ee8', soft: '#eef1fc' },
  psychic: { label: 'Psíquico', color: '#e95584', soft: '#fce8ef' },
  bug: { label: 'Inseto', color: '#93a821', soft: '#f2f5df' },
  rock: { label: 'Pedra', color: '#b39f4f', soft: '#f5f1e2' },
  ghost: { label: 'Fantasma', color: '#6a5a9c', soft: '#ece9f4' },
  dragon: { label: 'Dragão', color: '#6143e0', soft: '#ebe7fb' },
  dark: { label: 'Sombrio', color: '#5f5048', soft: '#ebe8e6' },
  steel: { label: 'Aço', color: '#7f9aae', soft: '#ecf0f3' },
  fairy: { label: 'Fada', color: '#de85c6', soft: '#fbedf7' },
}

export function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, color: '#6b7280', soft: '#eff1f4' }
}

export function regionLabel(region: string) {
  return region.charAt(0).toUpperCase() + region.slice(1)
}

export const DECK_ACCENTS: Record<DeckAccent, { label: string; from: string; to: string; ring: string }> = {
  red: { label: 'Vermelho', from: '#e3243f', to: '#8f0a1c', ring: '#dc0a2d' },
  blue: { label: 'Azul', from: '#4b8ff7', to: '#1b4fb0', ring: '#2f7cf6' },
  green: { label: 'Verde', from: '#4fb26b', to: '#1f6b3a', ring: '#3a9a57' },
  yellow: { label: 'Amarelo', from: '#ffd84d', to: '#d99a00', ring: '#e0b100' },
  purple: { label: 'Roxo', from: '#9271e8', to: '#4b2fa8', ring: '#6f4fd6' },
  ink: { label: 'Grafite', from: '#4a505c', to: '#16181d', ring: '#2a2e37' },
}

export function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `há ${pluralize(days, 'dia', 'dias')}`
  return new Date(iso).toLocaleDateString('pt-BR')
}

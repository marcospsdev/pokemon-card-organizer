import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storageService } from '@/services/storageService'

export type ScanStrictness = 'strict' | 'balanced' | 'flexible'

export const STRICTNESS_THRESHOLDS: Record<ScanStrictness, { auto: number; minimum: number }> = {
  strict: { auto: 0.95, minimum: 0.72 },
  balanced: { auto: 0.86, minimum: 0.7 },
  flexible: { auto: 0.8, minimum: 0.62 },
}

interface SettingsState {
  tableColumns: number
  strictness: ScanStrictness
  haptics: boolean
  setTableColumns: (value: number) => void
  setStrictness: (value: ScanStrictness) => void
  setHaptics: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tableColumns: 6,
      strictness: 'balanced',
      haptics: true,
      setTableColumns: (value) => set({ tableColumns: Math.min(12, Math.max(3, value)) }),
      setStrictness: (value) => set({ strictness: value }),
      setHaptics: (value) => set({ haptics: value }),
    }),
    {
      name: 'pokedex-sorter:settings',
      storage: createJSONStorage(() => storageService.localState),
    },
  ),
)

export function vibrate(pattern: number | number[]) {
  if (!useSettingsStore.getState().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    return
  }
}

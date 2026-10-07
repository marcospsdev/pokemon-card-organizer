import { del, get, set } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

interface CachedValue<T> {
  savedAt: number
  value: T
}

export const storageService = {
  async readCache<T>(key: string, maxAgeMs: number): Promise<T | null> {
    try {
      const cached = await get<CachedValue<T>>(key)
      if (!cached || Date.now() - cached.savedAt > maxAgeMs) return null
      return cached.value
    } catch {
      return null
    }
  },

  async writeCache<T>(key: string, value: T) {
    try {
      await set(key, { savedAt: Date.now(), value } satisfies CachedValue<T>)
    } catch {
      return
    }
  },

  async clearCache(key: string) {
    try {
      await del(key)
    } catch {
      return
    }
  },

  localState: {
    getItem(name) {
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem(name, value) {
      try {
        localStorage.setItem(name, value)
      } catch {
        return
      }
    },
    removeItem(name) {
      try {
        localStorage.removeItem(name)
      } catch {
        return
      }
    },
  } satisfies StateStorage,
}

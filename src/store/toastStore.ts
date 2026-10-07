import { create } from 'zustand'
import { createId } from '@/lib/format'

export interface ToastItem {
  id: string
  message: string
  tone: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  show: (toast: Omit<ToastItem, 'id' | 'tone' | 'duration'> & Partial<Pick<ToastItem, 'tone' | 'duration'>>) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show(toast) {
    const item: ToastItem = { id: createId(), tone: 'default', duration: 3200, ...toast }
    set((state) => ({ toasts: [...state.toasts.slice(-2), item] }))
    window.setTimeout(() => get().dismiss(item.id), item.duration)
    return item.id
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))

export const toast = (message: string, options: Partial<Omit<ToastItem, 'id' | 'message'>> = {}) =>
  useToastStore.getState().show({ message, ...options })

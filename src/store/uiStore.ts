import { create } from 'zustand'

interface UiState {
  newOrganizationOpen: boolean
  openNewOrganization: () => void
  closeNewOrganization: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  newOrganizationOpen: false,
  openNewOrganization: () => set({ newOrganizationOpen: true }),
  closeNewOrganization: () => set({ newOrganizationOpen: false }),
}))

import { create } from 'zustand'

/**
 * Super Admin tenant filter - when changed in header, all list pages
 * (Users, Charge Points, Transactions, Dashboard) react and refetch with new tenant.
 */
interface TenantFilterState {
  selectedTenantId: string | null
  setSelectedTenantId: (id: string | null) => void
}

export const useTenantFilterStore = create<TenantFilterState>((set) => ({
  selectedTenantId: null,
  setSelectedTenantId: (id) => set({ selectedTenantId: id }),
}))

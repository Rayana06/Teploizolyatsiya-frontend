import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface MaterialFilters {
  search: string
  insulationType: string
  maxThicknessMm: number
  maxPriceRubM2: number
}

interface FiltersState {
  draft: MaterialFilters
  applied: MaterialFilters
}

const emptyFilters: MaterialFilters = { search: '', insulationType: '', maxThicknessMm: 1000, maxPriceRubM2: 1570.15 }
const initialState: FiltersState = { draft: { ...emptyFilters }, applied: { ...emptyFilters } }

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDraftFilter<K extends keyof MaterialFilters>(state: FiltersState, action: PayloadAction<{ key: K; value: MaterialFilters[K] }>) {
      state.draft[action.payload.key] = action.payload.value
    },
    applyFilters(state) {
      state.applied = { ...state.draft }
    },
    resetFilters: () => initialState,
  },
})

export const { setDraftFilter, applyFilters, resetFilters } = filtersSlice.actions
export default filtersSlice.reducer

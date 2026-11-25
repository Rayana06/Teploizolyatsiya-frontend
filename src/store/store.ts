import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import filtersReducer from './filtersSlice'
import materialsReducer from './materialsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
    materials: materialsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

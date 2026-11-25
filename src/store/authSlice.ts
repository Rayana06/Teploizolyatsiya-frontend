import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  id: number
  email: string
  displayName: string
}

interface AuthState {
  user: AuthUser | null
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: AuthState = { user: null, status: 'idle', error: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStarted(state) {
      state.status = 'loading'
      state.error = null
    },
    authenticated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      state.status = 'idle'
      state.error = null
    },
    authFailed(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
    signedOut(state) {
      state.user = null
      state.status = 'idle'
      state.error = null
    },
  },
})

export const { authStarted, authenticated, authFailed, signedOut } = authSlice.actions
export default authSlice.reducer

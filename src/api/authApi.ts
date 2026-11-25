import { apiAxios } from './axiosInstance'
import type { AuthUser } from '../store/authSlice'

export async function authenticate(email: string, password: string): Promise<AuthUser> {
  const response = await apiAxios.post<{ user: AuthUser }>('/users/authenticate', { email, password })
  return response.data.user
}

export async function logout(): Promise<void> {
  await apiAxios.post('/users/logout')
}

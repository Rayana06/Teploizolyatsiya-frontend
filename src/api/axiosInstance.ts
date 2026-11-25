import axios, { type AxiosRequestConfig } from 'axios'

export const apiAxios = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 8_000,
})

// Orval calls this mutator from every generated API function.
export async function axiosInstance<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiAxios.request<T>(config)
  return response.data
}

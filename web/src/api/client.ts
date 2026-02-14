import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const GATEWAY_URL = import.meta.env.VITE_OCPP_GATEWAY_URL as string | undefined

if (!GATEWAY_URL) {
  console.error('[OCPP] VITE_OCPP_GATEWAY_URL is not configured. Gateway features will be unavailable.')
}

// Gateway endpoints are public (no JWT auth required).
// gatewayApi intentionally has NO auth interceptors — unlike `api` below.
export const gatewayApi = GATEWAY_URL
  ? axios.create({ baseURL: GATEWAY_URL })
  : null

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken,
          })
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

import axios from 'axios'
import { STORAGE_KEY } from '../context/auth'

// The one axios instance every request goes through. Backend is a separate
// origin (FastAPI :8000 vs Vite :5173), so base URL is absolute, not relative.
// Exported since the SPA also links to backend-rendered pages (tracking view)
// that must follow the same host.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
).replace(/\/$/, '')

// The backend-rendered tracking page. Not JSON — link to it, never fetch it.
export const TRACKING_URL = (id) =>
  `${API_BASE_URL}/shipment/track?id=${encodeURIComponent(id)}`

const api = axios.create({ baseURL: API_BASE_URL })

// Attach bearer token per-request (read fresh from localStorage, not cached
// at login) so another tab's write/logout takes effect immediately.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const session = raw ? JSON.parse(raw) : null
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  } catch {
    // Unreadable/corrupt storage: send unauthenticated, backend answers 401
    // same as an expired token would.
  }
  return config
})

// Fallbacks for statuses where the backend sends no usable message of its own.
const STATUS_MESSAGES = {
  401: 'INVALID EMAIL OR PASSWORD',
  403: 'NOT AUTHORIZED',
  404: 'NOT FOUND',
  406: 'NO DELIVERY PARTNER COVERS THAT ZIP CODE',
  409: 'THAT EMAIL IS ALREADY REGISTERED',
  422: 'PLEASE CHECK YOUR INPUT FIELDS',
  500: 'SERVER ERROR, PLEASE TRY AGAIN',
}

// Turn an axios failure into one short uppercase line for the pixel UI.
// FastAPI's own 422 puts an ARRAY in `detail`, not a string — only show
// `detail` when it's a string, else fall back to the status message.
export function apiError(err, fallback = 'SOMETHING WENT WRONG') {
  if (!err?.response) return 'CANNOT CONNECT TO SERVER'
  const { status, data } = err.response
  if (typeof data?.detail === 'string') return data.detail.toUpperCase()
  return STATUS_MESSAGES[status] ?? fallback
}

export default api

import axios from 'axios'
import { STORAGE_KEY } from '../context/auth'

// The one axios instance every request goes through.
//
// The backend runs on its own origin (FastAPI on :8000, Vite on :5173) and its
// CORS middleware allows exactly http://localhost:5173, so the base URL is
// absolute rather than a same-origin path.
// Exported because the backend also serves pages the SPA links out to (the
// Jinja2 tracking view), and those must follow the same host — hardcoding
// localhost breaks the moment the app is opened from another device.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
).replace(/\/$/, '')

// The backend-rendered tracking page. Not JSON — link to it, never fetch it.
export const TRACKING_URL = (id) =>
  `${API_BASE_URL}/shipment/track?id=${encodeURIComponent(id)}`

const api = axios.create({ baseURL: API_BASE_URL })

// Attach the bearer token to every outgoing request. Reading it from
// localStorage on each call (rather than setting a default header at login)
// means a token written by another tab, or cleared by a logout, takes effect
// immediately and there is only one place the session is ever stored.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const session = raw ? JSON.parse(raw) : null
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  } catch {
    // Unreadable storage (private mode) or a corrupt entry: send the request
    // unauthenticated and let the backend answer 401, which is the same path
    // an expired token already takes.
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

// Turn an axios failure into one short line for the pixel UI, which is
// uppercase throughout.
//
// FastShip's own handlers put a plain string in `detail` ("Email is not
// verified", "No delivery partner available"), and those are far more useful
// than a status-code fallback — but FastAPI's own 422 puts an ARRAY of field
// objects there, so only a string is safe to show.
export function apiError(err, fallback = 'SOMETHING WENT WRONG') {
  if (!err?.response) return 'CANNOT CONNECT TO SERVER'
  const { status, data } = err.response
  if (typeof data?.detail === 'string') return data.detail.toUpperCase()
  return STATUS_MESSAGES[status] ?? fallback
}

export default api

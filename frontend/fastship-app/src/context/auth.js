import { createContext, useContext } from 'react'

// Auth context: { user, userType, login, logout }.
// `token` is the JWT from the role's /token endpoint; api/client.js reads it
// back from this localStorage key to authorize requests.
export const STORAGE_KEY = 'fastship.session'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Returns null when absent/corrupt so a bad value can't crash boot. A session
// without a token is treated as absent too (leftover from the old mock
// build) — else the navbar would show signed-in while requests 401.
export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.userType && parsed.token ? parsed : null
  } catch {
    return null
  }
}

export function writeSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Private-mode/quota failure: session still lives in React state for this tab.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

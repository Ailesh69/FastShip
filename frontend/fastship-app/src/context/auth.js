import { createContext, useContext } from 'react'

// Auth context: { user, userType, login, logout }.
//
// The session is a real one — `token` is the JWT issued by the role's /token
// endpoint, and api/client.js reads it back out of this same localStorage key
// to authorize every request.
export const STORAGE_KEY = 'fastship.session'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Read the session back off localStorage. Returns null when absent or corrupt,
// so a bad value can never crash the app on boot.
//
// A session without a token is treated as absent: that is what a leftover
// entry from the old mock build looks like, and letting it through would mean
// a "signed in" navbar over requests the backend rejects with 401.
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
    // Private-mode / quota failures shouldn't break the signed-in flow; the
    // session still lives in React state for this tab.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

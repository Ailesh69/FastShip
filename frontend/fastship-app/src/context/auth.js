import { createContext, useContext } from 'react'

// MOCK auth context.
//
// Deliberately shaped like the real one ({ user, userType, login, logout }) so
// swapping in genuine API calls later is a drop-in replacement: only the body
// of login() changes. Nothing here talks to a backend, validates credentials,
// or issues a token — the "session" is a plain object in localStorage.
export const STORAGE_KEY = 'fastship.mockSession'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Read the fake session back off localStorage. Returns null when absent or
// corrupt, so a bad value can never crash the app on boot.
export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.userType ? parsed : null
  } catch {
    return null
  }
}

import { useCallback, useMemo, useState } from 'react'
import { AuthContext, readSession, STORAGE_KEY } from './auth'

// Holds the MOCK session. No network, no credential check — login() accepts
// whatever it is handed. Restores from localStorage on first render so a page
// refresh keeps the fake "logged in" state.
function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const login = useCallback((profile) => {
    // Real implementation would POST here and store a token instead.
    const session = {
      name: profile.name ?? 'TestUser',
      email: profile.email ?? '',
      userType: profile.userType,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Private-mode / quota failures shouldn't break the demo flow.
    }
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, userType: user?.userType ?? null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

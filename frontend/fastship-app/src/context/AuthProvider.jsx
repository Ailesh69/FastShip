import { useCallback, useMemo, useState } from 'react'
import { AuthContext, clearSession, readSession, writeSession } from './auth'
import { getProfile, loginUser } from '../api/auth'

// Restores session from localStorage on mount, so refresh keeps you logged in
// (token has a 7-day expiry server-side).
function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  // Nothing is stored unless both calls succeed, so a failed login can't
  // leave a half-session that RequireAuth would accept.
  const login = useCallback(async (email, password, userType) => {
    const token = await loginUser(email, password, userType)
    // Pass token explicitly — not in storage yet, interceptor can't attach it.
    const profile = await getProfile(userType, token)

    const session = {
      name: profile.name ?? email.split('@')[0],
      email: profile.email ?? email,
      userType,
      token,
    }
    writeSession(session)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, userType: user?.userType ?? null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

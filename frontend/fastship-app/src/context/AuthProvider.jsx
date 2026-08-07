import { useCallback, useMemo, useState } from 'react'
import { AuthContext, clearSession, readSession, writeSession } from './auth'
import { getProfile, loginUser } from '../api/auth'

// Holds the signed-in session and restores it from localStorage on first
// render, so a refresh keeps the user logged in for as long as the token is
// valid (the backend issues them with a 7-day expiry).
function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  // Async: exchanges credentials for a token, then reads the profile back so
  // the navbar shows the account's real name rather than a guess made from the
  // email. Throws on failure — callers render the message; nothing is stored
  // unless BOTH calls succeed, so a failed login can't leave a half-session
  // behind that RequireAuth would accept.
  const login = useCallback(async (email, password, userType) => {
    const token = await loginUser(email, password, userType)
    // The token is passed explicitly here: it has not been written to storage
    // yet, so the request interceptor has nothing to attach on its own.
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

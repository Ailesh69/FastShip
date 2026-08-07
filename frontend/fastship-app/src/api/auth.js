import api from './client'

// Seller, partner and client each get their own FastAPI router with an
// identical auth surface (/register, /token, /me, /forgot_password), so the
// role only ever decides the prefix.
const PREFIXES = { seller: '/seller', partner: '/partner', client: '/client' }

function prefixFor(userType) {
  const prefix = PREFIXES[userType]
  if (!prefix) throw new Error(`Unknown user type: ${userType}`)
  return prefix
}

// OAuth2 password flow. Two things the rest of the app never has to think
// about: the body is form-encoded, not JSON, and the identity field is called
// "username" even though its value is an email address.
export async function loginUser(email, password, userType) {
  const body = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
  })
  const { data } = await api.post(`${prefixFor(userType)}/token`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data.access_token
}

// `data` must already match the role's schema — see roleSignupPayload() in
// components/signupPayload.js, which is what builds it from the form.
export async function registerUser(data, userType) {
  const res = await api.post(`${prefixFor(userType)}/register`, data)
  return res.data
}

// `token` is only passed during login, where the session has not been written
// to localStorage yet and so the request interceptor has nothing to attach.
export async function getProfile(userType, token) {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  const { data } = await api.get(`${prefixFor(userType)}/me`, config)
  return data
}

// GET, not POST: all three routers declare forgot_password with @router.get
// and read the address off the query string.
export async function forgotPassword(email, userType) {
  const { data } = await api.get(`${prefixFor(userType)}/forgot_password`, {
    params: { email },
  })
  return data
}

import api from './client'

// Each role has its own router with identical auth surface — role only picks the prefix.
const PREFIXES = { seller: '/seller', partner: '/partner', client: '/client' }

function prefixFor(userType) {
  const prefix = PREFIXES[userType]
  if (!prefix) throw new Error(`Unknown user type: ${userType}`)
  return prefix
}

// OAuth2 password flow: form-encoded body, identity field named "username"
// but holds the email.
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

// `data` must match the role's schema — built by roleSignupPayload() in
// components/signupPayload.js.
export async function registerUser(data, userType) {
  const res = await api.post(`${prefixFor(userType)}/register`, data)
  return res.data
}

// `token` only passed during login, before it's in localStorage for the interceptor.
export async function getProfile(userType, token) {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  const { data } = await api.get(`${prefixFor(userType)}/me`, config)
  return data
}

// GET, not POST — forgot_password reads the address off the query string.
export async function forgotPassword(email, userType) {
  const { data } = await api.get(`${prefixFor(userType)}/forgot_password`, {
    params: { email },
  })
  return data
}

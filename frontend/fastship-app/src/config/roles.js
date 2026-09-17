// Canonical role keys + routes. Keys match URL prefixes.
export const ROLES = {
  client: {
    label: 'GENERAL USER',
    signup: '/client/signup',
    dashboard: '/client/dashboard',
    profile: '/client/profile',
  },
  seller: {
    label: 'SELLER ACCOUNT',
    signup: '/seller/signup',
    dashboard: '/seller/dashboard',
    profile: '/seller/profile',
  },
  partner: {
    label: 'DELIVERY PARTNER',
    signup: '/partner/signup',
    dashboard: '/partner/dashboard',
    profile: '/partner/profile',
  },
}

export const ROLE_KEYS = Object.keys(ROLES)

// Where a role lands after a successful (mock) login.
export const dashboardFor = (role) => ROLES[role]?.dashboard ?? '/login'

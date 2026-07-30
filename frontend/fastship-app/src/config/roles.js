// Canonical account roles — the single source of truth for role keys and the
// routes each role owns. Pages previously used three different vocabularies
// ('general'/'customer'/'client', 'delivery'/'partner'); everything now agrees
// on these three keys, which also match the URL prefixes.
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

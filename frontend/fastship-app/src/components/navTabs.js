// Nav tab sets, kept out of Navbar.jsx — Fast Refresh needs that file to
// export only a component.

// `highlight: false` opts out of the active chip (HOME stays plain white).
// `inert: true` renders a de-emphasised, non-navigating item.
export const GUEST_LINKS = [
  { to: '/', label: 'HOME', highlight: false },
  { to: '/login', label: 'LOGIN/SIGNUP', also: ['/signup'], startsWith: ['/signup/'] },
  // TRACK ORDER moved to SELLER_TABS; /track stays reachable by URL for old links.
  { to: '/about', label: 'ABOUT ME' },
]

// Signed-in tabs, chosen by the session's userType.
const CLIENT_TABS = [
  { to: '/client/dashboard', label: 'DASHBOARD' },
  { to: '/client/profile', label: 'EDIT PROFILE' },
]

// TRACK ORDER only here: sellers need to look up any dispatched shipment;
// clients/partners already get per-shipment links from their dashboard rows.
const SELLER_TABS = [
  { to: '/seller/dashboard', label: 'DASHBOARD' },
  { to: '/seller/submit-shipment', label: 'SUBMIT SHIPMENT' },
  { to: '/track', label: 'TRACK ORDER' },
  { to: '/seller/profile', label: 'EDIT PROFILE' },
]

const PARTNER_TABS = [
  { to: '/partner/dashboard', label: 'DASHBOARD', also: ['/partner/update-shipment'] },
  { to: '/partner/profile', label: 'EDIT PROFILE' },
]

export const TABS_BY_ROLE = {
  client: CLIENT_TABS,
  seller: SELLER_TABS,
  partner: PARTNER_TABS,
}

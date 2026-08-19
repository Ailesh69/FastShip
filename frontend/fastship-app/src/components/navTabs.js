// Nav tab sets, kept out of Navbar.jsx so that file exports only a component
// (React Fast Refresh requires that split).

// `highlight: false` opts a link out of the active chip. HOME stays plain white
// even on the landing page — the hero design calls for no box around it.
// `inert: true` renders a de-emphasised, non-navigating item.
export const GUEST_LINKS = [
  { to: '/', label: 'HOME', highlight: false },
  { to: '/login', label: 'LOGIN/SIGNUP', also: ['/signup'], startsWith: ['/signup/'] },
  // TRACK ORDER used to sit here. It is a seller tool now and lives in
  // SELLER_TABS below; /track itself is still reachable by URL so existing
  // links and bookmarks keep working.
  { to: '/about', label: 'ABOUT ME' },
]

// Signed-in tabs, chosen by the session's userType.
const CLIENT_TABS = [
  { to: '/client/dashboard', label: 'DASHBOARD' },
  { to: '/client/profile', label: 'EDIT PROFILE' },
]

// TRACK ORDER is deliberately here and in no other role's set: a seller needs
// to look up any shipment they dispatched, whereas the dashboard rows already
// give clients and partners a per-shipment tracking link.
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

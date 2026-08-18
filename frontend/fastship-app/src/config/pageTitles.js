// Per-route document titles.
//
// Kept as one map here rather than a useEffect in each page for two reasons:
// the route table it mirrors also lives in one place (App.jsx), so the two
// can't quietly drift; and a page that forgets to set a title is a silent bug
// — here, a missing entry is visible as a gap in the list.
//
// App.jsx's Shell applies this on every navigation. index.html carries the
// same string as its static <title>, which is what shows before React mounts.

const BRAND = 'FastShip'

export const HOME_TITLE = `${BRAND} — Retro E-Commerce Delivery`
export const NOT_FOUND_TITLE = `Page Not Found | ${BRAND}`

const TITLES = {
  '/': HOME_TITLE,
  '/login': `Log In | ${BRAND}`,
  '/signup': `Select Your Path | ${BRAND}`,

  // Role sign-up forms
  '/client/signup': `Customer Sign Up | ${BRAND}`,
  '/seller/signup': `Seller Sign Up | ${BRAND}`,
  '/partner/signup': `Delivery Partner Sign Up | ${BRAND}`,

  // Signed-in areas
  '/client/dashboard': `Dashboard | ${BRAND}`,
  '/client/profile': `Edit Profile | ${BRAND}`,
  '/seller/dashboard': `Seller Dashboard | ${BRAND}`,
  '/seller/submit-shipment': `Submit Shipment | ${BRAND}`,
  '/seller/profile': `Seller Profile | ${BRAND}`,
  '/partner/dashboard': `Partner Dashboard | ${BRAND}`,
  '/partner/update-shipment': `Update Shipment | ${BRAND}`,
  '/partner/profile': `Partner Profile | ${BRAND}`,

  '/track': `Track Your Order | ${BRAND}`,
}

// The legacy paths App.jsx keeps alive as <Navigate> redirects. They resolve to
// their destination's title so the tab doesn't flash "Page Not Found" during
// the redirect — brief, but it is the kind of flicker that looks like a bug.
const LEGACY_REDIRECTS = {
  '/dashboard': '/client/dashboard',
  '/profile': '/client/profile',
  '/seller': '/seller/dashboard',
  '/seller/submit': '/seller/submit-shipment',
  '/signup/customer': '/client/signup',
  '/signup/seller': '/seller/signup',
  '/signup/delivery': '/partner/signup',
}

/** Document title for a pathname. Anything unrecognised is the 404. */
export function titleFor(pathname) {
  const resolved = LEGACY_REDIRECTS[pathname] ?? pathname
  return TITLES[resolved] ?? NOT_FOUND_TITLE
}

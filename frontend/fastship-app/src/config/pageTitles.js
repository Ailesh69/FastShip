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
  '/about': `About | ${BRAND}`,
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

// ---------------------------------------------------------------------------
// BUILD-TIME SEO
//
// Everything below is read by seoPlugin.js at build time — it is not imported
// by any component. It lives here so the routes, their titles and their
// descriptions cannot drift apart across three files.
//
// The placeholder host is what index.html ships with. seoPlugin replaces every
// occurrence with VITE_SITE_URL when that is set, so the real domain is
// configured in exactly one place instead of being hand-edited in the canonical
// tag, robots.txt and sitemap.xml separately.
export const PLACEHOLDER_ORIGIN = 'https://YOUR-EVENTUAL-DOMAIN.com'

// The routes a crawler should see. Signed-in areas are deliberately absent —
// they are also Disallow-ed in the generated robots.txt.
//
// `description` becomes that page's <meta name="description"> and
// og:description in its own prerendered HTML file, which is what makes a link
// to /track preview as the tracking page rather than as the homepage.
export const PUBLIC_ROUTES = [
  {
    path: '/',
    priority: '1.0',
    description:
      'FastShip — a retro pixel-art e-commerce and shipment tracking platform. Browse, ship, and track orders with a 8-bit arcade twist.',
  },
  {
    path: '/about',
    priority: '0.7',
    description:
      'About FastShip — a retro pixel-art e-commerce and shipment tracking platform built as a full-stack project.',
  },
  {
    path: '/login',
    priority: '0.8',
    description:
      'Sign in to FastShip as a customer, seller, or delivery partner to manage your orders and shipments.',
  },
  {
    path: '/signup',
    priority: '0.8',
    description:
      'Choose your path on FastShip — sign up as a customer, a seller, or a delivery partner.',
  },
  {
    path: '/client/signup',
    priority: '0.6',
    description:
      'Create a FastShip customer account to browse pixel-perfect goods and follow your orders.',
  },
  {
    path: '/seller/signup',
    priority: '0.6',
    description:
      'Create a FastShip seller account to stock your shop and submit shipments for delivery.',
  },
  {
    path: '/partner/signup',
    priority: '0.6',
    description:
      'Create a FastShip delivery partner account to take on assigned shipments and post status updates.',
  },
  // /track is deliberately NOT listed. It is reached from the seller nav now,
  // not from the public bar, so it is not something to advertise to crawlers.
  // The route itself stays open — old links, bookmarks and the shipment ids in
  // confirmation emails all still resolve — it simply is not promoted.
]

// Signed-in routes, listed once so robots.txt can Disallow them.
export const PRIVATE_ROUTES = [
  '/client/dashboard',
  '/client/profile',
  '/seller/dashboard',
  '/seller/profile',
  '/seller/submit-shipment',
  '/partner/dashboard',
  '/partner/profile',
  '/partner/update-shipment',
]

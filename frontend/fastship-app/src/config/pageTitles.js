// Per-route document titles, kept as one map (not per-page useEffects) so a
// missing entry is a visible gap instead of a silent bug.
// App.jsx's Shell applies this per nav. index.html's static <title> matches
// HOME_TITLE for the pre-mount flash.

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

// Legacy <Navigate> redirects from App.jsx; resolve to destination's title
// so the tab doesn't flash "Page Not Found" mid-redirect.
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
// BUILD-TIME SEO — read by seoPlugin.js, not imported by any component. Kept
// here so routes/titles/descriptions can't drift across files.
//
// Placeholder host from index.html; seoPlugin swaps in VITE_SITE_URL when set
// (one place to configure the domain instead of 3).
export const PLACEHOLDER_ORIGIN = 'https://YOUR-EVENTUAL-DOMAIN.com'

// Crawlable routes — signed-in areas excluded (also Disallow-ed in robots.txt).
// `description` becomes <meta name="description">/og:description per page.
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
  // /track intentionally not listed (reached via seller nav, not promoted to
  // crawlers) — route stays open for old links/bookmarks though.
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

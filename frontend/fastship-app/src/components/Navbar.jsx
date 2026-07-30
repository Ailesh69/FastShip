import { useLocation } from 'react-router-dom'
import { useLoadingNav } from '../context/loadingNav'
import { useAuth } from '../context/auth'
import { ROLES } from '../config/roles'
import { GUEST_LINKS, TABS_BY_ROLE } from './navTabs'

// Shared top navigation bar, used by every page in both signed-out and
// signed-in states.
//
// The bar CHROME — height (--nav-h), bottom border and background — is defined
// once here, so the guest bar and the signed-in bar can never drift apart. Only
// the contents differ, and which set shows is driven by the mock session:
//   no session → HOME / LOGIN-SIGNUP / TRACK ORDER, centre-weighted
//   session    → that role's tabs on the left, account cluster on the right
//
// Navigation goes through `go()` so every jump plays the loading transition.
// Links stay real anchors, so middle-click and "open in new tab" still work.

const NAV_CHROME = 'relative z-20 flex shrink-0 items-center px-8'
const NAV_STYLE = { height: 'var(--nav-h)', borderBottom: '2px solid rgba(34,211,238,0.55)' }

// Fallback avatar when the mock session carries no photo of its own.
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%237c5cc4'/%3E%3Crect x='4' y='2' width='8' height='3' fill='%233b2a1a'/%3E%3Crect x='3' y='5' width='10' height='7' fill='%23f3cfa2'/%3E%3Crect x='5' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='9' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='6' y='10' width='4' height='1' fill='%23a83e2e'/%3E%3Crect x='2' y='12' width='12' height='4' fill='%2322b8e0'/%3E%3C/svg%3E"

function Navbar() {
  const { pathname } = useLocation()
  const { go } = useLoadingNav()
  const { user, userType, logout } = useAuth()

  // Let modified clicks (new tab/window) fall through to the browser.
  const handle = (to) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    go(to)
  }

  const logo = (
    <a href="/" onClick={handle('/')} className="logo-glow text-[28px] leading-none">
      FS
    </a>
  )

  /* ---------------- signed-in state ---------------- */
  if (user) {
    const tabs = TABS_BY_ROLE[userType] ?? TABS_BY_ROLE.client
    const profilePath = ROLES[userType]?.profile ?? '/client/profile'

    return (
      <nav className={`${NAV_CHROME} justify-between gap-6`} style={NAV_STYLE}>
        <div className="flex items-center gap-[34px]">
          {logo}
          {/* The current page's tab is underlined and cyan; others plain white. */}
          {tabs.map(({ to, label, also = [] }) => {
            const active = pathname === to || also.includes(pathname)
            return (
              <a
                key={to}
                href={to}
                onClick={handle(to)}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'pixel-link text-[14px] leading-none'
                    : 'text-[14px] leading-none text-white no-underline transition-colors hover:text-fs-teal'
                }
              >
                {label}
              </a>
            )
          })}
        </div>

        <div className="flex items-center gap-[22px]">
          {/* Real photo, themed frame only */}
          <div className="flex items-center gap-[10px]">
            <span className="avatar-frame h-[38px] w-[38px] shrink-0 rounded-[3px]">
              <img src={user.avatar ?? DEFAULT_AVATAR} alt="" />
            </span>
            <span className="text-[9px] leading-[1.7] text-white">
              Welcome,
              <br />
              {user.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => go(profilePath)}
            className="bracket-btn cut-corners cursor-pointer px-[14px] py-[10px] font-[inherit] text-[11px] leading-none"
          >
            [ EDIT PROFILE ]
          </button>

          <button
            type="button"
            onClick={() => {
              logout()
              go('/login')
            }}
            className="pixel-link text-[11px] leading-none"
          >
            LOG OUT
          </button>
        </div>
      </nav>
    )
  }

  /* ---------------- signed-out state ---------------- */
  return (
    <nav className={`${NAV_CHROME} justify-center gap-[92px]`} style={NAV_STYLE}>
      {logo}

      <div className="flex items-center gap-[52px] text-[12px] leading-none">
        {GUEST_LINKS.map(({ to, label, highlight = true, also = [], startsWith = [], inert }) => {
          // Inert items have no destination yet — dimmed and not clickable.
          if (inert) {
            return (
              <span
                key={to}
                aria-disabled="true"
                title="Coming soon"
                className="cursor-default text-white/35"
              >
                {label}
              </span>
            )
          }
          const active =
            highlight &&
            (pathname === to ||
              also.includes(pathname) ||
              startsWith.some((prefix) => pathname.startsWith(prefix)))
          return (
            <a
              key={to}
              href={to}
              onClick={handle(to)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? // padding trimmed by the 2px border so the chip keeps its footprint
                    'nav-active inline-block rounded-[4px] px-[11px] py-[7px]'
                  : 'text-white transition-colors hover:text-fs-teal'
              }
            >
              {label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar

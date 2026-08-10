import { createContext, useContext } from 'react'

// Context, hook and progress maths for the route-transition loading screen.
// Kept separate from the provider component so that file can export only a
// component (React Fast Refresh requires that split).

export const LoadingNavContext = createContext(null)

export function useLoadingNav() {
  const ctx = useContext(LoadingNavContext)
  if (!ctx) throw new Error('useLoadingNav must be used inside <LoadingNavProvider>')
  return ctx
}

export const MIN_MS = 2000
export const MAX_MS = 3000
export const FADE_MS = 260

// Warp transition (the fast alternate to the turret loader): a diagonal
// pixel-tile wave wipes in to cover the screen, then wipes back out to
// reveal the destination. Two phases, cover then reveal — fixed total,
// unlike the turret's randomised 2-3s. The route swap happens once the wave
// has fully covered the screen (WARP_SWAP_MS), same moment WarpOverlay's own
// canvas animation flips from covering to revealing.
export const WARP_COVER_MS = 667
export const WARP_REVEAL_MS = 667
export const WARP_MS = WARP_COVER_MS + WARP_REVEAL_MS
export const WARP_SWAP_MS = WARP_COVER_MS

// Subtitle is chosen from where the user is heading TO.
const DATA_LINKS = {
  '/signup/customer': 'ESTABLISHING CUSTOMER DATA-LINK...',
  '/signup/seller': 'ESTABLISHING SELLER DATA-LINK...',
  '/signup/delivery': 'ESTABLISHING PARTNER DATA-LINK...',
}

export function subtitleFor(path) {
  return DATA_LINKS[path] ?? 'ESTABLISHING CONNECTION...'
}

// Control points as [fraction of duration, percent]. Deliberately uneven: two
// quick jumps early, short plateaus, a long stall across the 60–80% band, then
// a fast run to 100% — so it reads as real work rather than a linear sweep.
const BASE_CURVE = [
  [0, 0],
  [0.05, 17],
  [0.13, 22],
  [0.24, 45],
  [0.33, 51],
  [0.44, 62],
  [0.58, 66],
  [0.74, 72],
  [0.83, 80],
  [0.92, 93],
  [1, 100],
]

// Nudge the interior control points a little on every run so no two loads
// stall in exactly the same place.
export function jitteredCurve() {
  const last = BASE_CURVE.length - 1
  let prevP = 0
  return BASE_CURVE.map(([t, p], i) => {
    if (i === 0 || i === last) return [t, p]
    const jt = Math.min(0.97, Math.max(0.02, t + (Math.random() - 0.5) * 0.05))
    const jp = Math.min(97, Math.max(prevP + 1, Math.round(p + (Math.random() - 0.5) * 7)))
    prevP = jp
    return [jt, jp]
  })
}

export function sampleCurve(curve, t) {
  for (let i = 1; i < curve.length; i++) {
    const [t1, p1] = curve[i]
    if (t <= t1) {
      const [t0, p0] = curve[i - 1]
      const span = t1 - t0 || 1
      return p0 + ((p1 - p0) * (t - t0)) / span
    }
  }
  return 100
}

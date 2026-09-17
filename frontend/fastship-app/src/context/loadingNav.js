import { createContext, useContext } from 'react'

// Context, hook, and progress maths for the route-transition loading screen.
// Split from the provider component for Fast Refresh (that file must export
// only a component).

export const LoadingNavContext = createContext(null)

export function useLoadingNav() {
  const ctx = useContext(LoadingNavContext)
  if (!ctx) throw new Error('useLoadingNav must be used inside <LoadingNavProvider>')
  return ctx
}

export const MIN_MS = 2000
export const MAX_MS = 3000
export const FADE_MS = 260

// Warp transition (fast alternate to turret loader): diagonal tile wave
// covers then reveals, fixed duration unlike turret's random 2-3s. Route
// swaps at WARP_SWAP_MS, when the wave fully covers the screen.
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

// [fraction of duration, percent] points. Uneven on purpose (early jumps,
// long stall at 60-80%, fast finish) so it reads as real work, not a sweep.
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

// Nudge interior points each run so no two loads stall identically.
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

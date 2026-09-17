import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FADE_MS,
  LoadingNavContext,
  MAX_MS,
  MIN_MS,
  WARP_MS,
  WARP_SWAP_MS,
  jitteredCurve,
  sampleCurve,
} from './loadingNav'

// Route transitions with a simulated loading screen. Internal nav calls
// `go(path)` instead of routing directly, so the overlay covers the current
// page before the destination swaps in (never renders behind a transparent
// overlay). Each call picks turret (2-3s) or warp (~550ms) at random; each
// variant runs its own timer.
function LoadingNavProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [destination, setDestination] = useState(null) // non-null while loading
  const [pct, setPct] = useState(0)
  const [fading, setFading] = useState(false)
  const [variant, setVariant] = useState(null) // 'gun' | 'warp'

  const rafId = useRef(0)
  const timeoutId = useRef(0)
  const warpSwapId = useRef(0)
  const busy = useRef(false)

  useEffect(
    () => () => {
      cancelAnimationFrame(rafId.current)
      clearTimeout(timeoutId.current)
      clearTimeout(warpSwapId.current)
    },
    [],
  )

  const go = useCallback(
    (to) => {
      // Ignore re-entrant clicks and navigation to the page we're already on.
      if (!to || busy.current || to === pathname) return
      busy.current = true

      const chosen = Math.random() < 0.5 ? 'gun' : 'warp'
      setVariant(chosen)
      setDestination(to)
      setFading(false)
      setPct(0)

      if (chosen === 'warp') {
        // Swap route at peak flash brightness, when full-white coverage
        // hides the DOM change; overlay's own CSS timeline finishes after.
        warpSwapId.current = setTimeout(() => navigate(to), WARP_SWAP_MS)
        timeoutId.current = setTimeout(() => {
          setDestination(null)
          setVariant(null)
          busy.current = false
        }, WARP_MS)
        return
      }

      const duration = MIN_MS + Math.random() * (MAX_MS - MIN_MS)
      const curve = jitteredCurve()
      const startedAt = performance.now()

      const tick = (now) => {
        const t = Math.min(1, (now - startedAt) / duration)
        const next = Math.max(1, Math.round(sampleCurve(curve, t)))
        // Whole-percent only: React bails on identical value, ~100 renders not one/frame.
        setPct((prev) => (prev === next ? prev : next))

        if (t < 1) {
          rafId.current = requestAnimationFrame(tick)
          return
        }

        // 100%: swap page behind overlay, then fade overlay out.
        navigate(to)
        setFading(true)
        timeoutId.current = setTimeout(() => {
          setDestination(null)
          setFading(false)
          setPct(0)
          setVariant(null)
          busy.current = false
        }, FADE_MS)
      }

      rafId.current = requestAnimationFrame(tick)
    },
    [navigate, pathname],
  )

  return (
    <LoadingNavContext.Provider
      value={{ go, destination, pct, fading, variant, active: destination !== null }}
    >
      {children}
    </LoadingNavContext.Provider>
  )
}

export default LoadingNavProvider

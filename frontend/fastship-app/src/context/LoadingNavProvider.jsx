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

// Route transitions with a simulated loading screen.
//
// Anything that navigates internally calls `go(path)` instead of routing
// directly. That shows an overlay over the CURRENT page and only swaps in the
// destination once the overlay has (at least visually) covered it — so the
// destination never renders behind the overlay while it's still transparent.
//
// Every call picks one of two overlay variants at random, independently of
// the destination or any other state: the turret/percentage loader (2-3s,
// unchanged from before) or the fast warp dive (fixed ~550ms). Whichever is
// picked drives its own wait — the two never share a timer.
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
        // Swap the route at the flash's peak brightness, when full-white
        // coverage hides the DOM change, then let the overlay's own
        // self-contained CSS timeline resolve before clearing state.
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
        // Only commit whole-percent changes; React bails out on an identical
        // value, which keeps this to ~100 renders instead of one per frame.
        setPct((prev) => (prev === next ? prev : next))

        if (t < 1) {
          rafId.current = requestAnimationFrame(tick)
          return
        }

        // Hit 100%: swap the page in behind the overlay, then fade it away.
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

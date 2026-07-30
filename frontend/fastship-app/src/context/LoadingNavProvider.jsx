import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FADE_MS,
  LoadingNavContext,
  MAX_MS,
  MIN_MS,
  jitteredCurve,
  sampleCurve,
} from './loadingNav'

// Route transitions with a simulated loading screen.
//
// Anything that navigates internally calls `go(path)` instead of routing
// directly. That shows the overlay over the CURRENT page, runs a fake progress
// count to 100%, and only then swaps in the destination and fades out — so the
// destination never renders behind the overlay while it counts.
//
// The progress is deliberately fake: driven by requestAnimationFrame against a
// randomised 3–6s duration, never by real asset or network timing.
function LoadingNavProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [destination, setDestination] = useState(null) // non-null while loading
  const [pct, setPct] = useState(0)
  const [fading, setFading] = useState(false)

  const rafId = useRef(0)
  const timeoutId = useRef(0)
  const busy = useRef(false)

  useEffect(
    () => () => {
      cancelAnimationFrame(rafId.current)
      clearTimeout(timeoutId.current)
    },
    [],
  )

  const go = useCallback(
    (to) => {
      // Ignore re-entrant clicks and navigation to the page we're already on.
      if (!to || busy.current || to === pathname) return
      busy.current = true

      const duration = MIN_MS + Math.random() * (MAX_MS - MIN_MS)
      const curve = jitteredCurve()
      const startedAt = performance.now()

      setDestination(to)
      setFading(false)
      setPct(0)

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
          busy.current = false
        }, FADE_MS)
      }

      rafId.current = requestAnimationFrame(tick)
    },
    [navigate, pathname],
  )

  return (
    <LoadingNavContext.Provider
      value={{ go, destination, pct, fading, active: destination !== null }}
    >
      {children}
    </LoadingNavContext.Provider>
  )
}

export default LoadingNavProvider

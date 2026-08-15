import { useCallback, useEffect, useRef } from 'react'
import { canHover } from './depthEngine'
import { motionIntensity } from './motionPolicy'

// 3D tilt toward the cursor, for cards.
//
// Returns a CALLBACK ref you put on the card ITSELF — there is no wrapper
// element and no layout change:
//
//   const tilt = useTilt()
//   <div ref={tilt} className="path-card tilt ...">
//
// The `tilt` class (motion.css) owns the transform; this hook only writes
// --tilt-x / --tilt-y / --tilt-z. At rest all three are zero, so an untouched
// card sits exactly where it always did.
//
// NOTE the transform-ownership rule in motion.css: `.tilt` cannot share an
// element with `.par`, `.mag` or a <Reveal>. Nest them instead.
//
// A callback ref (not a plain one) so cards that mount later — dashboard
// panels waiting on a fetch, for instance — still get wired up. See the same
// note in useMagnetic.js.
//
// Cost: listeners on the card only — nothing global — and at most one
// getBoundingClientRect + one style write per frame, for the single card the
// cursor is actually over.

/**
 * @param max   peak rotation in degrees at the card's corner
 * @param lift  translateZ in px while hovered — pulls the card toward the viewer
 */
export default function useTilt({ max = 7, lift = 14 } = {}) {
  const detach = useRef(null)

  // `max`/`lift` are dependencies rather than a mutable ref: every call site
  // passes constants, so this callback is created once, and on the rare change
  // React rebinds the listeners with the new numbers — which is the correct
  // behaviour anyway.
  const ref = useCallback(
    (el) => {
      if (detach.current) {
        detach.current()
        detach.current = null
      }
      if (!el || !canHover()) return

      const intensity = motionIntensity()
      const maxDeg = max * intensity
      const liftPx = lift * intensity

      let raf = 0
      let px = 0
      let py = 0

      const apply = () => {
        raf = 0
        // Read per frame rather than caching on enter: the page can scroll
        // under a hovered card (the dashboards are long), and a stale rect
        // would make the tilt drift away from the cursor. One layout read per
        // frame, for the one card being pointed at.
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        // -0.5 .. 0.5 across the card
        const nx = (px - rect.left) / rect.width - 0.5
        const ny = (py - rect.top) / rect.height - 0.5

        // Pointer toward an edge tips that edge away from the viewer, which is
        // how a real panel pivoting under a fingertip behaves.
        el.style.setProperty('--tilt-y', `${(nx * maxDeg * 2).toFixed(2)}deg`)
        el.style.setProperty('--tilt-x', `${(-ny * maxDeg * 2).toFixed(2)}deg`)
      }

      const onMove = (e) => {
        px = e.clientX
        py = e.clientY
        if (!raf) raf = requestAnimationFrame(apply)
      }

      const onEnter = (e) => {
        el.dataset.tilting = 'true'
        el.style.setProperty('--tilt-z', `${liftPx}px`)
        onMove(e)
      }

      const onLeave = () => {
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        // Drop the fast tracking transition first, so the slow curve in
        // motion.css is what eases the card back down to flat.
        delete el.dataset.tilting
        el.style.setProperty('--tilt-x', '0deg')
        el.style.setProperty('--tilt-y', '0deg')
        el.style.setProperty('--tilt-z', '0px')
      }

      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointermove', onMove, { passive: true })
      el.addEventListener('pointerleave', onLeave)

      detach.current = () => {
        if (raf) cancelAnimationFrame(raf)
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    [max, lift],
  )

  useEffect(
    () => () => {
      if (detach.current) detach.current()
    },
    [],
  )

  return ref
}

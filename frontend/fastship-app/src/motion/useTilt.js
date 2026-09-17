import { useCallback, useEffect, useRef } from 'react'
import { canHover } from './depthEngine'
import { motionIntensity } from './motionPolicy'

// 3D tilt toward the cursor, for cards. Returns a CALLBACK ref for the card
// itself (no wrapper, no layout change):
//
//   const tilt = useTilt()
//   <div ref={tilt} className="path-card tilt ...">
//
// `.tilt` (motion.css) owns the transform; hook only writes --tilt-x/y/z,
// zero at rest. `.tilt` can't share an element with `.par`/`.mag`/<Reveal> —
// nest them instead.
//
// Callback ref so cards mounting later (fetch-gated dashboard panels) still
// get wired. Listeners are per-card only, nothing global.

/**
 * @param max   peak rotation in degrees at the card's corner
 * @param lift  translateZ in px while hovered — pulls the card toward the viewer
 */
export default function useTilt({ max = 7, lift = 14 } = {}) {
  const detach = useRef(null)

  // Deps not a ref: call sites pass constants, so this is stable in practice;
  // on the rare change React just rebinds with new numbers, which is fine.
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
        // Read rect per frame, not cached on enter — page can scroll under a
        // hovered card, stale rect would drift the tilt off the cursor.
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        // -0.5 .. 0.5 across the card
        const nx = (px - rect.left) / rect.width - 0.5
        const ny = (py - rect.top) / rect.height - 0.5

        // Pointer toward an edge tips that edge away from the viewer.
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
        // Drop tracking mode first so motion.css's slow curve eases it flat.
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

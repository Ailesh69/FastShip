import { useCallback, useEffect, useRef } from 'react'
import { canHover } from './depthEngine'
import { motionIntensity } from './motionPolicy'

// Magnetic buttons: control leans a few px toward the cursor, springs back
// on leave. Returns a CALLBACK ref for the button itself + `mag` class:
//
//   const mag = useMagnetic()
//   <button ref={mag} className="pixel-btn mag ...">
//
// Callback ref (not plain) because some buttons mount conditionally (e.g.
// swapped-in submit buttons) — this attaches/detaches as the element comes
// and goes, rather than binding once at an effect's mount time.
//
// Tracked from `pointerenter`, not a window listener, so it costs nothing
// until the cursor is actually on the control.
//
// `strength` stays inside the button's padding so hit area never separates
// from what's visually shown.

/** @param strength peak travel in px at the button's edge */
export default function useMagnetic({ strength = 6 } = {}) {
  const detach = useRef(null)

  const ref = useCallback(
    (el) => {
      if (detach.current) {
        detach.current()
        detach.current = null
      }
      if (!el || !canHover()) return

      const pull = strength * motionIntensity()

      let raf = 0
      let px = 0
      let py = 0

      const apply = () => {
        raf = 0
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        const nx = (px - rect.left) / rect.width - 0.5
        const ny = (py - rect.top) / rect.height - 0.5

        el.style.setProperty('--mag-x', `${(nx * pull * 2).toFixed(2)}px`)
        el.style.setProperty('--mag-y', `${(ny * pull * 2).toFixed(2)}px`)
      }

      const onMove = (e) => {
        px = e.clientX
        py = e.clientY
        if (!raf) raf = requestAnimationFrame(apply)
      }

      const onEnter = (e) => {
        el.dataset.mag = 'true'
        onMove(e)
      }

      const onLeave = () => {
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        delete el.dataset.mag
        el.style.setProperty('--mag-x', '0px')
        el.style.setProperty('--mag-y', '0px')
      }

      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointermove', onMove, { passive: true })
      el.addEventListener('pointerleave', onLeave)
      // Keyboard users never fire pointerleave — blur is their equivalent.
      el.addEventListener('blur', onLeave)

      detach.current = () => {
        if (raf) cancelAnimationFrame(raf)
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
        el.removeEventListener('blur', onLeave)
      }
    },
    [strength],
  )

  // Button can unmount mid-lean — clicking it navigates away.
  useEffect(
    () => () => {
      if (detach.current) detach.current()
    },
    [],
  )

  return ref
}

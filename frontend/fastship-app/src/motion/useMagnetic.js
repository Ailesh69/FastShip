import { useCallback, useEffect, useRef } from 'react'
import { canHover } from './depthEngine'
import { motionIntensity } from './motionPolicy'

// Magnetic buttons: the control leans a few px toward the cursor while it is
// over it, then springs back on leave.
//
// Returns a CALLBACK ref for the button ITSELF, alongside the `mag` class:
//
//   const mag = useMagnetic()
//   <button ref={mag} className="pixel-btn mag ...">
//
// A callback ref rather than a plain one because several of these buttons are
// rendered conditionally — Login's [ SEND RESET LINK ] only exists once the
// panel is open, SignupForm swaps its submit for [ GO TO LOGIN ] after a
// successful register. An effect keyed on mount would bind listeners to
// whatever was there at mount time (usually nothing) and never rebind; this
// attaches and detaches as the element itself comes and goes.
//
// Deliberately tracked from `pointerenter` rather than a window-level
// listener. A global listener per button is how "magnetic" is usually built,
// but it means every button on the page runs maths on every mouse move; this
// version costs nothing until the cursor is actually on the control, and the
// lean-plus-spring still reads as magnetism.
//
// `strength` stays well inside the button's own padding so the visual never
// separates from the real hit area — the thing you see is the thing you click.

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
      // Keyboard users never fire pointerleave; blur is the equivalent
      // "done with this control" signal for them.
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

  // A button can be unmounted mid-lean — clicking it navigates away.
  useEffect(
    () => () => {
      if (detach.current) detach.current()
    },
    [],
  )

  return ref
}

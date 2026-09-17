// One pointer/scroll listener + one rAF loop for the whole site. Writes
// three custom props on <html>: --dx/--dy (pointer, -1..1) and --sy
// (scrollY, px). Parallax layers are `.par` elements (motion.css) that
// multiply these by their own amplitude — React never re-renders for it.
//
// Smoothed (exponential ease per frame) so it drifts instead of snapping.
// Loop idles once settled; any new input wakes it.

import { motionIntensity } from './motionPolicy'

// Fraction of remaining distance per frame. Lower = heavier drift.
// 0.08 settles in ~250ms, matches motion.css's "slow, continuous" tier.
const EASE = 0.08

// Below this, the value is close enough that further frames are invisible.
const EPSILON = 0.0004

// Scroll is in pixels, so it needs its own (much coarser) settle threshold.
const SCROLL_EPSILON = 0.06

const state = {
  started: false,
  running: false,
  raf: 0,
  intensity: 1,
  // current (rendered) vs target (input) for each channel
  x: 0,
  y: 0,
  s: 0,
  tx: 0,
  ty: 0,
  ts: 0,
}

function frame() {
  state.x += (state.tx - state.x) * EASE
  state.y += (state.ty - state.y) * EASE
  state.s += (state.ts - state.s) * EASE

  const root = document.documentElement
  root.style.setProperty('--dx', (state.x * state.intensity).toFixed(4))
  root.style.setProperty('--dy', (state.y * state.intensity).toFixed(4))
  root.style.setProperty('--sy', (state.s * state.intensity).toFixed(2))

  const settled =
    Math.abs(state.tx - state.x) < EPSILON &&
    Math.abs(state.ty - state.y) < EPSILON &&
    Math.abs(state.ts - state.s) < SCROLL_EPSILON

  if (settled) {
    // Snap exactly to target instead of leaving a sub-pixel remainder.
    state.x = state.tx
    state.y = state.ty
    state.s = state.ts
    root.style.setProperty('--dx', (state.x * state.intensity).toFixed(4))
    root.style.setProperty('--dy', (state.y * state.intensity).toFixed(4))
    root.style.setProperty('--sy', (state.s * state.intensity).toFixed(2))
    state.running = false
    return
  }

  state.raf = requestAnimationFrame(frame)
}

function wake() {
  if (state.running) return
  state.running = true
  state.raf = requestAnimationFrame(frame)
}

function onPointerMove(e) {
  state.tx = (e.clientX / window.innerWidth - 0.5) * 2
  state.ty = (e.clientY / window.innerHeight - 0.5) * 2
  wake()
}

// Recenter on pointer leaving the window, instead of freezing at exit point.
function onPointerLeave() {
  state.tx = 0
  state.ty = 0
  wake()
}

function onScroll() {
  state.ts = window.scrollY
  wake()
}

// Idempotent; returns a teardown for StrictMode's double-invoke.
export function startDepthEngine() {
  if (typeof window === 'undefined' || state.started) return () => {}
  state.started = true

  state.intensity = motionIntensity()

  // Touch has no meaningful pointer pos — skip pointermove so taps don't
  // lurch the background. --dx/--dy stay 0, .par layers sit at rest.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (fine) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave, { passive: true })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  state.ts = window.scrollY
  wake()

  return () => {
    if (fine) {
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
    }
    window.removeEventListener('scroll', onScroll)
    cancelAnimationFrame(state.raf)
    state.running = false
    state.started = false
  }
}

// Devices that can actually hover — tilt/magnet hooks bail out otherwise.
export function canHover() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

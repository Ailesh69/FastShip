// THE DEPTH ENGINE — one pointer listener, one scroll listener, one rAF loop
// for the entire site.
//
// It writes three custom properties onto <html> and nothing else:
//
//   --dx   pointer X, -1 (left edge) .. 1 (right edge)
//   --dy   pointer Y, -1 (top edge)  .. 1 (bottom edge)
//   --sy   window.scrollY, unitless pixel count
//
// Every parallax layer on the site is a `.par` element (see motion.css) that
// multiplies these by its own amplitude. That is the whole contract: React
// never re-renders for pointer movement, no component holds mouse state, and
// adding a new depth layer costs one class and two CSS variables.
//
// WHY SMOOTHED: the raw pointer position snaps, which reads as twitchy. Each
// frame moves the current value a fraction of the way to the target
// (exponential ease), giving the background real inertia — it keeps drifting
// for a moment after the cursor stops, which is what sells the depth.
//
// WHY IT IDLES: the loop stops as soon as the values have settled onto their
// targets, so a still cursor costs zero frames. Any new input restarts it.

import { motionIntensity } from './motionPolicy'

// Fraction of the remaining distance covered per frame. Lower = heavier,
// more cinematic drift. 0.08 settles in ~250ms, which matches the "slow,
// continuous" tier of the motion language in motion.css.
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
    // Land exactly on the target so a settled layer sits at a whole value
    // instead of an arbitrary fraction of a pixel away from it.
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

// Pointer leaving the window returns the scene to centre rather than freezing
// it wherever the cursor happened to exit.
function onPointerLeave() {
  state.tx = 0
  state.ty = 0
  wake()
}

function onScroll() {
  state.ts = window.scrollY
  wake()
}

// Starts the engine. Safe to call more than once — later calls are no-ops.
// Returns a teardown so React StrictMode's double-invoke stays clean.
export function startDepthEngine() {
  if (typeof window === 'undefined' || state.started) return () => {}
  state.started = true

  // Full intensity unless the site policy says otherwise — see motionPolicy.js.
  state.intensity = motionIntensity()

  // Touch devices have no meaningful pointer position: binding pointermove
  // there would make the background lurch on every tap, and cost a frame
  // budget phones would rather spend elsewhere. --dx/--dy simply stay 0,
  // which leaves every .par layer at its original position.
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

// True only on devices that can actually hover. Tilt/magnet hooks bail out
// otherwise, so a phone never pays for listeners it can't trigger.
export function canHover() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

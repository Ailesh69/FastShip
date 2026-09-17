// Deliberately does NOT honour `prefers-reduced-motion` — the motion IS the
// design here, and killing it made the pages read as broken (see index.css,
// two past regressions). Known accessibility tradeoff, made on purpose.
// Flip to `true` to restore JS-side damping (CSS side was deleted, not
// gated — re-add notes at the foot of motion.css / fastship-intro.css).
export const RESPECT_REDUCED_MOTION = false

// Multiplier when reduced motion IS respected. Never 0 — full freeze looked dead.
const REDUCED_INTENSITY = 0.5

/** True only when the visitor asked for less motion AND we are honouring it. */
export function reducedMotionActive() {
  if (!RESPECT_REDUCED_MOTION) return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Global amplitude multiplier for pointer parallax, card tilt and magnetic
 * buttons. 1 = the designed intensity, which is what ships.
 */
export function motionIntensity() {
  return reducedMotionActive() ? REDUCED_INTENSITY : 1
}

// SITE MOTION POLICY — one switch, deliberately.
//
// This site does NOT honour `prefers-reduced-motion`. Every animation here is
// decoration — the intro, the parallax depth, the card tilt, the scroll
// reveals — and the design is the motion; with it removed the pages read as
// broken rather than calm. index.css has carried the same stance for the
// ambient sprite and floor animations since before this module existed, and
// documents two separate regressions caused by gating on the query.
//
// This is a real accessibility tradeoff, made knowingly by the site owner:
// visitors who set the OS preference (often for vestibular disorders) get the
// full motion anyway. Everything that could honour it still routes through
// here, so restoring the behaviour is one line:
//
//     export const RESPECT_REDUCED_MOTION = true
//
// Flipping that back on restores the JS-side damping below. The CSS side was
// deleted outright rather than left as dead `@media` blocks — see the notes at
// the foot of motion.css and fastship-intro.css for exactly what to re-add.
export const RESPECT_REDUCED_MOTION = false

// Amplitude multiplier applied when the preference IS being respected. Never
// 0: index.css records that blanket-freezing decoration is what made the scene
// look dead, twice. This only has any effect while RESPECT_REDUCED_MOTION is
// true.
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

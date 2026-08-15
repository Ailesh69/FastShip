import PerspectiveFloor from './PerspectiveFloor'

// The shared retro background: flat navy, an optional rectangular grid in the
// two side margins above the horizon, and the perspective floor below it.
//
// Both pages render this same component; they only differ in where the horizon
// sits. The hero puts it at 46%; the sign-up page has three tall cards above it
// so its horizon drops to ~85% and the side bands are switched off (there is no
// open margin left to show them in).
//
// The centre above the horizon always stays flat navy so page copy reads
// cleanly, and PerspectiveFloor emits no geometry above the horizon, so the
// floor can never fan upward into a pyramid.
//
// DEPTH: the two planes are `.par` layers (motion.css) travelling at different
// rates against the pointer, which is what turns a flat backdrop into a scene
// with a near and a far plane. The floor moves LEAST because it is the far
// plane — sliding it sideways drags the vanishing point with it, so the grid
// reads as a road you are looking down rather than a picture of one. The
// bands sit closer to the viewer and move roughly twice as far.
//
// Amplitudes are in px at full pointer deflection and are deliberately small:
// the horizon must not visibly tilt or the whole scene loses its footing. They
// are NEGATIVE so each plane slides away from the cursor — the camera-pan
// direction (see the sign convention in motion.css). The floor takes no Y at
// all: the horizon line stays exactly where index.css and the page layout
// agreed to put it.

// How far the lit accent rules are extended past the viewport edge, in px.
// Must be >= |FLOOR_X|, or a translated accent would pull up short of the edge
// it starts on. Only the far end is extended, so each rule's inboard end stays
// exactly where it was. The floor grid itself solves the same problem inside
// PerspectiveFloor (see EDGE_PAD there) — its layer box is left at inset-0, so
// its geometry is untouched.
const ACCENT_OVERSCAN = 14
const FLOOR_X = -12
const BANDS_X = -22
const BANDS_Y = -7

function GridBackground({ horizon = '46%', bands = true, accents = true, floor = true }) {
  // Percent string -> the 880-unit space PerspectiveFloor draws in.
  const horizonY = (parseFloat(horizon) / 100) * 880

  return (
    <div
      // `scene-backdrop` is a hook, not a style — it carries no rules of its
      // own. The intro uses it to drop this whole layer out of the frame while
      // it is covering the screen (see .fsi-playing in fastship-intro.css).
      className="scene-backdrop pointer-events-none absolute inset-0 overflow-hidden bg-fs-bg"
      style={{ '--horizon': horizon }}
      aria-hidden="true"
    >
      {/* above the horizon: rectangular grid, side bands only.
          The band mask keeps its edges well inside the viewport, so this layer
          needs no overscan — the pattern and its mask travel together. */}
      {bands && (
        <div className="grid-bands par" style={{ '--par-x': `${BANDS_X}px`, '--par-y': `${BANDS_Y}px` }} />
      )}

      {/* below the horizon: the receding floor, faded as it nears the viewer.
          The role sign-up screens switch this off — their reference art is
          plain navy with only the sprite field. */}
      {floor && (
        // The mask and the parallax MUST live on separate elements. A mask is
        // bounded by its own element's box, and that box travels with the
        // element's transform — so putting both on one element meant the mask
        // slid sideways too and shaved off exactly the strip that
        // PerspectiveFloor's EDGE_PAD overspill exists to cover, leaving the
        // floor short of the viewport edge. Outer element: the horizon fade,
        // never transformed. Inner element: the parallax.
        <div className="floor-fade absolute inset-0">
          <div className="par absolute inset-0" style={{ '--par-x': `${FLOOR_X}px` }}>
            <PerspectiveFloor horizonY={horizonY} />
          </div>
        </div>
      )}

      {/* two floor lines lit up in hot green, as in the reference.
          They belong to the floor plane, so they travel with it — and they are
          extended past the viewport edge by the overscan for the same reason
          the floor is, so neither ever pulls up short of the edge it starts on.

          The wrapper is `absolute inset-0`, not a bare div: it is transformed,
          which makes it the containing block for the absolutely-positioned
          accents inside it. A static wrapper would collapse to zero height and
          their `top: calc(... + 10.8%)` would resolve against nothing. */}
      {accents && (
        <div className="par absolute inset-0" style={{ '--par-x': `${FLOOR_X}px` }}>
          <div
            className="grid-accent"
            style={{
              left: -ACCENT_OVERSCAN,
              top: `calc(${horizon} + 10.8%)`,
              width: `calc(36% + ${ACCENT_OVERSCAN}px)`,
            }}
          />
          <div
            className="grid-accent"
            style={{
              left: '72%',
              top: `calc(${horizon} + 10.8%)`,
              width: `calc(28% + ${ACCENT_OVERSCAN}px)`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default GridBackground

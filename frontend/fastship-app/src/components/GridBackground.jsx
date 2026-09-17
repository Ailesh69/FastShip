import PerspectiveFloor from './PerspectiveFloor'

// Shared retro background: flat navy, optional side-margin grid above the
// horizon, perspective floor below it. Both pages use this; only the
// horizon position differs (hero 46%, sign-up ~85% with bands off — no
// margin left to show them in).
//
// Centre above horizon stays flat navy; PerspectiveFloor emits nothing
// above horizon so the floor can't fan into a pyramid.
//
// DEPTH: floor and bands are `.par` layers moving at different rates —
// floor moves LEAST (far plane; sliding it drags the vanishing point, so
// it reads as a road not a picture of one). Amplitudes are small px values,
// NEGATIVE (planes slide away from cursor, motion.css sign convention).
// Floor has no Y — horizon stays exactly where layout put it.

// How far the lit accent rules extend past the viewport edge (px). Must be
// >= |FLOOR_X| or a translated accent falls short of its edge. Only the far
// end extends. PerspectiveFloor solves the same problem via its own EDGE_PAD.
const ACCENT_OVERSCAN = 14
const FLOOR_X = -12
const BANDS_X = -22
const BANDS_Y = -7

function GridBackground({ horizon = '46%', bands = true, accents = true, floor = true }) {
  // Percent string -> the 880-unit space PerspectiveFloor draws in.
  const horizonY = (parseFloat(horizon) / 100) * 880

  return (
    <div
      // `scene-backdrop` is a hook, no rules of its own — intro uses it to
      // drop this layer out of frame while covering the screen (.fsi-playing).
      className="scene-backdrop pointer-events-none absolute inset-0 overflow-hidden bg-fs-bg"
      style={{ '--horizon': horizon }}
      aria-hidden="true"
    >
      {/* above horizon: side bands only. Mask stays well inside viewport,
          so no overscan needed — pattern and mask travel together. */}
      {bands && (
        <div className="grid-bands par" style={{ '--par-x': `${BANDS_X}px`, '--par-y': `${BANDS_Y}px` }} />
      )}

      {/* below horizon: receding floor, faded near viewer. Sign-up screens
          switch it off (plain navy + sprite field only). */}
      {floor && (
        // Mask and parallax must be on separate elements — a mask is bound
        // to its element's box, which moves with its transform, so combining
        // them would slide the mask too and clip the EDGE_PAD overspill.
        // Outer: horizon fade, never transformed. Inner: the parallax.
        <div className="floor-fade absolute inset-0">
          <div className="par absolute inset-0" style={{ '--par-x': `${FLOOR_X}px` }}>
            <PerspectiveFloor horizonY={horizonY} />
          </div>
        </div>
      )}

      {/* Two hot-green floor accent lines, travel with the floor plane,
          same overscan reasoning. Wrapper is `absolute inset-0` (transformed)
          so it's a containing block for the accents' `top: calc(...)` —
          a static wrapper would collapse to zero height. */}
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

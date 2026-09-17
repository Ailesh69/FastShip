// Perspective floor below the horizon — computed geometry, not a CSS 3D
// transform, so convergence matches the reference exactly. Units: nominal
// 1372x880, measured off the reference art.
//   * vanishing point sits ABOVE the horizon at horizonY - VP_RISE (so lines
//     have real spacing at the floor's start, not a pinch point)
//   * verticals radiate from the VP, evenly spaced at horizon
//   * horizontals follow a harmonic progression (1/distance-from-VP falls by
//     a constant step) so they bunch at the horizon, open toward the viewer
//
// `horizonY` is the only per-page variable; VP derives from it, so moving
// the horizon translates the floor rather than reshaping it. Nothing is
// emitted above horizonY — floor can't fan upward into a pyramid shape.

const W = 1372
const H = 880
const CX = W / 2

// Overscan (viewBox units) for depth lines only. The floor is a `.par`
// parallax layer that slides sideways with the pointer; without this pad
// the edge-to-edge depth lines would slide inboard and expose a bare strip.
// Drawn OUTSIDE the viewBox with `overflow: visible` so line geometry stays
// exact (widening the element would stretch/reshape convergence instead).
// Parent .floor-fade's mask clips the overspill at the viewport edge.
const EDGE_PAD = 60
const VP_RISE = 376 // vanishing point clearance above the horizon
const SPACING_AT_HORIZON = 88.6 // gap between adjacent verticals on the horizon
const DEPTH_STEP = 0.0001342 // harmonic step for the horizontal lines

const SLOPE = SPACING_AT_HORIZON / VP_RISE // x-offset per unit depth, per line index

// Enough verticals to span the full width at the horizon (the outer ones run
// off the sides long before they reach the bottom, as they should).
const LINE_COUNT = Math.ceil(CX / SPACING_AT_HORIZON) + 1

function PerspectiveFloor({ horizonY = 405 }) {
  const vpY = horizonY - VP_RISE

  // Rail k's rotation (deg) from straight-down, about the VP. Rail k->k+1 is
  // a pure rotation, so sweeping by delta keeps rails converged (a plain
  // translateX would shear them off the VP).
  const railAngle = (k) => -Math.atan(k * SLOPE) * (180 / Math.PI)

  const verticals = []
  for (let n = -LINE_COUNT - 1; n <= LINE_COUNT + 1; n++) {
    verticals.push({
      x1: CX + n * SLOPE * VP_RISE,
      x2: CX + n * SLOPE * (H - vpY),
      // one cycle lands this rail exactly where its neighbour started
      dRot: railAngle(n + 1) - railAngle(n),
    })
  }

  // y = vpY + 1 / (u0 - i * DEPTH_STEP), walking toward viewer until off-page.
  // `dy` = distance to next line's slot; animating each line by its own dy
  // over one shared duration advances the field by one depth step per
  // cycle, so the loop is seamless. dy grows toward viewer = perspective accel.
  const ys = []
  for (let i = 0, u = 1 / VP_RISE; i < 48; i++, u -= DEPTH_STEP) {
    if (u <= 0) break
    const y = vpY + 1 / u
    ys.push(y)
    if (y > H) break // one past bottom edge: last visible line's exit slot
  }
  const horizontals = ys
    .slice(0, -1)
    .map((y, i) => ({ y, dy: ys[i + 1] - y }))

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      // Lets the EDGE_PAD overspill paint past the viewBox instead of being
      // clipped back to it. The parent's mask still bounds the layer.
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <g
        stroke="var(--grid-line)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        shapeRendering="crispEdges"
      >
        {/* Rails rotate about the VP so they move but stay converged.
            Same --grid-cycle as depth lines — one clock. */}
        {verticals.map((v, i) => (
          <line
            key={`v${i}`}
            className="floor-rail"
            x1={v.x1}
            y1={horizonY}
            x2={v.x2}
            y2={H}
            style={{ '--drot': `${v.dRot}deg`, transformOrigin: `${CX}px ${vpY}px` }}
          />
        ))}

        {/* Depth lines flow toward the viewer. See .floor-line in index.css. */}
        {horizontals.map(({ y, dy }, i) => (
          <line
            key={`h${i}`}
            className="floor-line"
            x1={-EDGE_PAD}
            y1={y}
            x2={W + EDGE_PAD}
            y2={y}
            style={{ '--dy': `${dy}px` }}
          />
        ))}
      </g>
    </svg>
  )
}

export default PerspectiveFloor

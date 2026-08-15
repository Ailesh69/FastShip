// The perspective floor below the horizon, drawn as computed geometry rather
// than a CSS 3D transform so the convergence matches the reference exactly.
//
// Geometry (all measured off the reference art, in nominal 1372x880 units):
//   * the vanishing point sits ABOVE the horizon, at horizonY - VP_RISE — which
//     is why the lines already have real spacing where the floor starts instead
//     of pinching to a point;
//   * vertical lines radiate from the VP, evenly spaced at the horizon and
//     spreading toward the bottom edges;
//   * horizontal lines follow a perspective (harmonic) progression: the
//     reciprocal of their distance from the VP falls by a constant step, which
//     is what makes them bunch up at the horizon and open out toward the viewer.
//
// `horizonY` is the only thing pages vary. Because the vanishing point is
// derived from it, moving the horizon TRANSLATES the identical floor up or down
// rather than reshaping it — the sign-up page has more content above it, so its
// horizon sits lower, but the perspective reads exactly the same as the hero's.
//
// Nothing is emitted above horizonY, so the floor can never fan upward into
// the pyramid shape the old two-plane version produced.

const W = 1372
const H = 880
const CX = W / 2

// Horizontal overscan, in viewBox units, for the depth lines only.
//
// The floor plane is a `.par` parallax layer (GridBackground), so it slides a
// few px sideways with the pointer. The depth lines are the one thing here
// that spans edge to edge, so without this they would slide inboard and leave
// a bare strip down one side of the viewport.
//
// It is drawn OUTSIDE the viewBox — with `overflow: visible` on the <svg>, so
// the viewBox mapping is untouched and every line stays exactly where the
// measured geometry puts it. Widening the element instead would have stretched
// the whole floor horizontally (preserveAspectRatio="none"), which moves every
// vertical and changes the convergence the art was matched against.
// The parent .floor-fade is inset-0 and carries the mask, so the overspill is
// clipped at the viewport edge where it should be.
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

  // Screen rotation (deg) of rail k, measured from straight-down. Every rail
  // passes through the vanishing point, so rail k -> rail k+1 is purely a
  // rotation ABOUT that point. Sweeping each rail by its own delta therefore
  // slides the rails sideways while keeping them converged on the VP — a plain
  // translateX would shear them off it.
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

  // y = vpY + 1 / (u0 - i * DEPTH_STEP), walking toward the viewer until we
  // fall off the bottom of the page.
  //
  // Each line also carries `dy`: the distance to the NEXT line's slot. Animating
  // every line by its own dy over one shared duration advances the whole field
  // by exactly one depth step per cycle, so at the loop point the on-screen set
  // of positions is identical to the start — seamless, no jump. dy grows toward
  // the viewer, which is what gives the flow its perspective acceleration.
  const ys = []
  for (let i = 0, u = 1 / VP_RISE; i < 48; i++, u -= DEPTH_STEP) {
    if (u <= 0) break
    const y = vpY + 1 / u
    ys.push(y)
    // One past the bottom edge: that line's slot is where the last visible
    // line travels to, and it leaves the screen as a new one is born at the
    // horizon (hidden by the mask's fade-in).
    if (y > H) break
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
        {/* Rails sweep sideways by rotating about the vanishing point, so they
            visibly move yet stay converged. Same --grid-cycle as the depth
            lines, so the whole net advances on one clock. */}
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

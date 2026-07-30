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
function GridBackground({ horizon = '46%', bands = true, accents = true, floor = true }) {
  // Percent string -> the 880-unit space PerspectiveFloor draws in.
  const horizonY = (parseFloat(horizon) / 100) * 880

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-fs-bg"
      style={{ '--horizon': horizon }}
      aria-hidden="true"
    >
      {/* above the horizon: rectangular grid, side bands only */}
      {bands && <div className="grid-bands" />}

      {/* below the horizon: the receding floor, faded as it nears the viewer.
          The role sign-up screens switch this off — their reference art is
          plain navy with only the sprite field. */}
      {floor && (
        <div className="floor-fade absolute inset-0">
          <PerspectiveFloor horizonY={horizonY} />
        </div>
      )}

      {/* two floor lines lit up in hot green, as in the reference */}
      {accents && (
        <>
          <div
            className="grid-accent"
            style={{ left: 0, top: `calc(${horizon} + 10.8%)`, width: '36%' }}
          />
          <div
            className="grid-accent"
            style={{ left: '72%', top: `calc(${horizon} + 10.8%)`, width: '28%' }}
          />
        </>
      )}
    </div>
  )
}

export default GridBackground

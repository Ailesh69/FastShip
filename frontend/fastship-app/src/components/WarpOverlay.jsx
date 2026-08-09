import GridBackground from './GridBackground'
import PixelArt from './PixelArt'
import { SPARKLE, SPARKLE_TEAL_PALETTE, STAR, STAR_PALETTE } from './pixelSpriteAssets'
import { useLoadingNav } from '../context/loadingNav'

// Fast alternate to the turret loader: a ~550ms grid-dive / flash / resolve,
// no percentage, no text. See the "WARP TRANSITION OVERLAY" section in
// index.css for the shared 550ms timeline every layer here rides on.
//
// Which of the two overlays shows is decided per-navigation in
// LoadingNavProvider — this component only renders while that pick is
// 'warp', and unmounts (via `active` going false) once the timeline ends.

// Radial burst: each sprite flies outward from center at its own angle and
// distance, same hand-tuned-array pattern as the turret's tracers/sparks.
const BURST = [
  { angle: -60, dist: 210, kind: 'sparkle', scale: 3 },
  { angle: -20, dist: 250, kind: 'star', scale: 2.2 },
  { angle: 15, dist: 190, kind: 'sparkle', scale: 2.6 },
  { angle: 55, dist: 230, kind: 'star', scale: 2 },
  { angle: 100, dist: 200, kind: 'sparkle', scale: 3.2 },
  { angle: 140, dist: 220, kind: 'star', scale: 2.4 },
  { angle: -110, dist: 195, kind: 'sparkle', scale: 2.2 },
  { angle: -150, dist: 240, kind: 'star', scale: 2.8 },
]

function BurstSprite({ angle, dist, kind, scale }) {
  const rad = (angle * Math.PI) / 180
  const bx = Math.cos(rad) * dist
  const by = Math.sin(rad) * dist

  return (
    <div
      className="anim-burst absolute left-1/2 top-1/2"
      style={{ '--bx': `${bx}px`, '--by': `${by}px`, marginLeft: -8 * scale, marginTop: -8 * scale }}
    >
      {kind === 'star' ? (
        <PixelArt rows={STAR} palette={STAR_PALETTE} scale={scale} outline="#7c4a03" />
      ) : (
        <PixelArt rows={SPARKLE} palette={SPARKLE_TEAL_PALETTE} scale={scale} />
      )}
    </div>
  )
}

function WarpOverlay() {
  const { active, variant, destination } = useLoadingNav()

  if (!active || variant !== 'warp') return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[100] overflow-hidden"
      // Remounts every navigation so the 550ms timeline always restarts
      // clean instead of resuming mid-animation on a rapid re-trigger.
      key={destination}
    >
      {/* 1. grid dive — a second, scaled instance so the shared background
          one stays untouched underneath */}
      <div className="warp-grid-zoom absolute inset-0">
        <GridBackground horizon="46%" bands accents floor />
      </div>

      {/* 2. blurs/dims whatever is behind it (live page + the zoom grid) —
          stands in for blurring the page content itself */}
      <div className="warp-scrim absolute inset-0" style={{ background: 'rgba(2,4,16,0.5)' }} />

      {/* 3. full-screen white flash, peaks mid-transition */}
      <div
        className="warp-flash absolute inset-0"
        style={{
          background:
            'radial-gradient(circle, #ffffff 0%, #eafff5 35%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* 4. particle burst, crisp and unblurred on top */}
      <div className="absolute inset-0">
        {BURST.map((b, i) => (
          <BurstSprite key={i} {...b} />
        ))}
      </div>
    </div>
  )
}

export default WarpOverlay

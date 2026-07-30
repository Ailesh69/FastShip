import PixelArt from './PixelArt'

// The firing turret on the loading screen: pixel gun, muzzle flash, bullet
// tracers and debris sparks. Everything animates continuously via CSS keyframes
// (see index.css) with staggered delays, so nothing on the overlay sits still.

const TURRET = [
  '....K...................',
  '...KWK..................',
  '....KWK.................',
  '.....KWK................',
  '.KKKKKKKKKKKKKKK........',
  '.KOLLLLLLLLLLLLLK.......',
  '.KOLSSSSMMSSSSSSKKKKKKK.',
  '.KOLSOOOSSSOOOSSLLLLLLK.',
  '.KKLSSSSSSSSSSSSKKKKKKK.',
  '..KLLLLLLLLLLLLLK.......',
  '..KKKKKKMMKKKKKKK.......',
  '.....KSSMMSSK...........',
  '.....KSMMMMSK...........',
  '.....KSSMMSSK...........',
  '......KSSSSK............',
  '......KSSSSK............',
  '....KKKKKKKKKK..........',
  '....KBBBBBBBBK..........',
  '...KKKKKKKKKKKK.........',
  '...KBBBBBBBBBBK.........',
]
const TURRET_PALETTE = {
  K: '#12161f', // outline
  S: '#5a6472', // slate body
  L: '#8d97a4', // light slate
  W: '#c9d3de', // antenna highlight
  M: '#7fd6a3', // mint accent
  O: '#e2703a', // orange panel
  B: '#39424f', // pedestal
}

const SCALE = 6
const MUZZLE_X = 23 * SCALE // barrel tip, in sprite pixels
const MUZZLE_Y = 7 * SCALE

// Tracers fan out to the right at uneven angles, lengths and speeds.
const TRACERS = [
  { angle: -25, reach: 300, len: 62, dur: 0.52, delay: 0 },
  { angle: -14, reach: 380, len: 78, dur: 0.46, delay: 0.13 },
  { angle: -5, reach: 330, len: 68, dur: 0.58, delay: 0.27 },
  { angle: 4, reach: 400, len: 84, dur: 0.5, delay: 0.07 },
  { angle: 13, reach: 340, len: 70, dur: 0.44, delay: 0.34 },
  { angle: 24, reach: 290, len: 58, dur: 0.56, delay: 0.2 },
]

// Orange/green debris pixels around the muzzle, flickering on the flash beat.
const SPARKS = [
  { dx: 18, dy: -34, size: 6, color: '#f9a03a', delay: 0 },
  { dx: 44, dy: -22, size: 5, color: '#7fd6a3', delay: 0.1 },
  { dx: 30, dy: 26, size: 6, color: '#f97316', delay: 0.05 },
  { dx: 62, dy: 34, size: 5, color: '#f9a03a', delay: 0.22 },
  { dx: 8, dy: 40, size: 4, color: '#7fd6a3', delay: 0.16 },
  { dx: 74, dy: -8, size: 4, color: '#f97316', delay: 0.28 },
  { dx: -6, dy: -18, size: 4, color: '#f9a03a', delay: 0.34 },
  { dx: 52, dy: 6, size: 5, color: '#8bf0b0', delay: 0.12 },
]

function TurretSprite() {
  return (
    <div className="relative" style={{ width: 24 * SCALE, height: 20 * SCALE }}>
      <PixelArt rows={TURRET} palette={TURRET_PALETTE} scale={SCALE} outline="#080b12" />

      {/* Everything below is anchored to the barrel tip. Overflow is allowed —
          the tracers deliberately fly past the panel edge, as in the reference. */}
      <div className="absolute" style={{ left: MUZZLE_X, top: MUZZLE_Y }}>
        {/* bullet tracers */}
        {TRACERS.map((t, i) => (
          <div
            key={`t${i}`}
            className="absolute"
            style={{
              left: 0,
              top: 0,
              transform: `rotate(${t.angle}deg)`,
              transformOrigin: 'left center',
            }}
          >
            <div
              style={{
                '--reach': `${t.reach}px`,
                width: t.len,
                height: 4,
                marginTop: -2,
                transformOrigin: 'left center',
                borderRadius: 2,
                background:
                  'linear-gradient(to right, rgba(63,224,132,0) 0%, #3fe084 45%, #d9ffe9 88%, #ffe6a3 100%)',
                boxShadow: '0 0 8px rgba(63,224,132,0.9)',
                animation: `tracer ${t.dur}s linear ${t.delay}s infinite`,
              }}
            />
          </div>
        ))}

        {/* white-hot core, drawn first so the starburst spikes read on top */}
        <div
          className="absolute"
          style={{
            left: -28,
            top: -28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, #ffffff 0%, #f2fff6 13%, #b6ffcf 24%, #5cf08a 34%, rgba(63,224,132,0.28) 50%, rgba(63,224,132,0) 66%)',
            animation: 'muzzle 0.4s ease-in-out infinite',
          }}
        />

        {/* muzzle flash: orange starburst spikes */}
        {[-38, -20, -7, 6, 19, 36].map((a, i) => (
          <div
            key={`s${i}`}
            className="absolute"
            style={{
              left: 0,
              top: 0,
              transform: `rotate(${a}deg)`,
              transformOrigin: 'left center',
            }}
          >
            <div
              style={{
                width: 46 + (i % 3) * 12,
                height: 5,
                marginTop: -2.5,
                transformOrigin: 'left center',
                background: 'linear-gradient(to right, #fff2c4 0%, #f97316 60%, rgba(249,115,22,0) 100%)',
                animation: `muzzle ${0.36 + (i % 3) * 0.05}s ease-in-out ${i * 0.04}s infinite`,
              }}
            />
          </div>
        ))}

        {/* debris */}
        {SPARKS.map((s, i) => (
          <div
            key={`k${i}`}
            className="pixelated absolute"
            style={{
              left: s.dx,
              top: s.dy,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 6px ${s.color}`,
              animation: `spark ${0.4 + (i % 4) * 0.06}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default TurretSprite

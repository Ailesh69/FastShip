import { useEffect, useRef } from 'react'
import { useLoadingNav, WARP_COVER_MS, WARP_REVEAL_MS } from '../context/loadingNav'

// Fast alternate to the turret loader: a diagonal pixel-tile wave wipes in to
// cover the screen, then wipes back out to reveal the destination, with
// floating cyan/orange particles drifting through the whole thing. Canvas +
// requestAnimationFrame, ported from a standalone reference implementation.
//
// The reference drove its wave off a per-frame progress increment
// (`progress += 0.035`), which drifts on anything other than ~60fps. Here
// progress is derived from real elapsed time instead, and pinned to
// WARP_COVER_MS / WARP_REVEAL_MS so the visual "fully covered" moment lines
// up with LoadingNavProvider's own WARP_SWAP_MS route swap.
//
// Which of the two overlays shows is decided per-navigation in
// LoadingNavProvider — this component only renders while that pick is
// 'warp', and unmounts (via `active` going false) once the timeline ends.

const TILE = 32
const PARTICLE_COUNT = 45
// Progress value a phase counts as "done" at — headroom above 1 so the
// diagonal stagger (delay up to 0.4) and the *2.2 tile ramp both fully
// resolve before the phase flips, same as the reference.
const PHASE_DONE = 1.4

function makeParticles(width, height) {
  const particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() > 0.5 ? 6 : 10,
      speedY: -(Math.random() * 2 + 1),
      speedX: (Math.random() - 0.5) * 1.5,
      color: Math.random() > 0.35 ? '#ff8c00' : '#00ffcc',
    })
  }
  return particles
}

function WarpOverlay() {
  const { active, variant, destination } = useLoadingNav()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active || variant !== 'warp') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = makeParticles(canvas.width, canvas.height)
    const startedAt = performance.now()
    let mode = 'in' // 'in' = covering, 'out' = revealing
    let rafId = 0

    function draw(now) {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const cols = Math.ceil(width / TILE)
      const rows = Math.ceil(height / TILE)

      const phaseMs = mode === 'in' ? WARP_COVER_MS : WARP_REVEAL_MS
      const phaseStart = mode === 'in' ? startedAt : startedAt + WARP_COVER_MS
      const progress = ((now - phaseStart) / phaseMs) * PHASE_DONE

      // 1. diagonal pixel-tile wave
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const delay = (c / cols + r / rows) * 0.4
          const pseudoRandom = Math.sin(c * 12.9898 + r * 78.233) * 0.08
          const tileProgress = Math.max(0, Math.min(1, (progress - delay + pseudoRandom) * 2.2))
          const alpha = mode === 'in' ? tileProgress : 1 - tileProgress

          if (alpha > 0) {
            ctx.fillStyle = (c + r) % 6 === 0 ? '#00ffcc' : '#07121d'
            ctx.globalAlpha = alpha
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE)
          }
        }
      }

      // 2. floating pixel particles
      ctx.globalAlpha = 1
      particles.forEach((p) => {
        p.y += p.speedY
        p.x += p.speedX
        if (p.y < 0) p.y = height
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      })

      // 3. phase controller
      if (progress >= PHASE_DONE && mode === 'in') {
        mode = 'out'
      } else if (progress >= PHASE_DONE && mode === 'out') {
        ctx.clearRect(0, 0, width, height)
        return
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [active, variant, destination])

  if (!active || variant !== 'warp') return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[100]"
      // Remounts every navigation so the canvas/particles/timers always
      // restart clean instead of resuming mid-animation on a rapid re-trigger.
      key={destination}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

export default WarpOverlay

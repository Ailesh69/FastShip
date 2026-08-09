import { useEffect, useState } from 'react'
import { subtitleFor, useLoadingNav } from '../context/loadingNav'
import TurretSprite from './TurretSprite'

// Full-screen transition overlay. It sits above the current page and blocks all
// interaction underneath, while the shared animated background and sprite field
// stay visible through the scrim around the panel — no background is duplicated
// here, it is simply the live page showing through.

const CAPTIONS = ['PROCESSING DATA PACKETS...', 'SYNCING INVENTORY...', 'LOADING ASSETS...']

// Given a `key`, this remounts per navigation, so the caption always restarts
// from the first line without needing a reset.
function CyclingCaption() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % CAPTIONS.length), 1500)
    return () => clearInterval(id)
  }, [])

  return CAPTIONS[i]
}

function LoadingOverlay() {
  const { active, pct, fading, destination, variant } = useLoadingNav()

  if (!active || variant !== 'gun') return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading, ${pct} percent`}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'rgba(2, 4, 16, 0.86)',
        animation: 'overlay-in 180ms ease-out both',
        opacity: fading ? 0 : 1,
        transition: 'opacity 260ms ease-out',
      }}
    >
      <div
        className="loading-panel relative flex w-[520px] max-w-[92vw] flex-col items-center rounded-[6px] px-[28px] pt-[24px] pb-[26px]"
        // Tracers deliberately fly out past the panel edge.
        style={{ overflow: 'visible' }}
      >
        {/* CRT scanline texture — clipped to the panel, translated (not
            background-position) so it composites instead of repainting */}
        <span className="scanline-clip" aria-hidden="true">
          <span className="scanline-strip" />
        </span>

        {/* 1. wordmark */}
        <div className="logo-glow text-[22px] leading-none">FS</div>

        {/* 2. LOADING... */}
        <div
          className="mt-[30px] text-[36px] leading-none"
          style={{
            color: '#1fee79',
            textShadow: '0 0 10px rgba(31,238,121,0.9), 0 0 28px rgba(31,238,121,0.5)',
          }}
        >
          LOADING...
        </div>

        {/* 3. destination-aware data-link line */}
        <div className="mt-[26px] whitespace-nowrap text-[11px] leading-none text-white">
          {subtitleFor(destination)}
        </div>

        {/* 4. live percentage */}
        <div
          className="mt-[30px] text-[20px] leading-none text-white"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.55)' }}
        >
          {pct}%
        </div>

        {/* 5. firing turret — nudged left so the muzzle sits near the panel's
            centre line and the tracers have room to fly out past its edge */}
        <div className="mt-[10px] flex h-[126px] w-full items-center justify-center">
          <div style={{ transform: 'translateX(-54px)' }}>
            <TurretSprite />
          </div>
        </div>

        {/* 6. cycling caption */}
        <div className="mt-[18px] text-[10px] leading-none text-[#8b9aa1]">
          <CyclingCaption key={destination} />
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay

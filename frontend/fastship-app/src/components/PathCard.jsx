import useTilt from '../motion/useTilt'
import useMagnetic from '../motion/useMagnetic'

// One "choose your path" card: heading, pixel icon, three-line blurb and a
// SELECT affordance.
//
// SELECT is framed by four small orange corner marks rather than literal
// square brackets — a classic RPG menu cursor. Each corner is nudged and
// tilted a little differently so the frame reads hand-placed, not geometric.
//
// This is the site's one real "pick something" screen, so it carries the
// strongest interaction on the site: the card tilts toward the cursor and
// lifts, and SELECT leans after it. The tilt ref goes on the .path-card
// element itself and the magnet ref on the button itself, so neither adds a
// wrapper and an untouched card is identical to before.

const CORNERS = [
  // [vertical, horizontal, which borders, tilt]
  { top: -9, left: -14, borders: { borderTop: true, borderLeft: true }, rot: -8 },
  { top: -11, right: -14, borders: { borderTop: true, borderRight: true }, rot: 6 },
  { bottom: -10, left: -12, borders: { borderBottom: true, borderLeft: true }, rot: 7 },
  { bottom: -8, right: -15, borders: { borderBottom: true, borderRight: true }, rot: -5 },
]

function CornerMark({ spec }) {
  const { borders, rot, ...pos } = spec
  const edge = '3px solid var(--color-fs-orange)'
  return (
    <span
      aria-hidden="true"
      className="absolute block h-[9px] w-[9px]"
      style={{
        ...pos,
        borderTop: borders.borderTop ? edge : undefined,
        borderBottom: borders.borderBottom ? edge : undefined,
        borderLeft: borders.borderLeft ? edge : undefined,
        borderRight: borders.borderRight ? edge : undefined,
        transform: `rotate(${rot}deg)`,
        filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.7))',
      }}
    />
  )
}

function PathCard({ title, icon, lines, onSelect }) {
  const tilt = useTilt({ max: 8, lift: 22 })
  const select = useMagnetic({ strength: 5 })

  return (
    <div
      ref={tilt}
      className="path-card tilt flex w-[286px] flex-col items-center rounded-[4px] px-[14px] pt-[34px] pb-[34px]"
    >
      {/* Heading */}
      <h2 className="white-glow m-0 whitespace-nowrap text-[15px] leading-none">{title}</h2>

      {/* Pixel icon */}
      <div className="mt-[30px] flex h-[132px] items-center justify-center">{icon}</div>

      {/* Three-line blurb */}
      <p className="m-0 mt-[46px] text-center text-[10px] leading-[22px] text-white">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>

      {/* SELECT, inside its retro corner frame */}
      <button
        ref={select}
        type="button"
        onClick={onSelect}
        className="mag relative mt-[40px] cursor-pointer border-0 bg-transparent px-[6px] py-[2px] font-[inherit] text-[14px] leading-none text-fs-green"
        style={{ textShadow: '0 0 8px rgba(125,232,126,0.85), 0 0 18px rgba(125,232,126,0.45)' }}
      >
        {CORNERS.map((spec, i) => (
          <CornerMark key={i} spec={spec} />
        ))}
        SELECT
      </button>
    </div>
  )
}

export default PathCard

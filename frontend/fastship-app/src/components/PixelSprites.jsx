import PixelArt from './PixelArt'
import { SPARKLE, SPARKLE_PALETTE, SPARKLE_TEAL_PALETTE } from './pixelSpriteAssets'

// Scattered 8-bit background sprites. Every position is a percentage taken off
// the reference art, so the whole field scales with the viewport instead of
// drifting away from the grid at other window sizes.
//
// Each sprite carries its own ambient animation (see the anim-* classes in
// index.css) with a hand-picked delay, so nothing sits frozen and nothing moves
// in lockstep with its neighbours. The grid lines themselves stay static.
//
// This layer is purely decorative: pointer-events-none, aria-hidden.

/* ============================ SPRITE GRIDS ============================ */

// Blue diagonal arrow / cursor — a 2px shaft with a solid head at the tip.
const ARROW = [
  '........AAAAA',
  '..........AAA',
  '.........AAAA',
  '........AA..A',
  '.......AA....',
  '......AA.....',
  '.....AA......',
  '....AA.......',
  '...AA........',
  '..AA.........',
  '.AA..........',
  'AA...........',
  'A............',
]
const ARROW_PALETTE = { A: '#2f6fd0' }

// Green-cored microchip in a teal frame, with pins poking out on all four sides.
const CHIP = [
  '......T......',
  '.............',
  '..TTTTTTTTT..',
  '..T.......T..',
  '..T.GGGGG.T..',
  '..T.GGGGG.T..',
  'T.T.GGGGG.T.T',
  '..T.GGGGG.T..',
  '..T.GGGGG.T..',
  '..T.......T..',
  '..TTTTTTTTT..',
  '.............',
  '......T......',
]
const CHIP_PALETTE = { T: '#22d3ee', G: '#39ff14' }

// Orange tile with a dark ridge silhouette burned into it.
const CREATURE = [
  'OOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOO',
  'OOOOOOOOOOKOOO',
  'OOOOOOOOOKKKOO',
  'OOOOOOOOKKKKKO',
  'OOOOKOOKKKKKKK',
  'OOOKKKKKKKKKKK',
  'OOKKKKKKKKKKKK',
  'OKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKK',
  'OOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOO',
]
const CREATURE_PALETTE = { O: '#f97316', K: '#3b1d08' }

// Hollow gold gear / sun ring.
const GEAR = [
  '...GGGGG...',
  '..GGGGGGG..',
  '.GG.....GG.',
  'GG.......GG',
  'GG.......GG',
  'GG.......GG',
  'GG.......GG',
  'GG.......GG',
  '.GG.....GG.',
  '..GGGGGGG..',
  '...GGGGG...',
]
const GEAR_PALETTE = { G: '#fbbf24' }

// Four-point sparkle / diamond, shared by both ambient sparkles in the scene
// and (via pixelSpriteAssets.js) the warp transition's particle burst.

/* ============================ LAYOUTS ============================

   Only POSITIONS change between pages. Every sprite grid, colour, animation
   and stagger delay below is shared, so the two pages can never drift in
   behaviour — the sign-up page simply pushes the field out into the side
   margins, where its three tall cards leave room. */

const LAYOUTS = {
  hero: {
    arrow: [24.4, 12.6],
    brownRule: [12.2, 24.6],
    chip: [18.3, 22.4],
    creature: [20.7, 27.7],
    greenTick: [14.5, 31.5],
    greenRule: [1.6, 35],
    tealDots: [1.5, 37.5],
    gear: [75.2, 13.4],
    monolith: [79, 13.9],
    plumb: [81, 8.6],
    dashes: [78.8, 23.3],
    barStack: [75.7, 31],
    sparkleTeal: [79.1, 30.8],
    telemetry: [90, 27.4],
    orangeSquare: [90.3, 34.5],
    lowerBars: [90, 39],
    sparkle: [89.7, 79.6],
    dots: [
      [8, 18, '#f97316'],
      [31, 9, '#22d3ee'],
      [11, 42, '#22d3ee'],
      [27, 38, '#f97316'],
      [4, 29, '#f97316'],
      [34, 33, '#22d3ee'],
      [17, 15, '#22d3ee'],
      [69, 11, '#f97316'],
      [86, 17, '#22d3ee'],
      [72, 41, '#f97316'],
      [95, 22, '#f97316'],
      [67, 34, '#22d3ee'],
      [88, 44, '#22d3ee'],
      [83, 9, '#f97316'],
    ],
  },

  // Sign-up page: the three path cards occupy roughly 14%–85% of the width,
  // so everything lives outside that band.
  select: {
    arrow: [6.5, 14],
    brownRule: [4.5, 20.5],
    chip: [7.5, 24.3],
    creature: [8.5, 62],
    greenTick: [12.5, 30],
    greenRule: [1.6, 47],
    tealDots: [1.5, 52],
    gear: [11.5, 72],
    monolith: [95.5, 12],
    plumb: [93.5, 8],
    dashes: [88.5, 24],
    barStack: [90.5, 57],
    sparkleTeal: [91.5, 19.5],
    telemetry: [90, 43],
    orangeSquare: [87.3, 28],
    lowerBars: [90, 66],
    sparkle: [92.5, 83],
    dots: [
      [4, 18, '#f97316'],
      [9, 35, '#22d3ee'],
      [3, 55, '#22d3ee'],
      [11, 44, '#f97316'],
      [6, 70, '#f97316'],
      [13, 26, '#22d3ee'],
      [2, 66, '#22d3ee'],
      [94, 15, '#f97316'],
      [88, 36, '#22d3ee'],
      [96, 50, '#f97316'],
      [91, 70, '#f97316'],
      [86, 60, '#22d3ee'],
      [97, 30, '#22d3ee'],
      [89, 78, '#f97316'],
    ],
  },
}

/* ============================ PRIMITIVES ============================ */

// Sprite-field parallax, in px of travel at full pointer deflection for a
// sprite at depth 1. Negative: the field slides away from the cursor, same
// camera-pan direction as the grid planes behind it (see motion.css).
//
// These are larger than the floor's amplitude on purpose — the sprites are the
// NEAR plane. The gap between the two is what gives the background its
// dimension: pan the cursor and the sparkles visibly overtake the grid.
const SPRITE_X = -24
const SPRITE_Y = -13

// Absolutely-positioned wrapper. `at` is an [left%, top%] pair pulled from the
// active layout; `anim` is an anim-* class from index.css and `delay` staggers
// it against its neighbours.
//
// `depth` places the sprite in the field's Z order: ~0.3 for the far texture
// specks, ~1.3 for the big foreground sparkle. It only scales how far the
// sprite travels against the pointer; its resting position is still exactly
// the [left%, top%] measured off the reference art.
//
// The parallax lives on the OUTER element and the ambient animation on an
// inner one. Both are transforms, and the anim-* keyframes in index.css set
// `transform` outright — on a single element the animation would win every
// frame and the parallax would never be applied at all.
function At({ at, anim = '', delay = 0, depth = 0, children }) {
  const [l, t] = at
  return (
    <div
      className={depth ? 'par absolute' : 'absolute'}
      style={{
        left: `${l}%`,
        top: `${t}%`,
        ...(depth
          ? {
              '--par-x': `${(depth * SPRITE_X).toFixed(1)}px`,
              '--par-y': `${(depth * SPRITE_Y).toFixed(1)}px`,
            }
          : null),
      }}
    >
      <div className={anim} style={{ animationDelay: `${delay}s` }}>
        {children}
      </div>
    </div>
  )
}

// A hard-edged rectangle of colour — the "data bar" / tick primitive.
function Bar({ w, h, color, glow = true, opacity = 1, anim = '', delay = 0 }) {
  return (
    <div
      className={anim}
      style={{
        width: w,
        height: h,
        background: color,
        opacity,
        boxShadow: glow ? `0 0 5px ${color}` : undefined,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

/* ============================ THE FIELD ============================ */

function PixelSprites({ layout = 'hero' }) {
  const at = LAYOUTS[layout] ?? LAYOUTS.hero

  return (
    // The field as a whole lags the page slightly on scroll (`--par-s`), so on
    // the pages long enough to scroll it separates from the content in front
    // of it. Small: 5px of drift per 100px scrolled. Individual sprites add
    // their own pointer parallax on top, via `depth` on <At>.
    // `sprite-field` is a hook with no styles of its own — the intro uses it to
    // drop this layer out of the frame while it covers the screen (see
    // .fsi-playing in fastship-intro.css).
    <div
      className="sprite-field par pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ '--par-s': 0.05 }}
      aria-hidden="true"
    >
      {/* ---------------- LEFT HALF ---------------- */}

      {/* blue diagonal arrow / cursor — slow float */}
      <At at={at.arrow} anim="anim-drift" depth={0.8}>
        <PixelArt rows={ARROW} palette={ARROW_PALETTE} scale={2} />
      </At>

      {/* short brown-orange rule */}
      <At at={at.brownRule} anim="anim-marquee" delay={0.6} depth={0.5}>
        <Bar w={38} h={4} color="#b4652f" />
      </At>

      {/* green-cored chip in a teal frame — CRT glow blink */}
      <At at={at.chip} anim="anim-crt" delay={0.2} depth={0.7}>
        <PixelArt rows={CHIP} palette={CHIP_PALETTE} scale={2.4} />
      </At>

      {/* orange ridge tile — idle bob */}
      <At at={at.creature} anim="anim-bob" delay={0.4} depth={1.15}>
        <PixelArt rows={CREATURE} palette={CREATURE_PALETTE} scale={3} />
      </At>

      {/* short green upright tick */}
      <At at={at.greenTick} depth={0.45}>
        <Bar w={5} h={18} color="#39ff14" anim="anim-vu" delay={1} />
      </At>

      {/* long green rule running in from the left edge, with lead-in dots */}
      <At at={at.greenRule} depth={0.35}>
        <div className="flex items-center gap-[5px]">
          <Bar w={4} h={3} color="#39ff14" anim="anim-marquee" delay={0} />
          <Bar w={4} h={3} color="#39ff14" anim="anim-marquee" delay={0.3} />
          <Bar w={100} h={3} color="#39ff14" anim="anim-marquee" delay={0.6} />
        </div>
      </At>

      {/* two stacked teal dots, hard against the left edge */}
      <At at={at.tealDots} depth={0.4}>
        <div className="flex flex-col gap-[5px]">
          <Bar w={5} h={5} color="#22d3ee" anim="anim-twinkle" delay={0.2} />
          <Bar w={5} h={5} color="#22d3ee" anim="anim-twinkle" delay={0.9} />
        </div>
      </At>

      {/* ---------------- RIGHT HALF ---------------- */}

      {/* gold gear — idle bob */}
      <At at={at.gear} anim="anim-bob" delay={1.1} depth={0.75}>
        <PixelArt rows={GEAR} palette={GEAR_PALETTE} scale={2} />
      </At>

      {/* dark monolith / screen slab */}
      <At at={at.monolith} anim="anim-twinkle-slow" delay={1.4} depth={0.6}>
        <div
          style={{
            width: 24,
            height: 82,
            background: '#0d1c33',
            boxShadow: 'inset 0 0 0 1px rgba(34,211,238,0.15)',
          }}
        />
      </At>

      {/* bright green plumb line — VU pulse hanging from the top */}
      <At at={at.plumb} depth={0.55}>
        <Bar w={3} h={106} color="#39ff14" opacity={0.85} anim="anim-vu-down" delay={0.5} />
      </At>

      {/* teal dashes + green rule under the monolith — marquee cycle */}
      <At at={at.dashes} depth={0.5}>
        <div className="flex items-center gap-[4px]">
          <Bar w={5} h={4} color="#1e6f7a" glow={false} anim="anim-marquee" delay={0} />
          <Bar w={5} h={4} color="#1e6f7a" glow={false} anim="anim-marquee" delay={0.25} />
          <Bar w={5} h={4} color="#1e6f7a" glow={false} anim="anim-marquee" delay={0.5} />
          <Bar w={46} h={4} color="#39ff14" opacity={0.7} anim="anim-marquee" delay={0.75} />
        </div>
      </At>

      {/* orange + blue bar stack — staggered VU meter */}
      <At at={at.barStack} depth={0.65}>
        <div className="flex flex-col gap-[4px]">
          <Bar w={13} h={4} color="#39ff14" anim="anim-vu" delay={0} />
          <Bar w={13} h={6} color="#2f6fd0" anim="anim-vu" delay={0.3} />
          <Bar w={13} h={4} color="#2f6fd0" anim="anim-vu" delay={0.6} />
          <div className="mt-[6px] flex gap-[4px]">
            <Bar w={4} h={44} color="#2f6fd0" anim="anim-vu" delay={0.9} />
            <Bar w={4} h={44} color="#39ff14" anim="anim-vu" delay={1.2} />
          </div>
        </div>
      </At>

      {/* twinkling teal sparkle — same SPARKLE silhouette as the bottom-right one */}
      <At at={at.sparkleTeal} anim="anim-twinkle" delay={0.7} depth={0.7}>
        <PixelArt rows={SPARKLE} palette={SPARKLE_TEAL_PALETTE} scale={2.4} />
      </At>

      {/* right-edge telemetry bars — marquee cycle */}
      <At at={at.telemetry} depth={0.45}>
        <div className="flex flex-col gap-[6px]">
          <Bar w={131} h={5} color="#f97316" anim="anim-marquee" delay={0} />
          <Bar w={131} h={4} color="#2f6fd0" anim="anim-marquee" delay={0.35} />
          <div className="flex items-center gap-[6px]">
            <Bar w={54} h={4} color="#39ff14" anim="anim-marquee" delay={0.7} />
            <Bar w={5} h={4} color="#39ff14" anim="anim-marquee" delay={1.05} />
          </div>
          <Bar w={22} h={5} color="#b4652f" glow={false} anim="anim-marquee" delay={1.4} />
        </div>
      </At>

      {/* small filled orange square — VU pulse */}
      <At at={at.orangeSquare} depth={0.6}>
        <Bar w={11} h={16} color="#f97316" anim="anim-vu" delay={0.8} />
      </At>

      <At at={at.lowerBars} depth={0.5}>
        <div className="flex flex-col gap-[7px]">
          <Bar w={22} h={5} color="#b4652f" glow={false} anim="anim-marquee" delay={0.2} />
          <div className="flex gap-[9px]">
            <Bar w={40} h={5} color="#b4652f" glow={false} anim="anim-marquee" delay={0.5} />
            <Bar w={28} h={5} color="#b4652f" glow={false} anim="anim-marquee" delay={0.8} />
            <Bar w={40} h={5} color="#b4652f" glow={false} anim="anim-marquee" delay={1.1} />
          </div>
        </div>
      </At>

      {/* four-point sparkle, low and right — slow twinkle */}
      <At at={at.sparkle} anim="anim-twinkle-slow" delay={0.3} depth={1.3}>
        <PixelArt rows={SPARKLE} palette={SPARKLE_PALETTE} scale={3.5} />
      </At>

      {/* ---------------- TEXTURE DOTS ----------------
          Single pixels at low opacity, sprinkled across both halves. Delay and
          duration are derived from the index so no two twinkle together.

          These take the parallax on the SAME element as their animation —
          unlike the sprites above, which need the extra wrapper. `twinkle`
          animates opacity only, so there is no transform for it to clobber.

          Depth is derived from the index too (0.28-0.58), which scatters them
          through the near/far range instead of moving the whole speckle field
          as one flat sheet. */}
      {at.dots.map(([l, t, color], i) => {
        const depth = 0.28 + (i % 4) * 0.1
        return (
          <div
            key={`${l}-${t}`}
            className="anim-twinkle par absolute"
            style={{
              left: `${l}%`,
              top: `${t}%`,
              width: 4,
              height: 4,
              background: color,
              boxShadow: `0 0 4px ${color}`,
              animationDelay: `${((i * 0.43) % 3).toFixed(2)}s`,
              animationDuration: `${(1 + (i % 5) * 0.2).toFixed(1)}s`,
              '--par-x': `${(depth * SPRITE_X).toFixed(1)}px`,
              '--par-y': `${(depth * SPRITE_Y).toFixed(1)}px`,
            }}
          />
        )
      })}
    </div>
  )
}

export default PixelSprites

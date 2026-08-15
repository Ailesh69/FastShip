import StatCard from './StatCard'
import Reveal from '../motion/Reveal'
import { TreasureChest, HappyFace, StarCluster } from './PixelIcons'

// The centred hero block: title, subtitle, description, stat row.
//
// Each line arrives on its own beat rather than the block appearing at once —
// title, subtitle, copy, then the three stat boxes. The stagger is small (90ms)
// so the whole assembly is done in well under a second; it should read as the
// hero powering up, not as a queue.
//
// Reveal renders the SAME elements with the same classes (see motion/Reveal),
// so the layout, spacing and type here are untouched — only how they arrive.
//
// `revealWhen` is the home page's intro flag. The cinematic intro covers this
// content completely while it plays, and IntersectionObserver would happily
// fire behind it, so the reveal is held until the curtain is actually up.
const STEP = 90

function Hero({ revealWhen = true }) {
  return (
    <section className="relative z-10 flex flex-col items-center px-4 text-center">
      {/* Main title */}
      <Reveal
        as="h1"
        variant="rise"
        enabled={revealWhen}
        className="title-glow m-0 text-[72px] leading-none"
      >
        FASTSHIP
      </Reveal>

      {/* Subtitle */}
      <Reveal
        as="p"
        delay={STEP}
        enabled={revealWhen}
        className="gold-glow m-0 mt-[26px] text-[18px] leading-none"
      >
        THE RETRO E-COMMERCE ADVENTURE
      </Reveal>

      {/* Description */}
      <Reveal
        as="p"
        delay={STEP * 2}
        enabled={revealWhen}
        className="m-0 mt-[16px] max-w-[500px] text-[18px] leading-[1.5] text-fs-ink"
        style={{ fontFamily: 'var(--font-term)' }}
      >
        Your portal to curated pixel-perfect goods. Swift deliveries to your digital doorstep. Level
        up your shopping experience!
      </Reveal>

      {/* Stat row — each box carries its own rim colour, and each pops in
          behind the one to its left. */}
      <div className="mt-[22px] flex flex-wrap items-center justify-center gap-[20px]">
        <Reveal variant="pop" delay={STEP * 3} enabled={revealWhen}>
          <StatCard
            icon={<TreasureChest />}
            value="500+"
            label="PIXEL GOODS"
            rim="var(--color-fs-teal)"
          />
        </Reveal>
        <Reveal variant="pop" delay={STEP * 4} enabled={revealWhen}>
          <StatCard
            icon={<HappyFace scale={2.6} />}
            value="10K+"
            label="HAPPY SHOPPERS"
            rim="var(--color-fs-teal)"
          />
        </Reveal>
        <Reveal variant="pop" delay={STEP * 5} enabled={revealWhen}>
          <StatCard
            icon={<StarCluster />}
            value="1.2K+"
            label="5-STAR REVIEWS"
            rim="var(--color-fs-teal)"
          />
        </Reveal>
      </div>
    </section>
  )
}

export default Hero

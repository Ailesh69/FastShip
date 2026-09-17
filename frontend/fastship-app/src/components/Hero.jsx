import StatCard from './StatCard'
import Reveal from '../motion/Reveal'
import { TreasureChest, HappyFace, StarCluster } from './PixelIcons'

// Centred hero block: title, subtitle, description, stat row. Each piece
// arrives on its own 90ms beat (powering up, not a queue) via Reveal, which
// renders the same elements/classes — only arrival changes.
//
// `revealWhen`: home page's intro flag. Intro curtain covers this while
// playing, so reveal waits for it rather than firing behind it.
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

      {/* Stat row — each box has its own rim colour, pops in after the last */}
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

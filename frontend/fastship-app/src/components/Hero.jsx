import StatCard from './StatCard'
import { TreasureChest, HappyFace, StarCluster } from './PixelIcons'

// The centred hero block: title, subtitle, description, stat row.
function Hero() {
  return (
    <section className="relative z-10 flex flex-col items-center px-4 text-center">
      {/* Main title */}
      <h1 className="title-glow m-0 text-[72px] leading-none">FASTSHIP</h1>

      {/* Subtitle */}
      <p className="gold-glow m-0 mt-[26px] text-[18px] leading-none">
        THE RETRO E-COMMERCE ADVENTURE
      </p>

      {/* Description */}
      <p
        className="m-0 mt-[16px] max-w-[500px] text-[18px] leading-[1.5] text-fs-ink"
        style={{ fontFamily: 'var(--font-term)' }}
      >
        Your portal to curated pixel-perfect goods. Swift deliveries to your digital doorstep. Level
        up your shopping experience!
      </p>

      {/* Stat row — each box carries its own rim colour */}
      <div className="mt-[22px] flex flex-wrap items-center justify-center gap-[20px]">
        <StatCard
          icon={<TreasureChest />}
          value="500+"
          label="PIXEL GOODS"
          rim="var(--color-fs-teal)"
        />
        <StatCard
          icon={<HappyFace scale={2.6} />}
          value="10K+"
          label="HAPPY SHOPPERS"
          rim="var(--color-fs-teal)"
        />
        <StatCard
          icon={<StarCluster />}
          value="1.2K+"
          label="5-STAR REVIEWS"
          rim="var(--color-fs-teal)"
        />
      </div>
    </section>
  )
}

export default Hero

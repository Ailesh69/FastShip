import PathCard from '../components/PathCard'
import Reveal from '../motion/Reveal'
import useMagnetic from '../motion/useMagnetic'
import { ROLES } from '../config/roles'
import { useLoadingNav } from '../context/loadingNav'
import { TreasureChest, CargoShip, MarketStall } from '../components/PixelIcons'

// Account-select / sign-up path page.
// Order matters: three cards, then ALREADY REGISTERED?, then the SELECT YOUR
// PATH heading LAST — title sits below the cards, not above.
// Navbar/footer/background come from App.jsx's shared layout.
const PATHS = [
  {
    key: 'client',
    title: 'CUSTOMER',
    icon: <TreasureChest scale={9} />,
    lines: ['EXPLORE GOODS', 'MAKE PURCHASES', 'LEVEL UP YOUR INVENTORY'],
  },
  {
    key: 'partner',
    title: 'DELIVERY PARTNER',
    icon: <CargoShip scale={8} />,
    lines: ['DELIVER THE LOOT', 'SWIFT TRANSITS', 'COMPLETE QUESTS'],
  },
  {
    key: 'seller',
    title: 'SELLER',
    icon: <MarketStall scale={8} />,
    lines: ['STOCK YOUR GOODS', 'BUILD YOUR SHOP', 'GROW YOUR GUILD'],
  },
]

function SelectPath() {
  const { go } = useLoadingNav()
  const registered = useMagnetic({ strength: 5 })

  // routes via loading transition — drives the "ESTABLISHING <ROLE> DATA-LINK..." subtitle
  const choosePath = (key) => go(ROLES[key].signup)

  return (
    <section className="relative z-10 my-auto flex w-full flex-col items-center px-4">
      {/* cards deal left to right, 110ms apart, then button and title — matches reading order */}
      <div className="flex flex-wrap items-stretch justify-center gap-[56px]">
        {PATHS.map((p, i) => (
          // flex keeps the reveal wrapper transparent so items-stretch's height passes through to the card
          <Reveal key={p.key} variant="pop" delay={i * 110} className="flex">
            <PathCard
              title={p.title}
              icon={p.icon}
              lines={p.lines}
              onSelect={() => choosePath(p.key)}
            />
          </Reveal>
        ))}
      </div>

      {/* wrapper carries the mt-[24px], not the button — button's margin would land inside the wrapper */}
      <Reveal delay={380} className="mt-[24px]">
        <button
          ref={registered}
          type="button"
          onClick={() => go('/login')}
          className="teal-outline-box mag cursor-pointer rounded-[4px] px-[20px] py-[18px] font-[inherit] text-[14px] leading-none"
        >
          ALREADY REGISTERED?
        </button>
      </Reveal>

      {/* title deliberately below cards/button; as="h1" keeps it the real <h1>, no wrapper */}
      <Reveal as="h1" delay={470} className="m-0 mt-[16px] text-[22px] leading-none text-fs-green"
        style={{ textShadow: '0 0 10px rgba(125,232,126,0.9), 0 0 26px rgba(125,232,126,0.5)' }}
      >
        SELECT YOUR PATH
      </Reveal>
    </section>
  )
}

export default SelectPath

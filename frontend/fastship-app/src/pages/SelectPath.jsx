import PathCard from '../components/PathCard'
import Reveal from '../motion/Reveal'
import useMagnetic from '../motion/useMagnetic'
import { ROLES } from '../config/roles'
import { useLoadingNav } from '../context/loadingNav'
import { TreasureChest, CargoShip, MarketStall } from '../components/PixelIcons'

// Account-select / sign-up path page.
//
// Layout order matches the reference exactly: the three cards, then the
// ALREADY REGISTERED? button, and the SELECT YOUR PATH heading LAST — the
// title sits below the cards, not above them.
//
// The navbar, footer, grid background and sprite field all come from the
// shared layout in App.jsx, so this file only owns the page's own content.
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

  // Each path routes to its own sign-up screen, via the loading transition —
  // which is what drives the "ESTABLISHING <ROLE> DATA-LINK..." subtitle.
  const choosePath = (key) => go(ROLES[key].signup)

  return (
    <section className="relative z-10 my-auto flex w-full flex-col items-center px-4">
      {/* Three path cards. They deal in left to right, 110ms apart, then the
          button and the title below them — the same order the eye reads the
          screen in. */}
      <div className="flex flex-wrap items-stretch justify-center gap-[56px]">
        {PATHS.map((p, i) => (
          // `className="flex"` keeps the reveal wrapper transparent to layout:
          // the wrapper is now the flex item that `items-stretch` above
          // stretches, so it has to pass that height on to the card inside it.
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

      {/* Returning users — opens the shared login overlay.
          The wrapper takes the button's `mt-[24px]`, because the wrapper is
          what now sits in the column: leaving the margin on the button would
          have added it INSIDE the wrapper and pushed the spacing out. */}
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

      {/* Page title, deliberately BELOW the cards and button. `as="h1"` means
          this IS the same <h1> with the same classes — no wrapper, no change
          to its box. */}
      <Reveal as="h1" delay={470} className="m-0 mt-[16px] text-[22px] leading-none text-fs-green"
        style={{ textShadow: '0 0 10px rgba(125,232,126,0.9), 0 0 26px rgba(125,232,126,0.5)' }}
      >
        SELECT YOUR PATH
      </Reveal>
    </section>
  )
}

export default SelectPath

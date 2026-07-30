import PathCard from '../components/PathCard'
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

  // Each path routes to its own sign-up screen, via the loading transition —
  // which is what drives the "ESTABLISHING <ROLE> DATA-LINK..." subtitle.
  const choosePath = (key) => go(ROLES[key].signup)

  return (
    <section className="relative z-10 my-auto flex w-full flex-col items-center px-4">
      {/* Three path cards */}
      <div className="flex flex-wrap items-stretch justify-center gap-[56px]">
        {PATHS.map((p) => (
          <PathCard
            key={p.key}
            title={p.title}
            icon={p.icon}
            lines={p.lines}
            onSelect={() => choosePath(p.key)}
          />
        ))}
      </div>

      {/* Returning users — opens the shared login overlay */}
      <button
        type="button"
        onClick={() => go('/login')}
        className="teal-outline-box mt-[24px] cursor-pointer rounded-[4px] px-[20px] py-[18px] font-[inherit] text-[14px] leading-none"
      >
        ALREADY REGISTERED?
      </button>

      {/* Page title, deliberately BELOW the cards and button */}
      <h1
        className="m-0 mt-[16px] text-[22px] leading-none text-fs-green"
        style={{ textShadow: '0 0 10px rgba(125,232,126,0.9), 0 0 26px rgba(125,232,126,0.5)' }}
      >
        SELECT YOUR PATH
      </h1>
    </section>
  )
}

export default SelectPath

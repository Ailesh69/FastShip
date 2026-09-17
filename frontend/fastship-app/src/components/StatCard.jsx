import useTilt from '../motion/useTilt'

// One notched stat box, e.g. "500+ / PIXEL GOODS". `rim` = border/glow color
// per box. Diagonal-cut corners (.notch-box/.cut-corners), nothing rounded.
//
// Tilts+lifts toward cursor; ref on .notch-box itself, no wrapper. Small
// tilt numbers on purpose — should feel solid/machined, not floaty.
function StatCard({ icon, value, label, rim }) {
  const tilt = useTilt({ max: 6, lift: 10 })

  return (
    <div ref={tilt} className="notch-box cut-corners tilt w-[222px]" style={{ '--rim': rim }}>
      <div className="cut-corners flex h-[72px] items-center gap-[10px] px-[12px]">
        <div className="flex w-[52px] shrink-0 items-center justify-center">{icon}</div>
        <div className="text-left">
          <div className="white-glow text-[20px] leading-none">{value}</div>
          <div className="mt-[7px] whitespace-nowrap text-[9px] leading-none text-white">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatCard

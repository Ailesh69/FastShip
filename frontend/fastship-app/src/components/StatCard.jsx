import useTilt from '../motion/useTilt'

// One notched stat box, e.g. "500+ / PIXEL GOODS".
//
// `rim` is the border + glow colour, so each box in the row can carry its own
// theme. Corners are cut on the diagonal (see .notch-box / .cut-corners in
// index.css) — nothing here is soft-rounded.
//
// The box tilts a little toward the cursor and lifts toward the viewer. The
// ref goes on the .notch-box itself, so no wrapper is introduced and the box
// is pixel-identical to before whenever it is not being pointed at. Small
// numbers on purpose: this is a stat readout, not a toy — it should feel
// solid and machined, not floaty.
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

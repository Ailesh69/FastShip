// One notched stat box, e.g. "500+ / PIXEL GOODS".
//
// `rim` is the border + glow colour, so each box in the row can carry its own
// theme. Corners are cut on the diagonal (see .notch-box / .cut-corners in
// index.css) — nothing here is soft-rounded.
function StatCard({ icon, value, label, rim }) {
  return (
    <div className="notch-box cut-corners w-[222px]" style={{ '--rim': rim }}>
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

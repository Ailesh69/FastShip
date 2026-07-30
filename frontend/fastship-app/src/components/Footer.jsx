// Bottom footer: a divider rule on each side of the row, then the left-aligned
// ABOUT ME link and the copyright line.
function Footer() {
  const rule = {
    height: 3,
    background: 'var(--color-fs-rule)',
    boxShadow: '0 0 6px rgba(59,130,246,0.6)',
  }

  return (
    <footer className="relative z-10 shrink-0 px-4 pb-4">
      {/* mirrored divider rules */}
      <div className="mb-[18px] flex items-center justify-between">
        <div style={{ ...rule, width: '23.5%' }} />
        <div style={{ ...rule, width: '21%' }} />
      </div>

      <div className="text-left">
        <div className="text-[10px] leading-none text-white">ABOUT ME</div>
        <div
          className="mt-[15px] text-[16px] leading-none text-white/70"
          style={{ fontFamily: 'var(--font-term)' }}
        >
          © Copyright - All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer

// Shared 8-bit sprite renderer.
//
// A sprite is an array of equal-length strings — one character per pixel — plus
// a `palette` mapping each character to a color ('.' means transparent.)
// <PixelArt> turns that grid into a crisp <svg> of 1x1 rects, so there are no
// image files to ship and no anti-aliasing anywhere.
//
// `outline` draws a hard 1px offset copy underneath (the dark edge that makes
// 8-bit sprites pop) — it is a filter, so it follows the sprite silhouette.
function PixelArt({ rows, palette, scale = 3, outline, className = '', style }) {
  const w = rows[0].length
  const h = rows.length

  // Merge horizontally-adjacent pixels of the same color into one rect. Keeps
  // the DOM small for the bigger sprites without changing a single pixel.
  const rects = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = palette[row[x]]
      if (!color) {
        x++
        continue
      }
      let run = 1
      while (x + run < row.length && palette[row[x + run]] === color) run++
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={color} />)
      x += run
    }
  })

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      className={`pixelated ${className}`}
      aria-hidden="true"
      style={{
        display: 'block',
        filter: outline ? `drop-shadow(${scale}px ${scale}px 0 ${outline})` : undefined,
        ...style,
      }}
    >
      {rects}
    </svg>
  )
}

export default PixelArt

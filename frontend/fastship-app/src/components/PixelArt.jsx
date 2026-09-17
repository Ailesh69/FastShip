// Shared 8-bit sprite renderer. Sprite = array of equal-length strings (one
// char per pixel) + `palette` mapping char -> color ('.' = transparent).
// Renders as crisp <svg> of 1x1 rects — no image files, no anti-aliasing.
//
// `outline`: hard 1px offset copy underneath, via filter so it follows silhouette.
function PixelArt({ rows, palette, scale = 3, outline, className = '', style }) {
  const w = rows[0].length
  const h = rows.length

  // Merge adjacent same-color pixels into one rect — keeps DOM small.
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

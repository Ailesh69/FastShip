// Shared pixel-art grids reused by more than one component (PixelSprites,
// PixelIcons, WarpOverlay). Kept in its own plain module — not a component —
// so importers stay eligible for fast refresh.

export const SPARKLE = [
  '.......S.......',
  '.......S.......',
  '......SSS......',
  '......SSS......',
  '.....SSSSS.....',
  '....SSSSSSS....',
  '..SSSSSSSSSSS..',
  'SSSSSSSSSSSSSSS',
  '..SSSSSSSSSSS..',
  '....SSSSSSS....',
  '.....SSSSS.....',
  '......SSS......',
  '......SSS......',
  '.......S.......',
  '.......S.......',
]
export const SPARKLE_PALETTE = { S: '#8b8fa8' } // bottom-right: muted lavender
export const SPARKLE_TEAL_PALETTE = { S: '#22d3ee' } // right-hand grid: teal, matches its neighbours

export const STAR = [
  '....Y....',
  '....Y....',
  '...YYY...',
  'YYYYYYYYY',
  '.YYYYYYY.',
  '..YYYYY..',
  '..YYYYY..',
  '.YY...YY.',
  '.Y.....Y.',
]
export const STAR_PALETTE = { Y: '#fbbf24' }

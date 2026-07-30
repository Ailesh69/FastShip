import PixelArt from './PixelArt'

// The three stat-card sprites, drawn pixel-by-pixel to match the reference art.

/* ---------------- 500+ PIXEL GOODS: gold-banded treasure chest ---------------- */
const CHEST = [
  '...............',
  '..GGGGGGGGGGG..',
  '.GWWWWWWWWWWWG.',
  '.GWWWWWWWWWWWG.',
  '.GWWWWWWWWWWWG.',
  '.GGGGGGGGGGGGG.',
  '.GGWWWLLLWWWGG.',
  '.GGWWWLKLWWWGG.',
  '.GGWWWLLLWWWGG.',
  '.GGWWWWWWWWWGG.',
  '.GGWWWWWWWWWGG.',
  '.GGGGGGGGGGGGG.',
  '..GGGGGGGGGGG..',
  '...............',
]
const CHEST_PALETTE = {
  G: '#f0b429', // gold banding
  W: '#8a4f27', // wood
  L: '#fbbf24', // padlock
  K: '#2a1608', // keyhole
}

export function TreasureChest({ scale = 3 }) {
  return (
    <div className="anim-bob">
      <PixelArt rows={CHEST} palette={CHEST_PALETTE} scale={scale} outline="#2a1608" />
    </div>
  )
}

/* ---------------- 10K+ HAPPY SHOPPERS: grinning shopper ---------------- */
const FACE = [
  '.....HHHHH.....',
  '...HHHHHHHHH...',
  '..HHHHHHHHHHH..',
  '..HHHHHHHHHHH..',
  '..HHSSSSSSSHH..',
  '..HSSSSSSSSSH..',
  '..SSSSSSSSSSS..',
  '.SSSSSSSSSSSSS.',
  '.SSEESSSSSEESS.',
  '.SSSSSSSSSSSSS.',
  '.SSSSSSSSSSSSS.',
  '.SSSTTTTTTTSSS.',
  '.SSSKKKKKKKSSS.',
  '..SSSSSSSSSSS..',
  '...SSSSSSSSS...',
  '.....SSSSS.....',
  '..BBBBBBBBBBB..',
  '.BBBBBBBBBBBBB.',
]
const FACE_PALETTE = {
  H: '#5b3a1e', // hair
  S: '#f3cfa2', // skin
  E: '#2a1a10', // eyes
  T: '#ffffff', // teeth
  K: '#3b1f1a', // open mouth
  B: '#22b8e0', // shirt
}

export function HappyFace({ scale = 3 }) {
  return (
    <div className="anim-bob" style={{ animationDelay: '0.9s' }}>
      <PixelArt rows={FACE} palette={FACE_PALETTE} scale={scale} outline="#1b1008" />
    </div>
  )
}

/* ---------------- FORM FIELD GLYPHS ----------------
   Small 12x12 sprites for the sign-up inputs. Rendered at scale 2 (24px),
   which keeps them on whole pixels. */

// Two avatar heads for the username field — female (long hair framing the jaw)
// and male (short hair). They're kept as SEPARATE sprites with a real gap
// between them, since the pair reads as a gender choice rather than one glyph.
const FEMALE_HEAD = [
  '.FFFFF.',
  'FFFFFFF',
  'FFSSSFF',
  'FSSSSSF',
  'FSESESF',
  'FSSSSSF',
  'FSSMSSF',
  'FSSSSSF',
  'F.SSS.F',
  'BBBBBBB',
  'BBBBBBB',
]

const MALE_HEAD = [
  '.HHHHH.',
  'HHHHHHH',
  '.SSSSS.',
  '.SSSSS.',
  '.SESES.',
  '.SSSSS.',
  '.SSMSS.',
  '.SSSSS.',
  '..SSS..',
  '.BBBBB.',
  'BBBBBBB',
]

const USER_PALETTE = {
  F: '#a8532c', // female hair (auburn)
  H: '#7a4a24', // male hair (brown)
  S: '#f3cfa2', // skin
  E: '#2a1a10', // eyes
  M: '#a83e2e', // mouth
  B: '#22b8e0', // shoulders
}

export function UserIcon({ scale = 2 }) {
  return (
    <span className="flex items-end gap-[6px]">
      <PixelArt rows={FEMALE_HEAD} palette={USER_PALETTE} scale={scale} />
      <PixelArt rows={MALE_HEAD} palette={USER_PALETTE} scale={scale} />
    </span>
  )
}

// Single mint silhouette — the delivery partner's NAME field. Distinct from the
// dual-head UserIcon, which is the customer form's gender pair.
const PERSON = [
  '............',
  '....PPPP....',
  '...PPPPPP...',
  '...PPPPPP...',
  '....PPPP....',
  '............',
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  '............',
]
const PERSON_PALETTE = { P: '#8fd98f' }

export function PersonIcon({ scale = 2 }) {
  return <PixelArt rows={PERSON} palette={PERSON_PALETTE} scale={scale} />
}

// Single map pin — BASE ZIP CODE.
const PIN = [
  '............',
  '...RRRRRR...',
  '..RRRRRRRR..',
  '..RRRWWRRR..',
  '..RRRWWRRR..',
  '..RRRRRRRR..',
  '...RRRRRR...',
  '....RRRR....',
  '.....RR.....',
  '.....RR.....',
  '............',
  '............',
]
const PIN_PALETTE = {
  R: '#d63b3b', // pin body
  W: '#ffe9e9', // centre bead
}

export function PinIcon({ scale = 2 }) {
  return <PixelArt rows={PIN} palette={PIN_PALETTE} scale={scale} />
}

// Stacked crates — MAX HANDLING CAPACITY.
const BOX = [
  '............',
  '.KKKK..KKKK.',
  '.KCTK..KTCK.',
  '.KKKK..KKKK.',
  'KKKKKKKKKKKK',
  'KCCCCTTCCCCK',
  'KCCCCTTCCCCK',
  'KCCCCTTCCCCK',
  'KKKKKKKKKKKK',
  '............',
  '............',
  '............',
]
const BOX_PALETTE = {
  K: '#5a3a18', // crate outline — keeps the three boxes visually separate
  C: '#c8975a', // cardboard
  T: '#8a5f30', // tape
}

export function BoxIcon({ scale = 2 }) {
  return <PixelArt rows={BOX} palette={BOX_PALETTE} scale={scale} />
}

// Four pins wired together — SERVICEABLE ZIP CODES. Deliberately a cluster so
// it never reads as the single BASE ZIP CODE pin.
const PIN_CLUSTER = [
  'RR........RR',
  'RR........RR',
  '..X......X..',
  '...X....X...',
  '....X..X....',
  '.....XX.....',
  '.....XX.....',
  '....X..X....',
  '...X....X...',
  '..X......X..',
  'RR........RR',
  'RR........RR',
]
const PIN_CLUSTER_PALETTE = {
  R: '#e2703a', // outlying pins
  X: '#4ec3d9', // coverage links
}

export function PinClusterIcon({ scale = 2 }) {
  return <PixelArt rows={PIN_CLUSTER} palette={PIN_CLUSTER_PALETTE} scale={scale} />
}

/* ---------------- DASHBOARD STATUS GLYPHS ---------------- */

// Delivered — pixel checkmark.
const CHECK = [
  '..........',
  '........GG',
  '.......GG.',
  '......GG..',
  'G....GG...',
  'GG..GG....',
  '.GGGG.....',
  '..GG......',
  '..........',
  '..........',
]
const CHECK_PALETTE = { G: '#7de87e' }

export function PixelCheck({ scale = 2 }) {
  return <PixelArt rows={CHECK} palette={CHECK_PALETTE} scale={scale} />
}

// Placed — clipboard / manifest.
const CLIPBOARD = [
  '............',
  '....CCCC....',
  '...CWWWWC...',
  '.KKKKKKKKKK.',
  '.KWWWWWWWWK.',
  '.KWKKKKKKWK.',
  '.KWWWWWWWWK.',
  '.KWKKKKKKWK.',
  '.KWWWWWWWWK.',
  '.KWKKKKWWWK.',
  '.KKKKKKKKKK.',
  '............',
]
const CLIPBOARD_PALETTE = {
  K: '#2b3a4a', // board edge + ruled lines
  W: '#cfe0ef', // paper
  C: '#8fa3b8', // clip
}

export function PixelClipboard({ scale = 2 }) {
  return <PixelArt rows={CLIPBOARD} palette={CLIPBOARD_PALETTE} scale={scale} />
}

// Out for delivery — scooter with motion streaks, deliberately distinct from
// the box van used for in_transit.
const SCOOTER = [
  '..............',
  '.......KKK....',
  '.......KWK....',
  '....KKKKKK....',
  'M..KWWWWWWK...',
  'MM.KWWWWWWK...',
  'M..KKKKKKKK...',
  '...OO...OO....',
  '...OO...OO....',
  '..............',
]
const SCOOTER_PALETTE = {
  K: '#1b2733', // outline
  W: '#4ec3d9', // body
  O: '#2f3b4d', // wheels
  M: '#7de87e', // motion streaks
}

export function PixelScooter({ scale = 2 }) {
  return <PixelArt rows={SCOOTER} palette={SCOOTER_PALETTE} scale={scale} />
}

// Cancelled — X.
const CROSS = [
  '..........',
  '.RR....RR.',
  '.RRR..RRR.',
  '..RRRRRR..',
  '...RRRR...',
  '...RRRR...',
  '..RRRRRR..',
  '.RRR..RRR.',
  '.RR....RR.',
  '..........',
]
const CROSS_PALETTE = { R: '#ff6b4a' }

export function PixelCross({ scale = 2 }) {
  return <PixelArt rows={CROSS} palette={CROSS_PALETTE} scale={scale} />
}

// Pending — hourglass, same chunky outline treatment as the check and truck.
const HOURGLASS = [
  '............',
  '.KKKKKKKKKK.',
  '.KSSSSSSSSK.',
  '..KSSSSSSK..',
  '...KSSSSK...',
  '....KSSK....',
  '....KSSK....',
  '...K....K...',
  '..K.SSSS.K..',
  '.K.SSSSSS.K.',
  '.KKKKKKKKKK.',
  '............',
]
const HOURGLASS_PALETTE = {
  K: '#8a6a1a', // brass frame
  S: '#fbbf24', // sand
}

export function PixelHourglass({ scale = 2 }) {
  return <PixelArt rows={HOURGLASS} palette={HOURGLASS_PALETTE} scale={scale} />
}

// In Transit — box van, drawn in the same slate/white/teal palette family as
// the CargoShip sprite on the account-select page.
const TRUCK = [
  '..............',
  '.KKKKKKKK.....',
  '.KWWWWWWK.KKKK',
  '.KWWWWWWK.KTTK',
  '.KWWWWWWKKKTTK',
  '.KWWWWWWKKKKKK',
  '.KKKKKKKKKKKKK',
  '..OO.....OO...',
  '..OO.....OO...',
  '..............',
]
const TRUCK_PALETTE = {
  K: '#1b2733', // outline
  W: '#dfe7ef', // cargo body
  T: '#4ec3d9', // cab window
  O: '#2f3b4d', // wheels
}

export function DeliveryTruck({ scale = 2 }) {
  return <PixelArt rows={TRUCK} palette={TRUCK_PALETTE} scale={scale} />
}

const MAIL = [
  '............',
  '............',
  '.EEEEEEEEEE.',
  '.EWWWWWWWWE.',
  '.EDWWWWWWDE.',
  '.EWDWWWWDWE.',
  '.EWWDWWDWWE.',
  '.EWWWDDWWWE.',
  '.EWWWWWWWWE.',
  '.EEEEEEEEEE.',
  '............',
  '............',
]
const MAIL_PALETTE = {
  E: '#2f6f6a', // envelope edge
  W: '#e8eef5', // paper
  D: '#7fb3ad', // fold crease
}

export function MailIcon({ scale = 2 }) {
  return <PixelArt rows={MAIL} palette={MAIL_PALETTE} scale={scale} />
}

const LOCK = [
  '............',
  '....KKKK....',
  '...K....K...',
  '...K....K...',
  '...K....K...',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '..GGGHHGGG..',
  '..GGGHHGGG..',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '............',
]
const LOCK_PALETTE = {
  K: '#8fe0b4', // shackle — light enough to read against the dark field well
  G: '#4fae7a', // body
  H: '#12201a', // keyhole
}

export function LockIcon({ scale = 2 }) {
  return <PixelArt rows={LOCK} palette={LOCK_PALETTE} scale={scale} />
}

/* ---------------- DELIVERY PARTNER: container ship ----------------
   White bridge with lit windows, a deck of coloured containers, slate hull
   and a red waterline. */
const SHIP = [
  '..K..K............',
  '..K..K............',
  '.KWWWWK...........',
  '.KWTWTK...........',
  '.KWWWWK...........',
  '.KWTWTK.GGG.OOO...',
  '.KWWWWK.GGG.OOO.BB',
  '.KWWWWK.RRR.GGG.BB',
  'KKKKKKKKKKKKKKKKK.',
  '.HHHHHHHHHHHHHHHH.',
  '.HHHHHHHHHHHHHHHH.',
  '.DDDDDDDDDDDDDDD..',
  '..SSSSSSSSSSSSSS..',
  '...KKKKKKKKKKKK...',
]
const SHIP_PALETTE = {
  K: '#141d2a', // outline / deck line
  W: '#dfe7ef', // bridge
  T: '#4ec3d9', // lit windows
  G: '#3fa34d', // green container
  O: '#e2703a', // orange container
  R: '#c8342b', // red container
  B: '#4a7fb5', // blue container
  H: '#4a5a72', // hull
  D: '#333f52', // hull shadow
  S: '#c0392b', // waterline
}

export function CargoShip({ scale = 6 }) {
  return (
    <div className="anim-bob" style={{ animationDelay: '0.5s' }}>
      <PixelArt rows={SHIP} palette={SHIP_PALETTE} scale={scale} outline="#0a1018" />
    </div>
  )
}

/* ---------------- SELLER: market stall ----------------
   Red-and-white striped awning over a timber frame, with stacked crates and
   a produce basket underneath. */
const STALL = [
  'KKKKKKKKKKKKKKKK',
  'KNNNNNNNNNNNNNNK',
  'KRRWWRRWWRRWWRRK',
  'KRRWWRRWWRRWWRRK',
  'KKRWWRRWWRRWWRKK',
  '.KNDDDDDDDDDDNK.',
  '.KNDDDDDDDDDDNK.',
  '.KNDDDDDDDDDDNK.',
  '.KNDDCCCCCCDDNK.',
  '.KNDDCEECCEDDNK.',
  '.KNDCCCCCCCCDNK.',
  '.KNDCCCCCCCCDNK.',
  '.KNDCCCCCCCCAANK',
  '.KNDCCCCCCCCAANK',
  '.KKKKKKKKKKKKKK.',
  '................',
]
const STALL_PALETTE = {
  K: '#231a12', // outline
  N: '#7a4a24', // timber posts + head beam
  R: '#c0392b', // awning red
  W: '#e8e8e8', // awning white
  D: '#242a40', // stall interior
  C: '#a9713c', // crate
  E: '#7a4a24', // crate banding
  A: '#d94f3d', // produce
}

export function MarketStall({ scale = 6 }) {
  return (
    <div className="anim-bob" style={{ animationDelay: '1.1s' }}>
      <PixelArt rows={STALL} palette={STALL_PALETTE} scale={scale} outline="#120c08" />
    </div>
  )
}

/* ---------------- 1.2K+ 5-STAR REVIEWS: five-star cluster ----------------
   Three stars across the top (the middle one larger) and two tucked beneath,
   exactly as they sit in the reference. */
const STAR = [
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
const STAR_PALETTE = { Y: '#fbbf24' }

// Each star twinkles on its own clock so the cluster shimmers rather than
// pulsing as one block.
function Star({ scale, left, top, delay }) {
  return (
    <div
      className="anim-twinkle-slow absolute"
      style={{ left, top, animationDelay: `${delay}s` }}
    >
      <PixelArt rows={STAR} palette={STAR_PALETTE} scale={scale} outline="#7c4a03" />
    </div>
  )
}

export function StarCluster() {
  return (
    <div className="relative h-[40px] w-[52px]">
      <Star scale={2} left={0} top={5} delay={0} />
      <Star scale={2.8} left={15} top={0} delay={0.3} />
      <Star scale={2} left={37} top={6} delay={0.6} />
      <Star scale={2} left={6} top={21} delay={0.9} />
      <Star scale={2} left={26} top={23} delay={1.2} />
    </div>
  )
}

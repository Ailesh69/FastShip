import {
  DeliveryTruck,
  PixelCheck,
  PixelClipboard,
  PixelCross,
  PixelScooter,
} from './PixelIcons'

// Shipment vocabulary and read helpers, shared by every page that renders a
// shipment so a status's icon, label, latest state and date format can never
// diverge between them. Constants and pure functions only — the badge
// component lives in StatusBadge.jsx so each file exports one kind of thing.
export const SHIPMENT_STATUS = {
  placed: { label: 'PLACED', Icon: PixelClipboard, tone: '#cfe0ef' },
  in_transit: { label: 'IN TRANSIT', Icon: DeliveryTruck, tone: '#dfe7ef' },
  out_for_delivery: { label: 'OUT FOR DELIVERY', Icon: PixelScooter, tone: '#4ec3d9' },
  delivered: { label: 'DELIVERED', Icon: PixelCheck, tone: '#7de87e' },
  cancelled: { label: 'CANCELLED', Icon: PixelCross, tone: '#ff6b4a' },
}

// Statuses a partner may set. "placed" is excluded — it is the pre-partner
// state and is never something a partner transitions a shipment back into.
export const PARTNER_SETTABLE = ['in_transit', 'out_for_delivery', 'delivered', 'cancelled']

// The API returns timeline events unordered (the relationship carries no
// ORDER BY), so anything that reads "the latest event" has to sort first.
export function sortedTimeline(shipment) {
  return [...(shipment?.timeline ?? [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  )
}

// A shipment's live status is the status of its most recent timeline event —
// that is what the backend's own tracking page renders, and what a cancel or a
// partner update actually writes. The `status` column on the shipment row is
// only a fallback for a record that somehow has no events yet.
export function latestStatus(shipment) {
  const timeline = sortedTimeline(shipment)
  return timeline.length ? timeline[timeline.length - 1].status : (shipment?.status ?? null)
}

// Long UUIDs are unreadable in a table cell; the full id still drives routes,
// tooltips and requests.
export const shortId = (id) => (id ? String(id).split('-')[0].toUpperCase() : '')

// estimated_delivery is a full ISO datetime, but the tables only have room for
// a short date.
export function formatEta(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

// Timeline entries get the date AND the time — two scans on the same day are
// common and otherwise indistinguishable.
export function formatEventTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d
    .toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .toUpperCase()
}

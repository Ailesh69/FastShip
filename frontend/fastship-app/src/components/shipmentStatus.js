import {
  DeliveryTruck,
  PixelCheck,
  PixelClipboard,
  PixelCross,
  PixelScooter,
} from './PixelIcons'

// Shipment vocabulary + read helpers, shared everywhere a shipment renders.
// Constants/pure functions only — badge component lives in StatusBadge.jsx.
export const SHIPMENT_STATUS = {
  placed: { label: 'PLACED', Icon: PixelClipboard, tone: '#cfe0ef' },
  in_transit: { label: 'IN TRANSIT', Icon: DeliveryTruck, tone: '#dfe7ef' },
  out_for_delivery: { label: 'OUT FOR DELIVERY', Icon: PixelScooter, tone: '#4ec3d9' },
  delivered: { label: 'DELIVERED', Icon: PixelCheck, tone: '#7de87e' },
  cancelled: { label: 'CANCELLED', Icon: PixelCross, tone: '#ff6b4a' },
}

// "placed" excluded — pre-partner state, never transitioned back into.
export const PARTNER_SETTABLE = ['in_transit', 'out_for_delivery', 'delivered', 'cancelled']

// API returns timeline events unordered — sort before reading "latest".
export function sortedTimeline(shipment) {
  return [...(shipment?.timeline ?? [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  )
}

// Live status = most recent timeline event's status (what cancel/partner
// updates actually write). `status` column is just a fallback for no events.
export function latestStatus(shipment) {
  const timeline = sortedTimeline(shipment)
  return timeline.length ? timeline[timeline.length - 1].status : (shipment?.status ?? null)
}

// Full UUID is unreadable in a table cell; routes/tooltips/requests use the full id.
export const shortId = (id) => (id ? String(id).split('-')[0].toUpperCase() : '')

// estimated_delivery is a full ISO datetime; tables only have room for a short date.
export function formatEta(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

// Include time, not just date — same-day scans are common and otherwise indistinguishable.
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

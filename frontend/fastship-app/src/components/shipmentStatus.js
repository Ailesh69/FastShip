import {
  DeliveryTruck,
  PixelCheck,
  PixelClipboard,
  PixelCross,
  PixelScooter,
} from './PixelIcons'

// The five REAL shipment states, shared by the partner dashboard and the
// update-shipment screen so a status's icon and label can never diverge
// between the two pages. Constants only — the badge component lives in
// StatusBadge.jsx so each file exports one kind of thing.
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

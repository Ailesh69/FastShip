import { SHIPMENT_STATUS } from './shipmentStatus'

// Icon + label pair, used inline in table cells, the read-only context header
// and the timeline.
function StatusBadge({ status, className = '' }) {
  const meta = SHIPMENT_STATUS[status]
  if (!meta) return <span className={className}>{status}</span>
  const { Icon, label, tone } = meta
  return (
    <span className={className} style={{ color: tone }}>
      <Icon />
      {label}
    </span>
  )
}

export default StatusBadge

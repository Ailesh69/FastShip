import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PARTNER_SETTABLE, SHIPMENT_STATUS } from '../components/shipmentStatus'
import StatusBadge from '../components/StatusBadge'
import s from './UpdateShipment.module.css'

// DELIVERY PARTNER — update a shipment's status.
//
// UI only. The ?id= query param is read straight off the URL for display; no
// fetch happens — MOCK_SHIPMENT stands in for the record that will be loaded
// later, and MOCK_TIMELINE previews the event log's shape.

const MOCK_SHIPMENT = {
  id: 'c9a2b7d3-1e88-4f60-b5aa-77d2e4c10b42',
  content: 'GLASSWARE',
  destination: '94105',
  status: 'out_for_delivery',
}

const MOCK_TIMELINE = [
  {
    status: 'placed',
    location: '10001',
    description: 'Order received and manifest generated.',
    date: '2026-07-21 09:14',
  },
  {
    status: 'in_transit',
    location: '30301',
    description: 'Departed origin hub. Handed to line haul.',
    date: '2026-07-22 17:40',
  },
  {
    status: 'in_transit',
    location: '73301',
    description: 'Arrived at regional sort facility.',
    date: '2026-07-23 06:05',
  },
  {
    status: 'out_for_delivery',
    location: '94105',
    description: 'Loaded onto delivery vehicle for final leg.',
    date: '2026-07-24 07:52',
  },
]

const shortId = (id) => id.split('-')[0].toUpperCase()

function UpdateShipment() {
  const [params] = useSearchParams()
  // Read-only: the id from the URL, falling back to the mock record's own id.
  const shipmentId = params.get('id') || MOCK_SHIPMENT.id

  const [form, setForm] = useState({
    status: MOCK_SHIPMENT.status,
    location: '',
    description: '',
    estimatedDelivery: '',
    otp: '',
  })
  const [saved, setSaved] = useState(false)

  // OTP is only relevant when the partner marks the parcel Delivered.
  const needsOtp = form.status === 'delivered'

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // UI-only build — nothing is sent anywhere.
    const payload = { id: shipmentId, ...form }
    if (!needsOtp) delete payload.otp
    console.log('Shipment update (not sent):', payload)
    setSaved(true)
  }

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      <h1 className="title-glow-clean m-0 text-center text-[20px] leading-none">
        UPDATE SHIPMENT - {shortId(shipmentId)}
      </h1>

      <form onSubmit={handleSubmit} noValidate className={`${s.panel} cut-corners mx-auto mt-[26px]`}>
        {/* Read-only context */}
        <h2 className={s.sectionHead}>[SHIPMENT]</h2>
        <div className={s.context}>
          <div className={s.ctxCell}>
            <span className={s.ctxLabel}>SHIPMENT ID</span>
            <span className={s.ctxValue}>{shipmentId}</span>
          </div>
          <div className={s.ctxCell}>
            <span className={s.ctxLabel}>CONTENT</span>
            <span className={s.ctxValue}>{MOCK_SHIPMENT.content}</span>
          </div>
          <div className={s.ctxCell}>
            <span className={s.ctxLabel}>CURRENT STATUS</span>
            <StatusBadge status={MOCK_SHIPMENT.status} className={s.ctxStatus} />
          </div>
          <div className={s.ctxCell}>
            <span className={s.ctxLabel}>DESTINATION</span>
            <span className={s.ctxValue}>{MOCK_SHIPMENT.destination}</span>
          </div>
        </div>

        {/* Editable fields */}
        <h2 className={s.sectionHead}>[UPDATE]</h2>
        <div className={s.rows}>
          <label className={s.row}>
            <span className={s.label}>STATUS:</span>
            <span className={`${s.well} cut-corners`}>
              <select className={s.select} value={form.status} onChange={set('status')}>
                {PARTNER_SETTABLE.map((key) => (
                  <option key={key} value={key}>
                    {SHIPMENT_STATUS[key].label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className={s.row}>
            <span className={s.label}>CURRENT LOCATION (ZIP):</span>
            <span className={`${s.well} cut-corners`}>
              <input
                className={s.input}
                type="text"
                value={form.location}
                onChange={set('location')}
                placeholder="OPTIONAL"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </span>
          </label>

          <label className={`${s.row} ${s.wellAreaRow}`}>
            <span className={s.label}>UPDATE NOTE:</span>
            <span className={`${s.well} ${s.wellArea} cut-corners`}>
              <textarea
                className={s.textarea}
                rows={2}
                value={form.description}
                onChange={set('description')}
                placeholder="OPTIONAL"
              />
            </span>
          </label>

          <label className={s.row}>
            <span className={s.label}>ESTIMATED DELIVERY:</span>
            <span className={`${s.well} cut-corners`}>
              <input
                className={s.input}
                type="date"
                value={form.estimatedDelivery}
                onChange={set('estimatedDelivery')}
              />
            </span>
          </label>

          {/* Only rendered for Delivered — removed from the DOM otherwise */}
          {needsOtp && (
            <label className={`${s.row} ${s.otpRow}`}>
              <span className={s.label}>VERIFICATION CODE (OTP):</span>
              <span className={`${s.well} cut-corners`}>
                <input
                  className={s.input}
                  type="text"
                  value={form.otp}
                  onChange={set('otp')}
                  placeholder="ENTER CODE FROM RECIPIENT"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </span>
            </label>
          )}
        </div>

        {needsOtp && (
          <p className={s.otpNote}>REQUIRED TO CONFIRM HANDOVER WHEN MARKING DELIVERED.</p>
        )}

        <div className={s.submitWrap}>
          <button type="submit" className={`${s.submitBtn} cut-corners`}>
            [ UPDATE SHIPMENT ]
          </button>
        </div>

        {saved && <p className={s.toast}>UPDATE CAPTURED LOCALLY &mdash; NOT SENT (UI ONLY)</p>}
      </form>

      {/* Read-only event log preview */}
      <div className={`${s.panel} cut-corners mx-auto mt-[26px]`}>
        <h2 className={s.sectionHead}>[SHIPMENT TIMELINE]</h2>
        <ol className={s.timeline}>
          {MOCK_TIMELINE.map((ev, i) => (
            <li key={`${ev.status}-${i}`} className={s.entry}>
              <div className={s.entryHead}>
                <StatusBadge status={ev.status} className={s.ctxStatus} />
                <span className={s.entryDate}>{ev.date}</span>
                <span className={s.entryDate}>ZIP {ev.location}</span>
              </div>
              <p className={s.entryBody}>{ev.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default UpdateShipment

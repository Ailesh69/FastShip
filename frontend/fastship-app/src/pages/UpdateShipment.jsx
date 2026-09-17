import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PARTNER_SETTABLE,
  SHIPMENT_STATUS,
  formatEventTime,
  latestStatus,
  shortId,
  sortedTimeline,
} from '../components/shipmentStatus'
import StatusBadge from '../components/StatusBadge'
import { getShipment, updateShipment } from '../api/shipments'
import { apiError } from '../api/client'
import s from './UpdateShipment.module.css'

// DELIVERY PARTNER — update a shipment's status.
// ?id= names the shipment. Loaded on mount; each save PATCHes /shipment/ and
// re-reads so the timeline reflects what was actually stored.

// <input type="date"> gives back YYYY-MM-DD, but estimated_delivery is a
// datetime column — send midnight so FastAPI parses it as one.
const asDateTime = (day) => (day ? `${day}T00:00:00` : undefined)

// Reverse of above, to seed the field. Built from local date parts, not
// toISOString() — that converts to UTC and can shift the day.
const asDay = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const EMPTY_FORM = { status: '', location: '', description: '', estimatedDelivery: '', otp: '' }

function UpdateShipment() {
  const [params] = useSearchParams()
  const shipmentId = params.get('id') ?? ''

  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(Boolean(shipmentId))
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  // OTP is only relevant when the partner marks the parcel Delivered.
  const needsOtp = form.status === 'delivered'

  const load = useCallback(async () => {
    // missing id is a render condition, not a fetch failure (see `missingId` below)
    if (!shipmentId) return
    try {
      const data = await getShipment(shipmentId)
      setShipment(data)
      setLoadError('')
      // prefill so a one-field save doesn't reset delivery date; "placed" isn't
      // in the dropdown, so default to the next real status instead
      const current = latestStatus(data)
      setForm((f) => ({
        ...f,
        status: PARTNER_SETTABLE.includes(current) ? current : PARTNER_SETTABLE[0],
        estimatedDelivery: asDay(data.estimated_delivery),
      }))
    } catch (err) {
      setLoadError(apiError(err, 'COULD NOT LOAD SHIPMENT'))
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  // await inside effect so state updates land after the fetch, not mid-body
  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }))
    setSaved(false)
    setSaveError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaved(false)
    setSaveError('')

    if (needsOtp && !form.otp.trim()) {
      setSaveError('ENTER THE VERIFICATION CODE TO MARK THIS DELIVERED')
      return
    }
    if (form.location.trim() && !/^\d+$/.test(form.location.trim())) {
      setSaveError('LOCATION MUST BE A ZIP CODE, DIGITS ONLY')
      return
    }

    // only send fields the partner actually filled in (rest is optional, backend drops nulls)
    const payload = {}
    if (form.status) payload.status = form.status
    if (form.location.trim()) payload.location = Number(form.location.trim())
    if (form.description.trim()) payload.description = form.description.trim()
    if (form.estimatedDelivery) payload.estimated_delivery = asDateTime(form.estimatedDelivery)
    // sent only with status=delivered; backend checks it against the code texted to recipient
    if (needsOtp) payload.verification_code = form.otp.trim()

    setSaving(true)
    try {
      const updated = await updateShipment(shipmentId, payload)
      setShipment(updated)
      setForm((f) => ({ ...f, location: '', description: '', otp: '' }))
      setSaved(true)
    } catch (err) {
      setSaveError(apiError(err, 'COULD NOT UPDATE SHIPMENT'))
    } finally {
      setSaving(false)
    }
  }

  const timeline = sortedTimeline(shipment)
  const missingId = !shipmentId

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      <h1 className="title-glow-clean m-0 text-center text-[20px] leading-none">
        UPDATE SHIPMENT{shipmentId ? ` - ${shortId(shipmentId)}` : ''}
      </h1>

      {missingId ? (
        <p
          className={`${s.panel} cut-corners mx-auto mt-[26px] ${s.toast} ${s.toastError}`}
          role="alert"
        >
          NO SHIPMENT ID IN THE URL - OPEN THIS PAGE FROM YOUR DASHBOARD
        </p>
      ) : loading ? (
        <p className={`${s.panel} cut-corners mx-auto mt-[26px] ${s.toast}`}>LOADING SHIPMENT...</p>
      ) : loadError ? (
        <p
          className={`${s.panel} cut-corners mx-auto mt-[26px] ${s.toast} ${s.toastError}`}
          role="alert"
        >
          {loadError}
        </p>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            noValidate
            className={`${s.panel} cut-corners mx-auto mt-[26px]`}
          >
            {/* Read-only context */}
            <h2 className={s.sectionHead}>[SHIPMENT]</h2>
            <div className={s.context}>
              <div className={s.ctxCell}>
                <span className={s.ctxLabel}>SHIPMENT ID</span>
                <span className={s.ctxValue}>{shipment.id}</span>
              </div>
              <div className={s.ctxCell}>
                <span className={s.ctxLabel}>CONTENT</span>
                <span className={s.ctxValue}>{shipment.content}</span>
              </div>
              <div className={s.ctxCell}>
                <span className={s.ctxLabel}>CURRENT STATUS</span>
                <StatusBadge status={latestStatus(shipment)} className={s.ctxStatus} />
              </div>
              <div className={s.ctxCell}>
                <span className={s.ctxLabel}>DESTINATION</span>
                <span className={s.ctxValue}>{shipment.destination}</span>
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
              <button type="submit" disabled={saving} className={`${s.submitBtn} cut-corners`}>
                {saving ? '[ UPDATING... ]' : '[ UPDATE SHIPMENT ]'}
              </button>
            </div>

            {saveError && (
              <p className={`${s.toast} ${s.toastError}`} role="alert">
                {saveError}
              </p>
            )}
            {saved && <p className={s.toast}>SHIPMENT UPDATED</p>}
          </form>

          {/* Read-only event log, re-read after every successful save */}
          <div className={`${s.panel} cut-corners mx-auto mt-[26px]`}>
            <h2 className={s.sectionHead}>[SHIPMENT TIMELINE]</h2>
            {timeline.length === 0 ? (
              <p className={s.toast}>NO EVENTS RECORDED YET</p>
            ) : (
              <ol className={s.timeline}>
                {timeline.map((ev) => (
                  <li key={ev.id} className={s.entry}>
                    <div className={s.entryHead}>
                      <StatusBadge status={ev.status} className={s.ctxStatus} />
                      <span className={s.entryDate}>{formatEventTime(ev.created_at)}</span>
                      {ev.location != null && (
                        <span className={s.entryDate}>ZIP {ev.location}</span>
                      )}
                    </div>
                    {/* The API really does capitalise this field. */}
                    <p className={s.entryBody}>{ev.Description ?? ''}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default UpdateShipment

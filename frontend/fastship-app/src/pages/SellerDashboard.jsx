import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import {
  formatEta,
  formatEventTime,
  latestStatus,
  shortId,
  sortedTimeline,
} from '../components/shipmentStatus'
import { cancelShipment, getShipments } from '../api/shipments'
import { apiError, TRACKING_URL } from '../api/client'
import { useLoadingNav } from '../context/loadingNav'
import s from './SellerDashboard.module.css'

// SELLER DASHBOARD — order summary table.
//
// Rows come from GET /seller/shipments, which returns every shipment this
// seller created. Layout, columns and styling are unchanged from the reference
// screenshot; only the data behind them is real.

const COLUMNS = [
  { key: 'id', label: 'SHIPMENT ID', width: '14%' },
  { key: 'content', label: 'CONTENT', width: '13.5%' },
  { key: 'destination', label: 'DESTINATION', width: '14%' },
  { key: 'status', label: 'STATUS', width: '16%' },
  { key: 'eta', label: 'EST. DELIVERY', width: '11%' },
  { key: 'partner', label: 'ASSIGNED PARTNER', width: '17%' },
  { key: 'actions', label: 'ACTIONS', width: '14.5%' },
]

// A shipment that has already arrived or been called off has nothing left to
// cancel, and the backend would just stack a second cancelled event on it.
const canCancel = (status) => status !== 'delivered' && status !== 'cancelled'

function SellerDashboard() {
  const { go } = useLoadingNav()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null) // row whose timeline is expanded
  const [cancelling, setCancelling] = useState(null)

  // Nothing before the first await touches state: a retry keeps showing the
  // previous message until the new attempt actually resolves, rather than
  // blanking the panel and flashing.
  const load = useCallback(async () => {
    try {
      const data = await getShipments('seller')
      setShipments(data)
      setError('')
    } catch (err) {
      setError(apiError(err, 'COULD NOT LOAD SHIPMENTS'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Awaited inside the effect rather than called bare, so the state updates
  // land after the fetch instead of synchronously during the effect body.
  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  const handleCancel = async (id) => {
    setCancelling(id)
    try {
      await cancelShipment(id)
      // Refetch rather than patching state: cancelling appends a timeline
      // event server-side, and the row's status is read back off that.
      await load()
    } catch (err) {
      setError(apiError(err, 'COULD NOT CANCEL SHIPMENT'))
    } finally {
      setCancelling(null)
    }
  }

  // Leaves the SPA: the tracking view is a Jinja2 page served by FastAPI.
  const track = (id) => window.location.assign(TRACKING_URL(id))

  // Counts for the caption — derived, never stored, so they can't fall out of
  // step with the rows underneath.
  const counts = shipments.reduce((acc, sh) => {
    const status = latestStatus(sh)
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})

  const caption = loading
    ? 'ORDER SUMMARY'
    : `ORDER SUMMARY - ${shipments.length} TOTAL` +
      (counts.delivered ? ` / ${counts.delivered} DELIVERED` : '') +
      (counts.in_transit ? ` / ${counts.in_transit} IN TRANSIT` : '') +
      (counts.placed ? ` / ${counts.placed} PLACED` : '')

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      {/* Top-left submit button */}
      <div className="mx-auto w-full max-w-[950px]">
        <button
          type="button"
          onClick={() => go('/seller/submit-shipment')}
          className={`${s.submitBtn} cut-corners`}
        >
          [SUBMIT NEW SHIPMENT]
        </button>
      </div>

      {/* Order summary table */}
      <div className="records-panel cut-corners mx-auto mt-[26px] w-full max-w-[950px]">
        <div className="records-caption px-4 py-[14px] text-center text-[14px] leading-none">
          {caption}
        </div>

        {loading ? (
          <p className={s.notice}>LOADING SHIPMENTS...</p>
        ) : error ? (
          <p className={`${s.notice} ${s.noticeError}`} role="alert">
            {error}
            <br />
            <button type="button" onClick={load} className={s.actionLink}>
              [RETRY]
            </button>
          </p>
        ) : shipments.length === 0 ? (
          <p className={s.notice}>
            NO SHIPMENTS YET
            <br />
            SUBMIT ONE TO SEE IT HERE
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <colgroup>
                {COLUMNS.map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
              </colgroup>

              <thead className="records-head">
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className="px-2 py-[12px] text-center text-[10px] font-normal leading-[1.5]"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="records-body">
                {shipments.map((sh) => {
                  const status = latestStatus(sh)
                  const open = openId === sh.id
                  return [
                    <tr key={sh.id}>
                      <td className={`${s.dataCell} px-2 py-[10px] text-center`} title={sh.id}>
                        {shortId(sh.id)}
                      </td>
                      <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{sh.content}</td>
                      <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                        {sh.destination}
                      </td>
                      <td className={`${s.dataCell} px-2 py-[10px]`}>
                        <StatusBadge status={status} className={s.statusCell} />
                      </td>
                      <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                        {formatEta(sh.estimated_delivery)}
                      </td>
                      <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                        {sh.delivery_partner?.name ?? 'NONE'}
                      </td>
                      <td className="px-2 py-[10px]">
                        <span className={s.actions}>
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : sh.id)}
                            aria-expanded={open}
                            className={s.actionLink}
                          >
                            [{open ? 'HIDE DETAIL' : 'VIEW DETAIL'}]
                          </button>
                          <button
                            type="button"
                            onClick={() => track(sh.id)}
                            className={s.actionLink}
                          >
                            [TRACK]
                          </button>
                          {canCancel(status) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(sh.id)}
                              disabled={cancelling === sh.id}
                              className={`${s.actionLink} ${s.cancelLink}`}
                            >
                              [{cancelling === sh.id ? 'CANCELLING...' : 'CANCEL'}]
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>,

                    open && (
                      <tr key={`${sh.id}-detail`}>
                        <td colSpan={COLUMNS.length} className={s.detailCell}>
                          <ol className={s.timeline}>
                            {sortedTimeline(sh).map((ev) => (
                              <li key={ev.id} className={s.entry}>
                                <StatusBadge status={ev.status} className={s.entryStatus} />
                                <span className={s.entryMeta}>
                                  {formatEventTime(ev.created_at)}
                                  {ev.location ? ` - ZIP ${ev.location}` : ''}
                                </span>
                                {/* The event column really is capitalised
                                    "Description" in the API payload. */}
                                <span className={s.entryBody}>{ev.Description ?? ''}</span>
                              </li>
                            ))}
                            {sortedTimeline(sh).length === 0 && (
                              <li className={s.entry}>
                                <span className={s.entryBody}>NO EVENTS RECORDED YET</span>
                              </li>
                            )}
                          </ol>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default SellerDashboard

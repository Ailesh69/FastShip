import { useCallback, useEffect, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
import StatusBadge from '../components/StatusBadge'
import { formatEta, latestStatus, shortId } from '../components/shipmentStatus'
import { getShipments } from '../api/shipments'
import { apiError, TRACKING_URL } from '../api/client'
import s from './PartnerDashboard.module.css'

// DELIVERY PARTNER — assigned shipments.
//
// Rows come from GET /partner/shipments, which returns only the shipments this
// partner was assigned, so there is no "assigned partner" column and no cancel
// action — cancelling belongs to the seller who created the shipment.

const COLUMNS = [
  { key: 'id', label: 'SHIPMENT ID', width: '13%' },
  { key: 'content', label: 'CONTENT', width: '14%' },
  { key: 'destination', label: 'DESTINATION', width: '12%' },
  { key: 'weight', label: 'WEIGHT', width: '10%' },
  { key: 'tags', label: 'TAGS', width: '13%' },
  { key: 'status', label: 'STATUS', width: '15%' },
  { key: 'estimated_delivery', label: 'EST. DELIVERY', width: '11%' },
  { key: 'actions', label: 'ACTIONS', width: '12%' },
]

const tagClass = (tag) =>
  tag === 'express' ? s.tagExpress : tag === 'fragile' ? s.tagFragile : s.tagPlain

// Leaves the SPA: the tracking view is a Jinja2 page served by FastAPI.
const track = (id) => window.location.assign(TRACKING_URL(id))

function PartnerDashboard() {
  const { go } = useLoadingNav()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Nothing before the first await touches state: a retry keeps showing the
  // previous message until the new attempt actually resolves, rather than
  // blanking the panel and flashing.
  const load = useCallback(async () => {
    try {
      const data = await getShipments('partner')
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

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      <h1 className="title-glow-clean m-0 text-center text-[22px] leading-none">
        ASSIGNED SHIPMENTS
      </h1>

      <div className="records-panel cut-corners mx-auto mt-[26px] w-full max-w-[1150px]">
        <div className="records-caption px-4 py-[14px] text-center text-[14px] leading-none">
          ORDER SUMMARY
        </div>

        {loading ? (
          <p className={s.empty}>LOADING SHIPMENTS...</p>
        ) : error ? (
          <p className={`${s.empty} ${s.emptyError}`} role="alert">
            {error}
            <br />
            <button type="button" onClick={load} className={s.actionLink}>
              [RETRY]
            </button>
          </p>
        ) : shipments.length === 0 ? (
          <p className={s.empty}>NO SHIPMENTS ASSIGNED YET</p>
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
                      className="px-2 py-[12px] text-center text-[9px] font-normal leading-[1.5]"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="records-body">
                {shipments.map((sh) => (
                  <tr key={sh.id}>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`} title={sh.id}>
                      {shortId(sh.id)}
                    </td>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{sh.content}</td>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                      {sh.destination}
                    </td>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{sh.weight} KG</td>
                    <td className="px-2 py-[10px]">
                      <span className={s.tags}>
                        {(sh.tags ?? []).length === 0 ? (
                          <span className={`${s.dataCell} opacity-50`}>&mdash;</span>
                        ) : (
                          sh.tags.map((t) => (
                            <span key={t.id ?? t.name} className={`${s.tag} ${tagClass(t.name)}`}>
                              {String(t.name).toUpperCase()}
                            </span>
                          ))
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-[10px]">
                      <StatusBadge status={latestStatus(sh)} className={s.statusCell} />
                    </td>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                      {formatEta(sh.estimated_delivery)}
                    </td>
                    <td className="px-2 py-[10px]">
                      <span className={s.actions}>
                        <button
                          type="button"
                          className={s.actionLink}
                          onClick={() => go(`/partner/update-shipment?id=${sh.id}`)}
                        >
                          [UPDATE STATUS]
                        </button>
                        <button
                          type="button"
                          className={s.actionLink}
                          onClick={() => track(sh.id)}
                        >
                          [VIEW DETAIL]
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default PartnerDashboard

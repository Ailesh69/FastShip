import { useLoadingNav } from '../context/loadingNav'
import StatusBadge from '../components/StatusBadge'
import s from './PartnerDashboard.module.css'

// DELIVERY PARTNER — assigned shipments.
//
// UI only: SHIPMENTS below is mock data shaped exactly like the API payload
// ({ id, content, weight, destination, status, estimated_delivery, tags }), so
// swapping in a real fetch later needs no structural change here.
//
// No "assigned partner" column — every row here is already assigned to the
// signed-in partner.

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

const SHIPMENTS = [
  {
    id: '8f14e45f-ceea-467a-9f2b-3c1a77b0d901',
    content: 'TECH GEAR',
    weight: '2.4 KG',
    destination: '10001',
    status: 'in_transit',
    estimated_delivery: '2026-07-26',
    tags: ['express'],
  },
  {
    id: 'c9a2b7d3-1e88-4f60-b5aa-77d2e4c10b42',
    content: 'GLASSWARE',
    weight: '1.1 KG',
    destination: '94105',
    status: 'out_for_delivery',
    estimated_delivery: '2026-07-24',
    tags: ['fragile', 'express'],
  },
  {
    id: '2d7f0c61-45b9-4a2e-8c33-0ab5f9e77c18',
    content: 'HOME GOODS',
    weight: '6.8 KG',
    destination: 'SW1A',
    status: 'placed',
    estimated_delivery: '2026-07-28',
    tags: [],
  },
  {
    id: 'a41c5e90-77bd-4c15-9e02-6b8d3f2a4471',
    content: 'BOOKS',
    weight: '3.2 KG',
    destination: '10115',
    status: 'delivered',
    estimated_delivery: '2026-07-24',
    tags: [],
  },
  {
    id: 'e60b8a12-3fd4-49c7-a0e6-9c5b1d8e2237',
    content: 'APPAREL',
    weight: '0.9 KG',
    destination: '75001',
    status: 'cancelled',
    estimated_delivery: '2026-07-30',
    tags: ['fragile'],
  },
]

// Long UUIDs get truncated for display; the full id still drives the route.
const shortId = (id) => id.split('-')[0].toUpperCase()

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

const tagClass = (tag) =>
  tag === 'express' ? s.tagExpress : tag === 'fragile' ? s.tagFragile : s.tagPlain

function PartnerDashboard({ shipments = SHIPMENTS }) {
  const { go } = useLoadingNav()

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      <h1 className="title-glow-clean m-0 text-center text-[22px] leading-none">
        ASSIGNED SHIPMENTS
      </h1>

      <div className="records-panel cut-corners mx-auto mt-[26px] w-full max-w-[1150px]">
        <div className="records-caption px-4 py-[14px] text-center text-[14px] leading-none">
          ORDER SUMMARY
        </div>

        {shipments.length === 0 ? (
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
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{sh.weight}</td>
                    <td className="px-2 py-[10px]">
                      <span className={s.tags}>
                        {sh.tags.length === 0 ? (
                          <span className={`${s.dataCell} opacity-50`}>&mdash;</span>
                        ) : (
                          sh.tags.map((t) => (
                            <span key={t} className={`${s.tag} ${tagClass(t)}`}>
                              {t.toUpperCase()}
                            </span>
                          ))
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-[10px]">
                      <StatusBadge status={sh.status} className={s.statusCell} />
                    </td>
                    <td className={`${s.dataCell} px-2 py-[10px] text-center`}>
                      {formatDate(sh.estimated_delivery)}
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
                          onClick={() => console.log('View detail', sh.id)}
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

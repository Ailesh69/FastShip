import { DeliveryTruck, PixelCheck, PixelHourglass } from '../components/PixelIcons'
import { useLoadingNav } from '../context/loadingNav'
import s from './SellerDashboard.module.css'

// SELLER DASHBOARD — order summary table.
//
// Layout, columns and rows are transcribed from the reference screenshot; this
// pass only themes them. The table shell reuses the same global
// .records-* classes as the Client Dashboard so the two stay identical.
// Seller-specific styling lives in SellerDashboard.module.css (scoped).
//
// UI only: rows are static and the action links just log / route.

const COLUMNS = [
  { key: 'id', label: 'SHIPMENT ID', width: '14%' },
  { key: 'content', label: 'CONTENT', width: '13.5%' },
  { key: 'destination', label: 'DESTINATION', width: '14%' },
  { key: 'status', label: 'STATUS', width: '16%' },
  { key: 'eta', label: 'EST. DELIVERY', width: '11%' },
  { key: 'partner', label: 'ASSIGNED PARTNER', width: '17%' },
  { key: 'actions', label: 'ACTIONS', width: '14.5%' },
]

const ORDERS = [
  {
    id: 'FS1011',
    content: 'TECH GEAR',
    destination: 'TOKYO, JP',
    status: 'DELIVERED',
    eta: '7/24',
    partner: 'ALPHA_PARTNER',
    actions: ['VIEW DETAIL', 'INVOICE'],
  },
  {
    id: 'FS1012',
    content: 'APPAREL',
    destination: 'PARIS, FR',
    status: 'IN TRANSIT',
    eta: '7/26',
    partner: 'BETA_PARTNER',
    actions: ['VIEW DETAIL', 'TRACK'],
  },
  {
    id: 'FS1013',
    content: 'HOME GOODS',
    destination: 'LONDON, UK',
    status: 'PENDING',
    eta: '7/28',
    partner: 'NONE',
    actions: ['VIEW DETAIL', 'CANCEL'],
  },
  {
    id: 'FS1014',
    content: 'BOOKS',
    destination: 'BERLIN, DE',
    status: 'DELIVERED',
    eta: '7/24',
    partner: 'GAMMA_PARTNER',
    actions: ['VIEW DETAIL', 'INVOICE'],
  },
]

// Icon follows the status, so the two can't fall out of sync.
function StatusIcon({ status }) {
  if (status === 'DELIVERED') return <PixelCheck />
  if (status === 'IN TRANSIT') return <DeliveryTruck />
  return <PixelHourglass />
}

function SellerDashboard() {
  const { go } = useLoadingNav()

  const runAction = (action, id) => {
    if (action === 'TRACK') return go('/track')
    // UI only — no backend wired.
    console.log(`${action} on ${id}`)
  }

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
          ORDER SUMMARY
        </div>

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
              {ORDERS.map((o) => (
                <tr key={o.id}>
                  <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{o.id}</td>
                  <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{o.content}</td>
                  <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{o.destination}</td>
                  <td className={`${s.dataCell} px-2 py-[10px]`}>
                    <span className={s.statusCell}>
                      <StatusIcon status={o.status} />
                      {o.status}
                    </span>
                  </td>
                  <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{o.eta}</td>
                  <td className={`${s.dataCell} px-2 py-[10px] text-center`}>{o.partner}</td>
                  <td className="px-2 py-[10px]">
                    <span className={s.actions}>
                      {o.actions.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => runAction(a, o.id)}
                          className={`${s.actionLink} ${a === 'CANCEL' ? s.cancelLink : ''}`}
                        >
                          [{a}]
                        </button>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default SellerDashboard

import { DeliveryTruck, PixelCheck } from '../components/PixelIcons'
import { useLoadingNav } from '../context/loadingNav'

// CLIENT DASHBOARD — orders / shipment tracking table.
//
// Layout, columns and rows are transcribed from the reference screenshot; this
// pass only themes them. Rows will come from the FastAPI shipments endpoint
// later — the shape below is what the table renders.

const COLUMNS = [
  { key: 'id', label: 'ORDER ID', width: '17%' },
  { key: 'status', label: 'SHIPMENT STATUS', width: '23%' },
  { key: 'destination', label: 'DESTINATION', width: '20%' },
  { key: 'eta', label: 'EST. DELIVERY', width: '20%' },
  { key: 'tracking', label: 'TRACKING', width: '20%' },
]

const ORDERS = [
  { id: 'FS10452', status: 'Delivered', destination: 'New York, US', eta: '7/24/26', tracking: 'View Tracking' },
  { id: 'FS10453', status: 'In Transit', destination: 'London, UK', eta: '7/28/26', tracking: 'Track Now' },
  { id: 'FS10454', status: 'Delivered', destination: 'London, UK', eta: '7/28/26', tracking: 'Track Now' },
  { id: 'FS10455', status: 'Delivered', destination: 'New York, US', eta: '7/28/26', tracking: 'View Tracking' },
  { id: 'FS10456', status: 'Delivered', destination: 'New York, US', eta: '7/24/26', tracking: 'View Tracking' },
]

// Icon follows the status, so the two can't fall out of sync.
function StatusIcon({ status }) {
  return status === 'Delivered' ? <PixelCheck /> : <DeliveryTruck />
}

function Dashboard() {
  const { go } = useLoadingNav()

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      {/* Headings — hero-style glow treatments */}
      <h1 className="title-glow-clean m-0 text-center text-[24px] leading-none">
        ORDERS - SHIPMENT TRACKING
      </h1>
      <p
        className="m-0 mt-[22px] text-center text-[20px] leading-none"
        style={{
          color: '#7de87e',
          textShadow: '0 0 10px rgba(125,232,126,0.9), 0 0 26px rgba(125,232,126,0.5)',
        }}
      >
        CLIENT DASHBOARD
      </p>

      {/* Records table */}
      <div className="records-panel cut-corners mx-auto mt-[38px] w-full max-w-[950px]">
        <div className="records-caption px-4 py-[14px] text-center text-[13px] leading-none">
          SHIPMENT &amp; ORDER RECORDS
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
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
                    className="whitespace-nowrap px-3 py-[13px] text-center font-normal leading-none"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="records-body">
              {ORDERS.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap px-3 py-[12px] text-center leading-none">
                    {o.id}
                  </td>
                  <td className="px-3 py-[12px] leading-none">
                    <span className="flex items-center justify-center gap-[8px] whitespace-nowrap">
                      <StatusIcon status={o.status} />
                      {o.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-[12px] text-center leading-none">
                    {o.destination}
                  </td>
                  <td className="whitespace-nowrap px-3 py-[12px] text-center leading-none">
                    {o.eta}
                  </td>
                  <td className="px-3 py-[12px] text-center leading-none">
                    <button
                      type="button"
                      onClick={() => go('/track')}
                      className="pixel-link whitespace-nowrap text-[11px] leading-none"
                    >
                      {o.tracking}
                    </button>
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

export default Dashboard

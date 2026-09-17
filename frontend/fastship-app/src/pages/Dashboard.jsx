import { useEffect, useState } from 'react'
import Reveal from '../motion/Reveal'
import { useLoadingNav } from '../context/loadingNav'
import { useAuth } from '../context/auth'
import { getProfile } from '../api/auth'
import { apiError } from '../api/client'

// CLIENT DASHBOARD. Clients have no shipment-list endpoint — backend only
// matches shipments by client_contact_email, no route reads it — so this
// shows the account and points at tracking instead of a table it can't fill.

function Dashboard() {
  const { go } = useLoadingNav()
  const { userType } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getProfile(userType ?? 'client')
        if (!cancelled) setProfile(data)
      } catch (err) {
        if (!cancelled) setError(apiError(err, 'COULD NOT LOAD PROFILE'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    // guards against setting state after a fast navigation unmounts this
    return () => {
      cancelled = true
    }
  }, [userType])

  return (
    <section className="relative z-10 w-full px-4 pb-10">
      {/* Headings — hero-style glow treatments */}
      <Reveal as="h1" className="title-glow-clean m-0 text-center text-[24px] leading-none">
        ORDERS - SHIPMENT TRACKING
      </Reveal>
      <Reveal
        as="p"
        delay={90}
        className="m-0 mt-[22px] text-center text-[20px] leading-none"
        style={{
          color: '#7de87e',
          textShadow: '0 0 10px rgba(125,232,126,0.9), 0 0 26px rgba(125,232,126,0.5)',
        }}
      >
        CLIENT DASHBOARD
      </Reveal>

      {/* reveal only, no tilt — text swinging under cursor hurts readability on wide surfaces */}
      <Reveal
        delay={180}
        className="records-panel cut-corners mx-auto mt-[38px] w-full max-w-[950px]"
      >
        <div className="records-caption px-4 py-[14px] text-center text-[13px] leading-none">
          ACCOUNT
        </div>

        <div className="px-6 py-[26px] text-center">
          {loading ? (
            <p className="m-0 text-[11px] leading-[1.8] text-[#8fb6b4]">LOADING ACCOUNT...</p>
          ) : error ? (
            <p className="field-error m-0 text-[10px] leading-[1.8]" role="alert">
              {error}
            </p>
          ) : (
            <dl className="m-0 flex flex-col gap-[14px] text-[11px] leading-none">
              <div className="flex flex-wrap items-center justify-center gap-[10px]">
                <dt className="text-[#8fb6b4]">NAME:</dt>
                <dd className="m-0 text-white">{profile.name}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[10px]">
                <dt className="text-[#8fb6b4]">EMAIL:</dt>
                <dd className="m-0 text-white">{profile.email}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-[10px]">
                <dt className="text-[#8fb6b4]">EMAIL VERIFIED:</dt>
                <dd
                  className="m-0"
                  style={{ color: profile.email_verified ? '#7de87e' : '#ff7a5c' }}
                >
                  {profile.email_verified ? 'YES' : 'NO'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </Reveal>

      {/* Shipments */}
      <Reveal
        delay={270}
        className="records-panel cut-corners mx-auto mt-[26px] w-full max-w-[950px]"
      >
        <div className="records-caption px-4 py-[14px] text-center text-[13px] leading-none">
          SHIPMENT &amp; ORDER RECORDS
        </div>

        <div className="px-6 py-[36px] text-center">
          <p className="m-0 text-[11px] leading-[1.9] text-[#8fb6b4]">
            YOUR SHIPMENTS WILL APPEAR HERE WHEN SELLERS
            <br />
            ADD YOUR EMAIL TO THEIR SHIPMENTS
          </p>
          <p className="m-0 mt-[20px] text-[10px] leading-[1.8] text-[#8fb6b4]">
            HAVE A SHIPMENT ID FROM A CONFIRMATION EMAIL?
          </p>
          <button
            type="button"
            onClick={() => go('/track')}
            className="pixel-link mt-[12px] text-[11px] leading-none"
          >
            [TRACK A SHIPMENT]
          </button>
        </div>
      </Reveal>
    </section>
  )
}

export default Dashboard

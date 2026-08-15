import { useState } from 'react'
import FieldRow from '../components/FieldRow'
import useMagnetic from '../motion/useMagnetic'
import { BoxIcon } from '../components/PixelIcons'
import { TRACKING_URL } from '../api/client'

// TRACK ORDER entry page.
//
// The card, field row and bracket button all come from the same shared
// components/classes the sign-up and login pages use, so the three can't drift.
//
// Submitting deliberately LEAVES the React app: the tracking view itself is a
// Jinja2 page rendered by the FastAPI backend on a different origin, so this is
// a full browser navigation, not a router push.

const CARD_W = 470
const PAD_X = 30

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Full-width submits take a much gentler pull than the site's freestanding
// buttons: at any real strength a wide bar leaning sideways reads as the card
// being misaligned rather than as the button reaching for you. What it is
// really here for is the shared press feedback (.mag:active in motion.css).
const SUBMIT_PULL = { strength: 3 }

function Track() {
  const track = useMagnetic(SUBMIT_PULL)
  const [shipmentId, setShipmentId] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const handleChange = (e) => {
    setShipmentId(e.target.value)
    if (error) setError('')
    if (warning) setWarning('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const id = shipmentId.trim()

    // Only guard the empty submit. Real validation — unknown id, wrong format,
    // expired — belongs to the backend page; this app can't see that state and
    // shouldn't pretend to.
    if (!id) {
      setError('ENTER A SHIPMENT ID')
      return
    }

    // Advisory only: still hands off, the backend owns the real error display.
    if (!UUID_RE.test(id)) {
      setWarning("THAT DOESN'T LOOK LIKE A SHIPMENT ID - CHECKING ANYWAY...")
    }

    window.location.assign(TRACKING_URL(id))
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // we render our own message; no native bubble
      className="signup-card relative z-10 my-auto rounded-[6px]"
      style={{ width: CARD_W, maxWidth: '92vw', padding: `24px ${PAD_X}px 26px` }}
    >
      <h1 className="title-glow-clean m-0 text-center text-[22px] leading-none">
        TRACK YOUR ORDER
      </h1>

      <p
        className="m-0 mt-[16px] text-center text-[17px] leading-[1.5] text-fs-ink"
        style={{ fontFamily: 'var(--font-term)' }}
      >
        Enter your Shipment ID to see its journey.
      </p>

      <div className="mt-[26px]">
        <FieldRow
          name="shipmentId"
          label="SHIPMENT ID:"
          icon={BoxIcon}
          value={shipmentId}
          onChange={handleChange}
          error={error}
          autoComplete="off"
        />
      </div>

      {warning && (
        <p
          className="m-0 mt-[8px] pl-[48px] text-[8px] leading-none"
          style={{ color: '#fbbf24', textShadow: '0 0 6px rgba(251,191,36,0.55)' }}
        >
          {warning}
        </p>
      )}

      <button
        ref={track}
        type="submit"
        className="bracket-btn mag cut-corners mt-[20px] w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none"
      >
        [ TRACK ORDER ]
      </button>
    </form>
  )
}

export default Track

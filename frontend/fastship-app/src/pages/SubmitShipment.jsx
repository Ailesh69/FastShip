import { useEffect, useRef, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
import { MailIcon } from '../components/PixelIcons'
import { submitShipment } from '../api/shipments'
import { apiError } from '../api/client'
import { shortId } from '../components/shipmentStatus'
import s from './SubmitShipment.module.css'

// SELLER — submit a new shipment.
//
// POSTs to /shipment/ with the seller's token. The backend assigns a delivery
// partner covering the destination zip at creation time, so a submit can fail
// on coverage (406) as easily as on a bad field — both surface in the same
// message line.

const FIELDS = [
  {
    name: 'content',
    label: 'SHIPMENT CONTENT:',
    type: 'text',
    placeholder: 'Tech Gear',
    required: true,
  },
  { name: 'weight', label: 'WEIGHT (KG):', type: 'number', placeholder: '2.5', required: true },
  {
    name: 'destination',
    label: 'DESTINATION (ZIP):',
    type: 'text',
    placeholder: '94105',
    required: true,
    autoComplete: 'postal-code',
  },
  {
    name: 'clientEmail',
    label: 'CLIENT EMAIL:',
    type: 'email',
    placeholder: 'buyer@example.com',
    required: true,
    icon: MailIcon,
    autoComplete: 'email',
  },
  // Optional per the shipment schema.
  {
    name: 'clientPhone',
    label: 'CLIENT PHONE (OPTIONAL):',
    type: 'text',
    placeholder: '+919876543210',
    required: false,
    autoComplete: 'tel',
  },
]

const INITIAL = Object.fromEntries(FIELDS.map((f) => [f.name, '']))
// Long enough to read the new shipment's id off the confirmation panel.
const REDIRECT_AFTER_MS = 2600

function SubmitShipment() {
  const { go } = useLoadingNav()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null) // the ShipmentRead we got back
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const timer = useRef(0)

  // Don't fire the redirect if the user navigates away first.
  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
    setFormError('')
  }

  const validate = () => {
    const next = {}
    for (const f of FIELDS) {
      if (f.required && !values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    }
    // destination is an INTEGER zip column, and weight is capped at 25kg by the
    // schema — catching both here beats a 422 with no field attached.
    if (!next.destination && !/^\d+$/.test(values.destination.trim())) {
      next.destination = 'ZIP CODE MUST BE DIGITS ONLY'
    }
    if (!next.weight) {
      const weight = Number(values.weight)
      if (!Number.isFinite(weight) || weight <= 0) next.weight = 'ENTER A WEIGHT IN KG'
      else if (weight > 25) next.weight = 'MAXIMUM WEIGHT IS 25 KG'
    }
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const shipment = await submitShipment({
        content: values.content.trim(),
        weight: Number(values.weight),
        destination: Number(values.destination.trim()),
        client_contact_email: values.clientEmail.trim(),
        // Omitted rather than sent empty: the column is nullable, and "" is not
        // a phone number.
        client_contact_phone: values.clientPhone.trim() || null,
      })
      setCreated(shipment)
      timer.current = setTimeout(() => go('/seller/dashboard'), REDIRECT_AFTER_MS)
    } catch (err) {
      setFormError(apiError(err, 'COULD NOT SUBMIT SHIPMENT'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 w-full px-4 pb-10" noValidate>
      <h1 className="title-glow-clean m-0 text-center text-[22px] leading-none">
        SUBMIT NEW SHIPMENT
      </h1>

      <div className={`${s.panel} cut-corners mx-auto mt-[28px]`}>
        <h2 className={s.sectionHead}>[SHIPMENT DETAILS]</h2>

        <div className={s.rows}>
          {FIELDS.map(({ name, label, type, placeholder, icon: Icon, autoComplete }) => (
            <div key={name}>
              <label className={s.row}>
                <span className={s.label}>{label}</span>
                <span className={`${s.well} cut-corners`}>
                  {Icon && <Icon />}
                  <input
                    className={s.input}
                    type={type}
                    name={name}
                    value={values[name]}
                    onChange={set(name)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={errors[name] ? 'true' : undefined}
                    {...(type === 'number' ? { min: '0', step: '0.1' } : {})}
                  />
                </span>
              </label>
              {errors[name] && <p className={s.error}>{errors[name]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className={`${s.submitWrap} mt-[26px]`}>
        <button
          type="submit"
          disabled={busy || Boolean(created)}
          className={`${s.submitBtn} cut-corners`}
        >
          {busy ? '[ SUBMITTING... ]' : '[ SUBMIT SHIPMENT ]'}
        </button>
      </div>

      {formError && (
        <p className={`${s.confirm} ${s.confirmError} cut-corners`} role="alert">
          {formError}
        </p>
      )}

      {created && (
        <p className={`${s.confirm} cut-corners`} role="status">
          SHIPMENT CREATED - {shortId(created.id)}
          <br />
          <span className={s.confirmId}>{created.id}</span>
          <br />
          RETURNING TO DASHBOARD...
        </p>
      )}
    </form>
  )
}

export default SubmitShipment

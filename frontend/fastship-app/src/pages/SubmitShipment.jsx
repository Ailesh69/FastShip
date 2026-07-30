import { useEffect, useRef, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
import { MailIcon } from '../components/PixelIcons'
import s from './SubmitShipment.module.css'

// SELLER — submit a new shipment.
//
// UI only: nothing is POSTed. A valid submit shows a pixel confirmation panel
// and then routes back to the seller dashboard.

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
const REDIRECT_AFTER_MS = 1400

function SubmitShipment() {
  const { go } = useLoadingNav()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const timer = useRef(0)

  // Don't fire the redirect if the user navigates away first.
  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    for (const f of FIELDS) {
      if (f.required && !values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    // UI-only build — nothing is sent anywhere.
    setSubmitted(true)
    timer.current = setTimeout(() => go('/seller/dashboard'), REDIRECT_AFTER_MS)
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
        <button type="submit" className={`${s.submitBtn} cut-corners`}>
          [ SUBMIT SHIPMENT ]
        </button>
      </div>

      {submitted && (
        <p className={`${s.confirm} cut-corners`} role="status">
          SHIPMENT QUEUED (UI ONLY - NOT SENT)
          <br />
          RETURNING TO DASHBOARD...
        </p>
      )}
    </form>
  )
}

export default SubmitShipment

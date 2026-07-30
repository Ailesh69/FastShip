import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import FieldRow from '../components/FieldRow'
import { CargoShip, LockIcon, MailIcon, MarketStall, PersonIcon } from '../components/PixelIcons'
import { useLoadingNav } from '../context/loadingNav'
import { useAuth } from '../context/auth'
import { ROLES, dashboardFor } from '../config/roles'

// ACCOUNT LOGIN.
//
// Card chrome, field rows, bracket button and error text all come from the same
// classes and components the sign-up pages use, so the two can't drift.
//
// UI only: submitting runs empty-field checks and logs. No auth, no endpoint.

const CARD_W = 470
const PAD_X = 30

// Icons are the SAME sprites used elsewhere on the site — the market stall and
// cargo ship from the "Select Your Path" cards, and the person silhouette from
// the sign-up name fields.
const ACCOUNT_TYPES = [
  {
    id: 'seller',
    label: ['SELLER', 'ACCOUNT'],
    icon: <MarketStall scale={3} />,
    signup: ROLES.seller.signup,
  },
  {
    id: 'partner',
    label: ['DELIVERY', 'PARTNER'],
    icon: <CargoShip scale={3} />,
    signup: ROLES.partner.signup,
  },
  {
    id: 'client',
    label: ['GENERAL', 'USER'],
    icon: <PersonIcon scale={4} />,
    signup: ROLES.client.signup,
  },
]

const FIELDS = [
  { name: 'email', label: 'EMAIL:', type: 'email', icon: MailIcon, autoComplete: 'email' },
  {
    name: 'password',
    label: 'PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'current-password',
  },
]

function Login() {
  const { go } = useLoadingNav()
  // Set by <RequireAuth> when it bounces an unauthenticated visit, so the
  // redirect is never silent — an unexplained jump to /login reads exactly
  // like a missing page.
  const { state } = useLocation()
  const blockedFrom = state?.from ?? null
  const { login } = useAuth()
  const [role, setRole] = useState(null) // null = nothing chosen yet
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  // Toggleable: clicking the active card clears it, which is how the user gets
  // back to "no type chosen" and the generic sign-up route.
  const pick = (id) => setRole((cur) => (cur === id ? null : id))

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    for (const f of FIELDS) if (!values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    if (!role) next.accountType = 'SELECT AN ACCOUNT TYPE ABOVE'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      // MOCK login: any email/password is accepted. No request, no token —
      // just a session object in localStorage. Swap this call's body for the
      // real API call later; the rest of the app needs no changes.
      login({
        name: values.email.split('@')[0] || 'TestUser',
        email: values.email,
        userType: role,
      })
      go(dashboardFor(role))
    }
  }

  // A chosen type goes straight to that role's sign-up; otherwise send the user
  // to Select Your Path so they can pick one first.
  const signUpTarget = ACCOUNT_TYPES.find((t) => t.id === role)?.signup ?? '/signup'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // we render our own messages; no native bubbles
      className="signup-card relative z-10 my-auto rounded-[6px]"
      style={{ width: CARD_W, maxWidth: '92vw', padding: `24px ${PAD_X}px 26px` }}
    >
      <h1 className="title-glow-clean m-0 text-center text-[26px] leading-none">ACCOUNT LOGIN</h1>

      {blockedFrom && (
        <p
          className="m-0 mt-[14px] text-center text-[9px] leading-[1.6]"
          style={{ color: '#fbbf24', textShadow: '0 0 6px rgba(251,191,36,0.5)' }}
          role="status"
        >
          SIGN IN TO REACH {blockedFrom.toUpperCase()}
          <br />
          PICK THE MATCHING ACCOUNT TYPE BELOW
        </p>
      )}

      {/* Account type — single choice, toggleable */}
      <div
        className="mt-[34px] flex gap-[13px]"
        role="group"
        aria-label="Account type"
      >
        {ACCOUNT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            aria-pressed={role === t.id}
            className="acct-card cut-corners flex flex-1 flex-col items-center justify-center gap-[10px] px-[6px] py-[14px]"
          >
            <span className="flex h-[50px] items-center justify-center">{t.icon}</span>
            <span className="text-center text-[8px] leading-[1.6]">
              {t.label[0]}
              <br />
              {t.label[1]}
            </span>
          </button>
        ))}
      </div>

      {/* Account-type error sits directly under the cards it refers to —
          putting it under EMAIL made a card-selection problem look like a
          field problem, which reads as "the button does nothing". */}
      {errors.accountType && (
        <p className="field-error m-0 mt-[8px] text-center text-[8px] leading-none">
          {errors.accountType}
        </p>
      )}

      {/* Credentials — same rows as the sign-up forms */}
      <div className="mt-[15px] flex flex-col gap-[15px]">
        {FIELDS.map((f) => (
          <FieldRow
            key={f.name}
            {...f}
            value={values[f.name]}
            onChange={set(f.name)}
            error={errors[f.name]}
          />
        ))}
      </div>

      <div className="mt-[12px] text-right">
        <button
          type="button"
          onClick={() => console.log('Forgot password')}
          className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[9px] leading-none text-fs-teal underline underline-offset-[3px] transition-colors hover:text-white"
        >
          FORGOT PASSWORD?
        </button>
      </div>

      <button
        type="submit"
        className="bracket-btn cut-corners mt-[15px] w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none"
      >
        [ LOG IN ]
      </button>

      <p className="m-0 mt-[18px] text-center text-[9px] leading-none text-white">
        NEED AN ACCOUNT?{' '}
        <button
          type="button"
          onClick={() => go(signUpTarget)}
          className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[9px] leading-none text-fs-green transition-colors hover:text-fs-teal"
        >
          [SIGN UP]
        </button>
      </p>
    </form>
  )
}

export default Login

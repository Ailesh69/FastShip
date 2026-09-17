import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import FieldRow from '../components/FieldRow'
import useMagnetic from '../motion/useMagnetic'
import { CargoShip, LockIcon, MailIcon, MarketStall, PersonIcon } from '../components/PixelIcons'
import { useLoadingNav } from '../context/loadingNav'
import { useAuth } from '../context/auth'
import { ROLES, dashboardFor } from '../config/roles'
import { apiError } from '../api/client'
import { forgotPassword } from '../api/auth'

// ACCOUNT LOGIN. Shares card/field/button styling with sign-up.
// Account type matters: each role has its own /token endpoint and user
// table, so the wrong type fails even with correct credentials.

const CARD_W = 470
const PAD_X = 30

// same sprites as elsewhere: market stall/cargo ship from Select Your Path, person icon from sign-up
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
  // set by <RequireAuth> on a bounced visit, so the redirect isn't silent
  const { state } = useLocation()
  const blockedFrom = state?.from ?? null
  const { login } = useAuth()
  // gentle pull, see Track.jsx; callback refs since reset button mounts conditionally
  const signIn = useMagnetic({ strength: 3 })
  const sendReset = useMagnetic({ strength: 3 })
  const [role, setRole] = useState(null) // null = nothing chosen yet
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  // forgot-password reveals inline instead of routing away
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSent, setResetSent] = useState('')
  const [resetBusy, setResetBusy] = useState(false)

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
    setFormError('')
  }

  // clicking the active card again clears it (back to "no type chosen")
  const pick = (id) => {
    setRole((cur) => (cur === id ? null : id))
    setFormError('')
    setErrors((prev) => (prev.accountType ? { ...prev, accountType: undefined } : prev))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    for (const f of FIELDS) if (!values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    if (!role) next.accountType = 'SELECT AN ACCOUNT TYPE ABOVE'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await login(values.email.trim(), values.password, role)
      go(dashboardFor(role))
    } catch (err) {
      // backend distinguishes bad creds from unverified account — show its message, not a blanket one
      setFormError(apiError(err, 'COULD NOT SIGN IN'))
    } finally {
      setBusy(false)
    }
  }

  const openReset = () => {
    setResetOpen((open) => !open)
    setResetEmail(values.email)
    setResetError('')
    setResetSent('')
  }

  const handleReset = async () => {
    const email = resetEmail.trim()
    setResetSent('')
    if (!email) {
      setResetError('ENTER YOUR EMAIL')
      return
    }
    // reset link is generated per-role router, so type must be picked first
    if (!role) {
      setResetError('SELECT AN ACCOUNT TYPE ABOVE FIRST')
      return
    }

    setResetError('')
    setResetBusy(true)
    try {
      await forgotPassword(email, role)
      setResetSent('PASSWORD RESET LINK SENT TO YOUR EMAIL')
    } catch (err) {
      setResetError(apiError(err, 'COULD NOT SEND RESET LINK'))
    } finally {
      setResetBusy(false)
    }
  }

  // chosen type -> straight to its sign-up; otherwise Select Your Path first
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
            data-testid={`acct-${t.id}`}
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

      {/* error sits under the cards it refers to, not under EMAIL — avoids looking like a field error */}
      {errors.accountType && (
        <p
          data-testid="error-accountType"
          className="field-error m-0 mt-[8px] text-center text-[8px] leading-none"
        >
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
          onClick={openReset}
          aria-expanded={resetOpen}
          className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[9px] leading-none text-fs-teal underline underline-offset-[3px] transition-colors hover:text-white"
        >
          FORGOT PASSWORD?
        </button>
      </div>

      {/* not a nested <form> — a second submit path here would fire the login */}
      {resetOpen && (
        <div className="mt-[12px]">
          <FieldRow
            name="resetEmail"
            label="EMAIL:"
            type="email"
            icon={MailIcon}
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.target.value)
              setResetError('')
            }}
            error={resetError}
            autoComplete="email"
          />
          <button
            ref={sendReset}
            type="button"
            onClick={handleReset}
            disabled={resetBusy}
            className="bracket-btn mag cut-corners mt-[10px] w-full cursor-pointer py-[11px] font-[inherit] text-[10px] leading-none disabled:cursor-wait disabled:opacity-60"
          >
            {resetBusy ? '[ SENDING... ]' : '[ SEND RESET LINK ]'}
          </button>
          {resetSent && (
            <p
              className="m-0 mt-[8px] text-center text-[8px] leading-[1.6]"
              style={{ color: '#7de87e', textShadow: '0 0 6px rgba(125,232,126,0.6)' }}
              role="status"
            >
              {resetSent}
            </p>
          )}
        </div>
      )}

      {formError && (
        <p
          data-testid="login-form-error"
          className="field-error m-0 mt-[14px] text-center text-[9px] leading-[1.6]"
          role="alert"
        >
          {formError}
        </p>
      )}

      <button
        ref={signIn}
        type="submit"
        disabled={busy}
        data-testid="login-submit"
        className="bracket-btn mag cut-corners mt-[15px] w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? '[ SIGNING IN... ]' : '[ LOG IN ]'}
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

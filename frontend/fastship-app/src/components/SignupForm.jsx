import { useState } from 'react'
import FieldRow from './FieldRow'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'
import { apiError } from '../api/client'

// Shared sign-up card for every role. Caller passes `fields`/`title`/
// `submitLabel`; everything else (chrome, validation, returning-user line)
// is identical across roles. Styling: .signup-card/.field-box/.bracket-btn/
// .field-error in index.css.
//
// `onSubmit` turns raw field values into that role's register payload;
// `validateFields` adds checks beyond required-and-matching.

const CARD_W = 470
const PAD_X = 30
const CONTENT_W = CARD_W - PAD_X * 2 - 4 // minus the 2px border either side

// Font advances 1em/char, so max size that fits one line = width / char count.
// Keeps long titles like "DELIVERY PARTNER SIGNUP" on one line, no hand-tuning.
function titleSize(title) {
  return Math.min(26, Math.floor(CONTENT_W / title.length))
}

// Separate hooks per button: opposite branches of the `registered` swap,
// only one ever exists.
const SUBMIT_PULL = { strength: 3 }

function SignupForm({ title, fields, submitLabel, onSubmit, validateFields }) {
  const { go } = useLoadingNav()
  const submit = useMagnetic(SUBMIT_PULL)
  const toLogin = useMagnetic(SUBMIT_PULL)
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ''])))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [registered, setRegistered] = useState(false)

  // Typing in a field clears just that field's message.
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
    setFormError('')
  }

  const validate = () => {
    // Caller checks run first so REQUIRED always wins on an empty field.
    const next = { ...(validateFields?.(values) ?? {}) }

    for (const f of fields) {
      if (!values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    }

    // Only flag mismatch once both boxes are filled, so it doesn't pile
    // on top of two REQUIRED messages.
    const pw = values.password
    const confirm = values.confirm
    if (!next.confirm && pw && confirm && pw !== confirm) {
      next.confirm = 'PASSWORDS DO NOT MATCH'
    }

    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await onSubmit(values)
      // Account isn't usable yet — /token refuses until the emailed
      // verification link is clicked, so don't send straight to /login.
      setRegistered(true)
    } catch (err) {
      setFormError(apiError(err, 'COULD NOT CREATE ACCOUNT'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // keeps native validation bubbles off; we render our own
      className="signup-card relative z-10 my-auto rounded-[6px]"
      style={{ width: CARD_W, maxWidth: '92vw', padding: `24px ${PAD_X}px 26px` }}
    >
      {/* CLEAN glow, not hero's .title-glow — that hard 4px offset ghosts at this size. */}
      <h1
        className="title-glow-clean m-0 text-center leading-none"
        style={{ fontSize: titleSize(title) }}
      >
        {title}
      </h1>

      {/* Submit button lives in the same gap container as the fields, so its
          spacing can't drift from a hand-tuned margin. Once registered, fields
          are replaced (not just disabled) — resubmit would only 409. */}
      {registered ? (
        <div className="mt-[34px] flex flex-col gap-[15px]">
          <p
            className="m-0 text-center text-[10px] leading-[1.9]"
            style={{ color: '#7de87e', textShadow: '0 0 8px rgba(125,232,126,0.7)' }}
            role="status"
          >
            ACCOUNT CREATED
            <br />
            CHECK YOUR EMAIL FOR THE VERIFICATION LINK
            <br />
            YOU CANNOT LOG IN UNTIL IT IS CLICKED
          </p>

          <button
            ref={toLogin}
            type="button"
            onClick={() => go('/login')}
            className="bracket-btn mag cut-corners w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none"
          >
            [ GO TO LOGIN ]
          </button>
        </div>
      ) : (
        <div className="mt-[34px] flex flex-col gap-[15px]">
          {fields.map((f) => (
            <FieldRow
              key={f.name}
              {...f}
              value={values[f.name]}
              onChange={set(f.name)}
              error={errors[f.name]}
            />
          ))}

          {formError && (
            <p className="field-error m-0 text-center text-[9px] leading-[1.6]" role="alert">
              {formError}
            </p>
          )}

          {/* Submit — same flex gap as the fields above it */}
          <button
            ref={submit}
            type="submit"
            disabled={busy}
            className="bracket-btn mag cut-corners w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? '[ CREATING... ]' : submitLabel}
          </button>
        </div>
      )}

      {/* Returning users */}
      <p className="m-0 mt-[18px] text-center text-[9px] leading-none text-white">
        OR{' '}
        <button
          type="button"
          onClick={() => go('/login')}
          className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[9px] leading-none text-fs-green underline-offset-[3px] transition-colors hover:text-fs-teal hover:underline"
        >
          LOGIN
        </button>{' '}
        IF YOU ARE ALREADY REGISTERED
      </p>
    </form>
  )
}

export default SignupForm

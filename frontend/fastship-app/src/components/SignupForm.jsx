import { useState } from 'react'
import FieldRow from './FieldRow'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'
import { apiError } from '../api/client'

// Shared sign-up card, used by every role's sign-up page. Callers pass the
// `fields` list, the `title` and the `submitLabel`; everything else — card
// chrome, field wells, icon sizing, validation and the returning-user line —
// is identical across roles so the pages can't drift apart.
//
// Styling lives in index.css: .signup-card / .field-box / .bracket-btn /
// .field-error.
//
// The role-specific parts stay with the caller: `onSubmit` receives the raw
// field values and is responsible for turning them into that role's register
// payload, and `validateFields` adds any checks beyond required-and-matching.

const CARD_W = 470
const PAD_X = 30
const CONTENT_W = CARD_W - PAD_X * 2 - 4 // minus the 2px border either side

// Press Start 2P advances exactly 1em per character, so the largest size that
// still fits on one line is content width / character count. Keeps long titles
// like "DELIVERY PARTNER SIGNUP" on a single line without hand-tuning.
function titleSize(title) {
  return Math.min(26, Math.floor(CONTENT_W / title.length))
}

// A gentle pull on a full-width bar — see the note in Track.jsx. The two
// buttons take separate hooks because they are in opposite branches of the
// `registered` swap and only ever one of them exists.
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
    // Caller checks run first so a REQUIRED message always wins on an empty
    // field — role validators only look at fields the user actually filled in.
    const next = { ...(validateFields?.(values) ?? {}) }

    for (const f of fields) {
      if (!values[f.name].trim()) next[f.name] = 'REQUIRED FIELD'
    }

    // Password match, checked only once both boxes have something in them so
    // the mismatch message doesn't pile on top of two REQUIRED messages.
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
      // Registration only creates the account — the backend emails a
      // verification link and /token refuses to issue a token until it is
      // clicked, so sending the user straight to /login would strand them.
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
      {/* Title, inside the card as in the reference. Uses the CLEAN glow — the
          hero's .title-glow carries a hard 4px offset step that ghosts at this
          size. Soft cyan/blue bloom only, no distortion layers. */}
      <h1
        className="title-glow-clean m-0 text-center leading-none"
        style={{ fontSize: titleSize(title) }}
      >
        {title}
      </h1>

      {/* Inputs. The submit button lives INSIDE this same gap container, so the
          space above it is structurally identical to the space between every
          field pair — it can't drift out of step with a hand-tuned margin.

          Once the account exists the fields are replaced rather than merely
          disabled: resubmitting the same address would only earn a 409. */}
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

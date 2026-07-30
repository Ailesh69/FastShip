import { useState } from 'react'
import FieldRow from './FieldRow'
import { useLoadingNav } from '../context/loadingNav'

// Shared sign-up card, used by every role's sign-up page. Callers pass the
// `fields` list, the `title` and the `submitLabel`; everything else — card
// chrome, field wells, icon sizing, validation and the returning-user line —
// is identical across roles so the pages can't drift apart.
//
// Styling lives in index.css: .signup-card / .field-box / .bracket-btn /
// .field-error.
//
// UI only: submitting runs client-side validation and logs. No API calls.

const CARD_W = 470
const PAD_X = 30
const CONTENT_W = CARD_W - PAD_X * 2 - 4 // minus the 2px border either side

// Press Start 2P advances exactly 1em per character, so the largest size that
// still fits on one line is content width / character count. Keeps long titles
// like "DELIVERY PARTNER SIGNUP" on a single line without hand-tuning.
function titleSize(title) {
  return Math.min(26, Math.floor(CONTENT_W / title.length))
}

function SignupForm({ title, fields, submitLabel }) {
  const { go } = useLoadingNav()
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ''])))
  const [errors, setErrors] = useState({})

  // Typing in a field clears just that field's message.
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const validate = () => {
    const next = {}

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length === 0) {
      // MOCK flow: no account is created and nothing is sent. Signing up drops
      // you at the login screen, matching a real signup -> login journey.
      go('/login')
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
          field pair — it can't drift out of step with a hand-tuned margin. */}
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

        {/* Submit — same flex gap as the fields above it */}
        <button
          type="submit"
          className="bracket-btn cut-corners w-full cursor-pointer py-[16px] font-[inherit] text-[16px] leading-none"
        >
          {submitLabel}
        </button>
      </div>

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

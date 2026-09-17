import { useRef, useState } from 'react'
import s from './ZipChipInput.module.css'

// Multi-value zip-code entry: each committed value becomes a removable chip.
// Not used by partner SIGNUP (needs fixed row height) — that's a plain
// comma input instead. This is for variable-height spots like profile edit.
//
// Commit on Enter/comma/blur. Backspace on empty box removes last chip.
// Duplicates ignored.
function ZipChipInput({ value, onChange, placeholder = 'ADD ZIP + ENTER', id }) {
  const [draft, setDraft] = useState('')
  const boxRef = useRef(null)

  const commit = (raw) => {
    const zip = raw.trim().replace(/,$/, '')
    if (!zip) return
    if (!value.includes(zip)) onChange([...value, zip])
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
      return
    }
    if (e.key === 'Backspace' && draft === '' && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <div
        className={`${s.wrap} cut-corners`}
        onClick={() => boxRef.current?.focus()}
        role="presentation"
      >
        {value.map((zip) => (
          <span key={zip} className={s.chip}>
            {zip}
            <button
              type="button"
              className={s.remove}
              onClick={(e) => {
                e.stopPropagation()
                onChange(value.filter((z) => z !== zip))
              }}
              aria-label={`Remove ${zip}`}
            >
              x
            </button>
          </span>
        ))}

        <input
          ref={boxRef}
          id={id}
          className={s.entry}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <p className={s.hint}>ENTER OR COMMA TO ADD &middot; BACKSPACE TO REMOVE LAST</p>
    </div>
  )
}

export default ZipChipInput

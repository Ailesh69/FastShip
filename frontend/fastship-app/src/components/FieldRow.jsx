// One bordered input row: pixel icon well on the left, label + input on the
// right, and an inline validation message underneath.
//
// Shared by every form on the site (all three sign-up roles and the login
// page) so field height, border, icon size and error styling can only ever be
// changed in one place. Styling lives in .field-box / .field-error in index.css.
function FieldRow({
  name,
  label,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}) {
  return (
    <div>
      <label className="signup-field flex cursor-text items-center gap-[8px]">
        <span className="field-box cut-corners flex h-[40px] w-[40px] shrink-0 items-center justify-center">
          <Icon />
        </span>

        <span className="field-box cut-corners flex h-[40px] flex-1 items-center gap-[6px] px-[10px]">
          <span className="shrink-0 text-[11px] leading-none text-[#bde9e8]">{label}</span>
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={error ? 'true' : undefined}
            className="w-full min-w-0 border-0 bg-transparent font-[inherit] text-[11px] leading-none outline-none"
          />
        </span>
      </label>

      {error && (
        <p className="field-error m-0 mt-[6px] pl-[48px] text-[8px] leading-none">{error}</p>
      )}
    </div>
  )
}

export default FieldRow

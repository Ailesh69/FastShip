import { useEffect, useRef, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
import ZipChipInput from '../components/ZipChipInput'
// Same visual language as the client Profile Editor — imported rather than
// duplicated, so the two editors can't drift apart. Partner-only extras
// (badges, chip row) live in the local module below.
import p from './ProfileEditor.module.css'
import s from './PartnerProfile.module.css'

// DELIVERY PARTNER — profile editor.
//
// UI only: PARTNER is mock data shaped like the API payload
// ({ name, email, zip_code, max_handling_capacity, serviceable_zip_codes,
//    email_verified, created_at }). Save just shows a local confirmation.

const PARTNER = {
  name: 'Rhea Malhotra',
  email: 'rhea.m@fastship.dev',
  zip_code: '94105',
  max_handling_capacity: 25,
  serviceable_zip_codes: ['94105', '94107', '94110', '94158'],
  email_verified: true,
  created_at: '2026-03-14',
  avatar:
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%232f7d6b'/%3E%3Crect x='4' y='2' width='8' height='3' fill='%23a8532c'/%3E%3Crect x='3' y='5' width='10' height='7' fill='%23f3cfa2'/%3E%3Crect x='5' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='9' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='6' y='10' width='4' height='1' fill='%23a83e2e'/%3E%3Crect x='2' y='12' width='12' height='4' fill='%237de87e'/%3E%3C/svg%3E",
}

const SECURITY = [
  { name: 'currentPassword', label: 'CURRENT PASSWORD:', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'NEW PASSWORD:', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'CONFIRM NEW PASSWORD:', autoComplete: 'new-password' },
]

const TEXT_ARC = 'M 26.6 148.9 A 92 92 0 1 1 193.4 148.9'

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

function PartnerProfile({ partner = PARTNER }) {
  const { go } = useLoadingNav()
  const [values, setValues] = useState({
    fullName: partner.name,
    email: partner.email,
    baseZip: partner.zip_code,
    capacity: String(partner.max_handling_capacity),
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [zips, setZips] = useState(partner.serviceable_zip_codes)
  const [photo, setPhoto] = useState(partner.avatar)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const objectUrl = useRef(null)

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setSaved(false)
  }

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setPhoto(objectUrl.current)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // UI-only build — nothing is sent anywhere.
    console.log('Partner profile (not saved):', { ...values, serviceable_zip_codes: zips })
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 w-full px-4 pb-10" noValidate>
      {/* Avatar + heading + read-only badges */}
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-center gap-[26px]">
        <button
          type="button"
          className={p.avatarBlock}
          onClick={() => fileRef.current?.click()}
          aria-label="Update profile photo"
        >
          <svg className={p.avatarRing} viewBox="0 0 220 220" aria-hidden="true">
            <circle className={p.ringPath} cx="110" cy="110" r="70" />
            <defs>
              <path id="partnerPhotoArc" d={TEXT_ARC} />
            </defs>
            <text className={p.ringText}>
              <textPath href="#partnerPhotoArc" startOffset="50%" textAnchor="middle">
                UPDATE PROFILE PHOTO
              </textPath>
            </text>
          </svg>
          <img className={p.avatarPhoto} src={photo} alt="" />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={p.hiddenFile}
          onChange={pickPhoto}
        />

        <div>
          <h1 className="title-glow-clean m-0 text-[18px] leading-[1.4]">
            PARTNER PROFILE EDITOR - {partner.name}
          </h1>
          <div className={s.meta}>
            <span className={`${s.badge} ${partner.email_verified ? s.badgeOk : s.badgeNo}`}>
              EMAIL VERIFIED: {partner.email_verified ? '✓' : '✗'}
            </span>
            <span className={`${s.badge} ${s.badgeInfo}`}>
              MEMBER SINCE: {formatDate(partner.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className={`${p.panel} cut-corners mx-auto mt-[26px]`}>
        <div className={p.topGrid}>
          <section>
            <h2 className={p.sectionHead}>[PERSONAL INFORMATION]</h2>
            <div className={p.rows}>
              <label className={p.row}>
                <span className={`${p.label} ${p.labelPersonal}`}>FULL NAME:</span>
                <span className={`${p.well} cut-corners`}>
                  <input
                    className={p.input}
                    type="text"
                    value={values.fullName}
                    onChange={set('fullName')}
                    autoComplete="name"
                  />
                </span>
              </label>
              <label className={p.row}>
                <span className={`${p.label} ${p.labelPersonal}`}>EMAIL ADDRESS:</span>
                <span className={`${p.well} cut-corners`}>
                  <input
                    className={p.input}
                    type="email"
                    value={values.email}
                    onChange={set('email')}
                    autoComplete="email"
                  />
                </span>
              </label>
              <label className={p.row}>
                <span className={`${p.label} ${p.labelPersonal}`}>BASE ZIP CODE:</span>
                <span className={`${p.well} cut-corners`}>
                  <input
                    className={p.input}
                    type="text"
                    value={values.baseZip}
                    onChange={set('baseZip')}
                    autoComplete="postal-code"
                    inputMode="numeric"
                  />
                </span>
              </label>
            </div>
          </section>

          <section className={p.colDivider}>
            <h2 className={p.sectionHead}>[ACCOUNT SECURITY]</h2>
            <div className={p.rows}>
              {SECURITY.map((f) => (
                <label key={f.name} className={p.row}>
                  <span className={`${p.label} ${p.labelSecurity}`}>{f.label}</span>
                  <span className={`${p.well} cut-corners`}>
                    <input
                      className={p.input}
                      type="password"
                      value={values[f.name]}
                      onChange={set(f.name)}
                      autoComplete={f.autoComplete}
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Partner-specific full-width section */}
        <div className={p.sectionRule}>
          <h2 className={p.sectionHead}>[DELIVERY CAPACITY]</h2>

          <label className={p.row}>
            <span className={`${p.label} ${p.addressLabel}`}>MAX HANDLING CAPACITY:</span>
            <span className={`${p.well} cut-corners`}>
              <input
                className={p.input}
                type="number"
                min="0"
                value={values.capacity}
                onChange={set('capacity')}
              />
            </span>
          </label>

          <div className={`${p.row} ${s.chipRow}`}>
            <span className={`${p.label} ${p.addressLabel} ${s.chipLabel}`}>
              SERVICEABLE ZIP CODES:
            </span>
            <span className={s.chipField}>
              <ZipChipInput
                value={zips}
                onChange={(next) => {
                  setZips(next)
                  setSaved(false)
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${p.actions} mt-[28px]`}>
        <button type="submit" className={`${p.actionBtn} ${p.save} cut-corners`}>
          [SAVE CHANGES]
        </button>
        <button
          type="button"
          onClick={() => go('/partner/dashboard')}
          className={`${p.actionBtn} ${p.cancel} cut-corners`}
        >
          [CANCEL]
        </button>
      </div>

      {saved && (
        <p className="mt-[14px] text-center text-[9px] leading-none text-fs-green">
          CHANGES CAPTURED LOCALLY &mdash; NOT SAVED (UI ONLY)
        </p>
      )}
    </form>
  )
}

export default PartnerProfile

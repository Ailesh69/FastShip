import { useEffect, useRef, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
// Same visual language as the client and partner profile editors — imported
// rather than duplicated, so the three editors can't drift apart. `p` carries
// the avatar/panel/row/button styles; `b` carries the read-only badge row.
import p from './ProfileEditor.module.css'
import b from './PartnerProfile.module.css'

// SELLER — profile editor.
//
// UI only: SELLER is mock data shaped EXACTLY like the /seller/me payload
// ({ name, email, zip_code, email_verified, created_at }). Deliberately no
// phone, address or extra sections — keeping the form matched to the schema is
// what stops it drifting the way the client editor did.

const SELLER = {
  name: 'Dev Kapoor',
  email: 'dev.kapoor@fastship.dev',
  zip_code: '10001',
  email_verified: true,
  created_at: '2026-02-08',
  avatar:
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%23b3542b'/%3E%3Crect x='4' y='2' width='8' height='3' fill='%232f2118'/%3E%3Crect x='3' y='5' width='10' height='7' fill='%23f3cfa2'/%3E%3Crect x='5' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='9' y='7' width='2' height='2' fill='%232a1a10'/%3E%3Crect x='6' y='10' width='4' height='1' fill='%23a83e2e'/%3E%3Crect x='2' y='12' width='12' height='4' fill='%23fbbf24'/%3E%3C/svg%3E",
}

const SECURITY = [
  { name: 'currentPassword', label: 'CURRENT PASSWORD:', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'NEW PASSWORD:', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'CONFIRM NEW PASSWORD:', autoComplete: 'new-password' },
]

// Arc for the curved "UPDATE PROFILE PHOTO" label — same geometry as the other
// two editors so the three avatars are identical.
const TEXT_ARC = 'M 26.6 148.9 A 92 92 0 1 1 193.4 148.9'

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

function SellerProfile({ seller = SELLER }) {
  const { go } = useLoadingNav()
  const [values, setValues] = useState({
    fullName: seller.name,
    email: seller.email,
    zip: seller.zip_code,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [photo, setPhoto] = useState(seller.avatar)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const objectUrl = useRef(null)

  // Revoke the last preview URL so picking several photos doesn't leak blobs.
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    if (saved) setSaved(false)
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
              <path id="sellerPhotoArc" d={TEXT_ARC} />
            </defs>
            <text className={p.ringText}>
              <textPath href="#sellerPhotoArc" startOffset="50%" textAnchor="middle">
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
            SELLER PROFILE EDITOR - {seller.name}
          </h1>
          <div className={b.meta}>
            <span className={`${b.badge} ${seller.email_verified ? b.badgeOk : b.badgeNo}`}>
              EMAIL VERIFIED: {seller.email_verified ? '✓' : '✗'}
            </span>
            <span className={`${b.badge} ${b.badgeInfo}`}>
              MEMBER SINCE: {formatDate(seller.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Form panel — exactly the five schema fields, nothing more */}
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
                <span className={`${p.label} ${p.labelPersonal}`}>ZIP CODE:</span>
                <span className={`${p.well} cut-corners`}>
                  <input
                    className={p.input}
                    type="text"
                    value={values.zip}
                    onChange={set('zip')}
                    autoComplete="postal-code"
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
      </div>

      {/* Actions */}
      <div className={`${p.actions} mt-[28px]`}>
        <button type="submit" className={`${p.actionBtn} ${p.save} cut-corners`}>
          [SAVE CHANGES]
        </button>
        <button
          type="button"
          onClick={() => go('/seller/dashboard')}
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

export default SellerProfile

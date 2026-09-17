import { useEffect, useRef, useState } from 'react'
import { useLoadingNav } from '../context/loadingNav'
import { useAuth } from '../context/auth'
import { getProfile } from '../api/auth'
import s from './ProfileEditor.module.css'

// USER PROFILE EDITOR (general / customer account).
// Styling is scoped to ProfileEditor.module.css (CSS Module); only shared
// globals used are title-glow-clean and cut-corners. No global CSS touched.
// UI only: field state is local, Save doesn't call the API.

// matches /client/me schema — { name, email, email_verified, created_at }.
// no phone/address: those don't exist on the endpoint
const PERSONAL = [
  { name: 'fullName', label: 'FULL NAME:', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'EMAIL ADDRESS:', type: 'email', autoComplete: 'email' },
]

const SECURITY = [
  { name: 'currentPassword', label: 'CURRENT PASSWORD:', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'NEW PASSWORD:', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'CONFIRM NEW PASSWORD:', autoComplete: 'new-password' },
]

const INITIAL = {
  fullName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

// arc for "UPDATE PROFILE PHOTO" label: 92px radius, 230° sweep (large-arc = 1)
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%237c5cc4'/%3E%3Crect x='3' y='5' width='10' height='7' fill='%23f3cfa2'/%3E%3Crect x='2' y='12' width='12' height='4' fill='%2322b8e0'/%3E%3C/svg%3E"

const TEXT_ARC = 'M 26.6 148.9 A 92 92 0 1 1 193.4 148.9'

function ProfileEditor() {
  const { go } = useLoadingNav()
  // session seeds fields so form isn't blank on first paint; GET /client/me replaces them
  const { user } = useAuth()
  const [values, setValues] = useState(() => ({
    ...INITIAL,
    fullName: user?.name ?? '',
    email: user?.email ?? '',
  }))
  const [photo, setPhoto] = useState(user?.avatar ?? DEFAULT_AVATAR)
  const fileRef = useRef(null)
  const objectUrl = useRef(null)

  // revoke last preview URL, avoids leaking blobs across multiple picks
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  // only overwrite the two schema fields — password boxes stay local, must survive mid-edit
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const profile = await getProfile('client')
        if (!cancelled) {
          setValues((v) => ({ ...v, fullName: profile.name, email: profile.email }))
        }
      } catch {
        // keep session-seeded values; navbar already shows the name, nothing else to say
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setPhoto(objectUrl.current)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // local only: client router has no profile-update endpoint
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 w-full px-4 pb-10" noValidate>
      {/* Avatar + heading, side by side as in the reference */}
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-center gap-[26px]">
        <button
          type="button"
          className={s.avatarBlock}
          onClick={() => fileRef.current?.click()}
          aria-label="Update profile photo"
        >
          <svg className={s.avatarRing} viewBox="0 0 220 220" aria-hidden="true">
            <circle className={s.ringPath} cx="110" cy="110" r="70" />
            <defs>
              <path id="profilePhotoArc" d={TEXT_ARC} />
            </defs>
            <text className={s.ringText}>
              <textPath href="#profilePhotoArc" startOffset="50%" textAnchor="middle">
                UPDATE PROFILE PHOTO
              </textPath>
            </text>
          </svg>
          <img
            className={s.avatarPhoto}
            src={photo}
            alt={values.fullName ? `${values.fullName}'s profile photo` : 'Profile photo'}
          />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={s.hiddenFile}
          onChange={pickPhoto}
        />

        <h1 className="title-glow-clean m-0 text-[20px] leading-none">
          USER PROFILE EDITOR - {user?.name ?? 'GUEST'}
        </h1>
      </div>

      {/* Form panel */}
      <div className={`${s.panel} cut-corners mx-auto mt-[26px]`}>
        <div className={s.topGrid}>
          {/* Left column */}
          <section>
            <h2 className={s.sectionHead}>[PERSONAL INFORMATION]</h2>
            <div className={s.rows}>
              {PERSONAL.map((f) => (
                <label key={f.name} className={s.row}>
                  <span className={`${s.label} ${s.labelPersonal}`}>{f.label}</span>
                  <span className={`${s.well} cut-corners`}>
                    <input
                      className={s.input}
                      type={f.type}
                      name={f.name}
                      value={values[f.name]}
                      onChange={set(f.name)}
                      autoComplete={f.autoComplete}
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Right column */}
          <section className={s.colDivider}>
            <h2 className={s.sectionHead}>[ACCOUNT SECURITY]</h2>
            <div className={s.rows}>
              {SECURITY.map((f) => (
                <label key={f.name} className={s.row}>
                  <span className={`${s.label} ${s.labelSecurity}`}>{f.label}</span>
                  <span className={`${s.well} cut-corners`}>
                    <input
                      className={s.input}
                      type="password"
                      name={f.name}
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
      <div className={`${s.actions} mt-[28px]`}>
        <button type="submit" className={`${s.actionBtn} ${s.save} cut-corners`}>
          [SAVE CHANGES]
        </button>
        <button
          type="button"
          onClick={() => go('/client/dashboard')}
          className={`${s.actionBtn} ${s.cancel} cut-corners`}
        >
          [CANCEL]
        </button>
      </div>
    </form>
  )
}

export default ProfileEditor

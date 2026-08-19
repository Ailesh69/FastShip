import { useEffect } from 'react'
import Reveal from '../motion/Reveal'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'

// 404 — the catch-all route.
//
// This used to be `<Navigate to="/" replace />`, which silently teleported the
// visitor home: a mistyped or dead link looked identical to a working one, and
// there was no way to tell you had gone somewhere that does not exist.
//
// Everything here is the site's existing vocabulary — the same `title-glow`
// heading treatment PathSignup's UNKNOWN PATH screen uses, the same
// `teal-outline-box` button as "ALREADY REGISTERED?" on the account-select
// page, and the shared grid/sprite background from the layout in App.jsx. No
// new colours, type sizes or components.
//
// `my-auto` centres the block in the space the shell leaves between the navbar
// and the footer, matching SelectPath and the sign-up cards.
function NotFound() {
  const { go } = useLoadingNav()
  const home = useMagnetic({ strength: 6 })

  // Soft-404 mitigation. A static host answers every unknown path with the SPA
  // shell and HTTP 200, so a crawler has no status code telling it this page is
  // missing and can index an endless supply of dead URLs. This is the signal it
  // does understand. Added and removed with the component so it is only ever
  // present on the 404 itself — leaving it behind would de-index a real page.
  //
  // If the host can be configured to return a real 404 status for unknown
  // paths, do that as well; this does not replace it.
  useEffect(() => {
    const tag = document.createElement('meta')
    tag.name = 'robots'
    tag.content = 'noindex, follow'
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [])

  return (
    <section className="relative z-10 my-auto flex flex-col items-center px-4 text-center">
      {/* One <h1> carrying the whole message. "404" alone would be a heading
          that says nothing to a crawler or a screen reader. */}
      <Reveal as="h1" variant="rise" className="title-glow m-0 text-[40px] leading-[1.35]">
        404
        <br />
        <span className="text-[20px]">PAGE NOT FOUND</span>
      </Reveal>

      <Reveal
        as="p"
        delay={110}
        className="m-0 mt-[28px] max-w-[440px] text-[18px] leading-[1.5] text-fs-ink"
        style={{ fontFamily: 'var(--font-term)' }}
      >
        This route is not on the map. The link may be mistyped, or whatever used
        to live here has shipped out.
      </Reveal>

      <Reveal delay={220} className="mt-[32px]">
        <button
          ref={home}
          type="button"
          onClick={() => go('/')}
          className="teal-outline-box mag cursor-pointer rounded-[4px] px-[20px] py-[18px] font-[inherit] text-[14px] leading-none"
        >
          RETURN TO BASE
        </button>
      </Reveal>

      {/* Plain <p>, not a <Reveal>: `blink` is a CSS animation on opacity and
          an animation beats the transition a reveal uses, so the two cannot
          share an element — same reason Home's PRESS START button is bare.
          See the transform/opacity ownership note in motion.css. */}
      <p className="blink m-0 mt-[26px] text-[10px] leading-none text-fs-teal">
        PRESS START TO CONTINUE
      </p>
    </section>
  )
}

export default NotFound

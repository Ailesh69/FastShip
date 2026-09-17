import { useEffect } from 'react'
import Reveal from '../motion/Reveal'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'

// 404 — catch-all route. Used to redirect silently to "/"; now actually shows
// a not-found page so a dead link doesn't look like a working one.
// Reuses existing styles (title-glow, teal-outline-box, shared background) —
// no new colours/components. `my-auto` centres it like SelectPath.
function NotFound() {
  const { go } = useLoadingNav()
  const home = useMagnetic({ strength: 6 })

  // Soft-404 fix: static host returns 200 for every path, so tell crawlers via
  // meta robots instead. Tag added/removed with the component so it never
  // lingers on a real page. Doesn't replace a proper server-side 404 if available.
  useEffect(() => {
    const tag = document.createElement('meta')
    tag.name = 'robots'
    tag.content = 'noindex, follow'
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [])

  return (
    <section className="relative z-10 my-auto flex flex-col items-center px-4 text-center">
      {/* one <h1> for the whole message — "404" alone means nothing to a screen reader */}
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

      {/* plain <p>, not <Reveal>: `blink` animation and Reveal's transition can't share an element */}
      <p className="blink m-0 mt-[26px] text-[10px] leading-none text-fs-teal">
        PRESS START TO CONTINUE
      </p>
    </section>
  )
}

export default NotFound

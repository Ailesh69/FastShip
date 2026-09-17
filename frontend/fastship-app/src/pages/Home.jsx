import { useState } from 'react'
import { createPortal } from 'react-dom'
import Hero from '../components/Hero'
import FastShipIntro from '../components/intro/FastShipIntro'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'

const INTRO_STORAGE_KEY = 'fastship:intro-played'

// HOME / landing page — FASTSHIP hero intro plus the blinking "insert coin" prompt.
// Pixel-art intro (src/components/intro) plays once per session, above
// everything else. introDone mirrors sessionStorage so a repeat visit this
// session skips the overlay and any hidden-content flash.
function Home() {
  const { go } = useLoadingNav()
  // only CTA on the page, so it's the one element that gets magnetic pull
  const start = useMagnetic({ strength: 7 })
  const [introDone, setIntroDone] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1',
  )

  return (
    <>
      {/* portaled to <body>: <main>/<footer> are sibling stacking contexts, footer
          wins DOM-order ties and would trap this behind it despite z-index:9999 */}
      {!introDone &&
        createPortal(<FastShipIntro onComplete={() => setIntroDone(true)} />, document.body)}

      {/* mirrors <main>'s flex props so the button's my-auto has space to center into */}
      <div
        className="flex w-full flex-1 flex-col items-center"
        style={{ opacity: introDone ? 1 : 0, transition: 'opacity 600ms ease' }}
      >
        {/* hero assembles once intro is done, see revealWhen in Hero.jsx */}
        <Hero revealWhen={introDone} />

        {/* my-auto centers this between stat row and footer.
            no <Reveal>: blink is a CSS opacity animation and would just ignore
            Reveal's transition; the magnet is transform-only so it still coexists */}
        <button
          ref={start}
          type="button"
          onClick={() => go('/signup')}
          className="blink mag relative z-10 my-auto cursor-pointer bg-transparent px-[16px] py-[10px] text-center font-[inherit] text-[18px] leading-[1.4]"
          style={{
            border: '3px dashed var(--color-fs-orange)',
            color: 'var(--color-fs-teal)',
            textShadow: '0 0 6px rgba(34,211,238,0.85), 0 0 16px rgba(34,211,238,0.5)',
          }}
        >
          PRESS START
          <br />
          TO SHOP
        </button>
      </div>
    </>
  )
}

export default Home

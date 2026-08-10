import { useState } from 'react'
import { createPortal } from 'react-dom'
import Hero from '../components/Hero'
import FastShipIntro from '../components/intro/FastShipIntro'
import { useLoadingNav } from '../context/loadingNav'

const INTRO_STORAGE_KEY = 'fastship:intro-played'

// HOME / landing page — the FASTSHIP hero intro plus the blinking
// "insert coin" prompt that sits down in the empty floor area.
//
// The cinematic pixel-art intro (src/components/intro) plays once per
// session, above everything else, before this content is visible. introDone
// mirrors its own sessionStorage flag so a repeat visit this session never
// mounts the overlay or shows a hidden-content flash.
function Home() {
  const { go } = useLoadingNav()
  const [introDone, setIntroDone] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1',
  )

  return (
    <>
      {/* Portaled to <body>: <main> and <footer> (App.jsx/Footer.jsx) are both
          `relative z-10` siblings, each their own stacking context — footer
          wins ties as the later one in DOM order, which traps anything
          rendered inside <main> (including this, at Home's normal position)
          behind it regardless of the intro's own z-index:9999. Rendering
          straight onto <body> escapes that entirely. */}
      {!introDone &&
        createPortal(<FastShipIntro onComplete={() => setIntroDone(true)} />, document.body)}

      {/* flex-1/flex-col/items-center mirrors <main>'s own flex properties
          (App.jsx) — the button's `my-auto` needs THIS element's leftover
          space to distribute into, or it collapses flush under the hero
          instead of centering below it. */}
      <div
        className="flex w-full flex-1 flex-col items-center"
        style={{ opacity: introDone ? 1 : 0, transition: 'opacity 600ms ease' }}
      >
        <Hero />

        {/* Blinking prompt: dashed orange frame, teal text, transparent fill.
            `my-auto` splits the leftover space above evenly above and below,
            so the prompt sits centred between the stat row and the footer
            rather than leaving a gap where the CTA button used to be. */}
        <button
          type="button"
          onClick={() => go('/signup')}
          className="blink relative z-10 my-auto cursor-pointer bg-transparent px-[16px] py-[10px] text-center font-[inherit] text-[18px] leading-[1.4]"
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

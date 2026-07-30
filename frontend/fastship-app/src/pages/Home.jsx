import Hero from '../components/Hero'
import { useLoadingNav } from '../context/loadingNav'

// HOME / landing page — the FASTSHIP hero intro plus the blinking
// "insert coin" prompt that sits down in the empty floor area.
function Home() {
  const { go } = useLoadingNav()

  return (
    <>
      <Hero />

      {/* Blinking prompt: dashed orange frame, teal text, transparent fill.
          `my-auto` splits the leftover space in <main> evenly above and below,
          so the prompt sits centred between the stat row and the footer rather
          than leaving a gap where the CTA button used to be. */}
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
    </>
  )
}

export default Home

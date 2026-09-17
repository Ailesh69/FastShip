import Reveal from '../motion/Reveal'
import useMagnetic from '../motion/useMagnetic'
import { useLoadingNav } from '../context/loadingNav'

// Styling reuses existing site vocabulary only — `signup-card` for the panel,
// `title-glow-clean` / `teal-glow` for headings, VT323 for body copy, and
// `bracket-btn` for the outbound link. No new colours or components.

const GITHUB_URL = 'https://github.com/Ailesh69'
const REPO_URL = 'https://github.com/Ailesh69/FastShip'

const INTRO =
  'I build full-stack web apps, and I learn by shipping them end to end rather than by following tutorials to the last step.'

// Straight from requirements.txt / package.json — keep these honest.
const STACK = [
  ['BACKEND', 'FastAPI · SQLModel · Alembic · PostgreSQL'],
  ['ASYNC', 'Celery · Redis · async SQLAlchemy'],
  ['AUTH', 'JWT · passlib/bcrypt · email verification'],
  ['FRONTEND', 'React · React Router · Vite · Tailwind'],
  ['TESTING', 'pytest · pytest-asyncio'],
]

const CARD_W = 660

function About() {
  const { go } = useLoadingNav()
  const github = useMagnetic({ strength: 4 })
  const start = useMagnetic({ strength: 4 })

  return (
    <section className="relative z-10 my-auto flex w-full flex-col items-center px-4 py-8">
      <div
        className="signup-card rounded-[6px]"
        style={{ width: CARD_W, maxWidth: '92vw', padding: '30px 34px 34px' }}
      >
        <Reveal as="h1" className="title-glow-clean m-0 text-center text-[22px] leading-none">
          ABOUT ME
        </Reveal>

        <Reveal
          as="p"
          delay={90}
          className="m-0 mt-[26px] text-[18px] leading-[1.6] text-fs-ink"
          style={{ fontFamily: 'var(--font-term)' }}
        >
          {INTRO}
        </Reveal>

        <Reveal
          as="p"
          delay={160}
          className="m-0 mt-[16px] text-[18px] leading-[1.6] text-fs-ink"
          style={{ fontFamily: 'var(--font-term)' }}
        >
          <span className="teal-glow">FastShip is that learning project.</span> I built it while
          teaching myself FastAPI, and it grew into a full e-commerce and shipment-tracking
          platform: three account types with their own dashboards, background jobs for email,
          token-based password resets, and a server-rendered tracking page — all wrapped in an
          8-bit arcade skin.
        </Reveal>

        {/* Stack — the honest list, read off the dependency files. */}
        <Reveal as="h2" delay={230} className="gold-glow m-0 mt-[28px] text-[12px] leading-none">
          BUILT WITH
        </Reveal>

        <dl className="m-0 mt-[16px] flex flex-col gap-[10px]">
          {STACK.map(([label, value], i) => (
            <Reveal
              key={label}
              delay={290 + i * 60}
              className="flex flex-wrap items-baseline gap-x-[14px] gap-y-[4px]"
            >
              <dt className="w-[86px] shrink-0 text-[9px] leading-[1.6] text-[#8fb6b4]">{label}</dt>
              <dd
                className="m-0 flex-1 text-[17px] leading-[1.5] text-white"
                style={{ fontFamily: 'var(--font-term)' }}
              >
                {value}
              </dd>
            </Reveal>
          ))}
        </dl>

        {/* Outbound links. Real anchors, not go() — these leave the SPA.
            rel="noopener noreferrer" because they open in a new tab. */}
        <Reveal delay={620} className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
          <a
            ref={github}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bracket-btn mag cut-corners cursor-pointer px-[18px] py-[14px] font-[inherit] text-[12px] leading-none no-underline"
          >
            [ MY GITHUB ]
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-link self-center text-[11px] leading-none"
          >
            SOURCE FOR THIS SITE
          </a>
        </Reveal>

        <Reveal delay={700} className="mt-[26px] flex justify-center">
          <button
            ref={start}
            type="button"
            onClick={() => go('/signup')}
            className="teal-outline-box mag cursor-pointer rounded-[4px] px-[20px] py-[16px] font-[inherit] text-[13px] leading-none"
          >
            START YOUR QUEST
          </button>
        </Reveal>
      </div>
    </section>
  )
}

export default About

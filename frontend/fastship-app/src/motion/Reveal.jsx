import { useEffect, useRef } from 'react'

// Scroll reveal. Wraps NOTHING — it renders the element you ask for, with the
// className you pass, so dropping it into existing markup changes no layout:
//
//   <h1 className="title-glow ...">FASTSHIP</h1>
//   <Reveal as="h1" className="title-glow ...">FASTSHIP</Reveal>
//
// The resting state is `transform: none` (see [data-reveal='in'] in
// motion.css), i.e. exactly where index.css already put the element. The
// reveal is purely the journey to that position.
//
// One IntersectionObserver is shared by every Reveal on the page rather than
// one per element, and each element is unobserved the moment it fires — a
// dashboard with forty revealed rows ends up with zero live observations.

let observer = null
const callbacks = new WeakMap()

function sharedObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const fire = callbacks.get(entry.target)
        if (fire) fire()
        callbacks.delete(entry.target)
        observer.unobserve(entry.target)
      }
    },
    {
      // POSITIVE bottom margin — the root is the viewport EXTENDED 12% below
      // the fold, so an element starts moving just before it scrolls into
      // view and is settled by the time it is properly on screen.
      //
      // The sign matters for correctness, not just for feel. A negative margin
      // shrinks the root, and anything that comes to rest inside that dead
      // band can never intersect — on an 834px-wide viewport that stranded
      // "SELECT YOUR PATH" permanently at opacity 0, on screen and unreadable,
      // because the page could only scroll 112px and the heading sat below the
      // shrunken edge. An expanded root is always a superset of the viewport,
      // so anything the user can see has already fired.
      rootMargin: '0px 0px 12% 0px',
      threshold: 0,
    },
  )
  return observer
}

const VARIANT_CLASS = {
  up: '', // default: 16px rise, defined on [data-reveal='out']
  rise: 'rv-rise',
  pop: 'rv-pop',
  left: 'rv-left',
  right: 'rv-right',
  fade: 'rv-fade',
}

/**
 * @param as       element/component to render (default 'div')
 * @param variant  'up' | 'rise' | 'pop' | 'left' | 'right' | 'fade'
 * @param delay    stagger in ms
 * @param enabled  when false the element stays hidden and is not observed —
 *                 used by pages whose content is covered until something else
 *                 finishes (the home page's intro), so the reveal isn't spent
 *                 behind a curtain
 */
function Reveal({
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  enabled = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    // Already revealed (e.g. `enabled` flipped after a re-render) — leave it.
    if (el.dataset.reveal === 'in') return

    const io = sharedObserver()
    callbacks.set(el, () => {
      el.dataset.reveal = 'in'
    })
    io.observe(el)

    return () => {
      callbacks.delete(el)
      io.unobserve(el)
    }
  }, [enabled])

  const variantClass = VARIANT_CLASS[variant] ?? ''

  return (
    <Tag
      ref={ref}
      data-reveal="out"
      className={variantClass ? `${variantClass} ${className}` : className}
      style={delay ? { ...style, '--rv-delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal

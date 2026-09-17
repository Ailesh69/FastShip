import { useEffect, useRef } from 'react'

// Scroll reveal. Renders as the element you ask for (no wrapper), so it
// drops into existing markup without changing layout. Resting state is
// `transform: none` ([data-reveal='in'] in motion.css) — same spot index.css
// already puts it; the reveal is just the journey there.
//
// One shared IntersectionObserver for all Reveals, unobserved on fire.

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
      // Positive bottom margin only — root must stay a superset of the
      // viewport. A negative margin once stranded "SELECT YOUR PATH" at
      // opacity 0 forever on a short viewport (dead band never intersected).
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
 * @param enabled  false = stays hidden, not observed (e.g. behind the home
 *                 page intro curtain, so the reveal isn't wasted)
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

    // Already revealed — leave it (e.g. `enabled` flipped after re-render).
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

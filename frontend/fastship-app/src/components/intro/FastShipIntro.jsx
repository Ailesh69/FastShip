import { useCallback, useEffect, useRef, useState } from 'react';
import FastShipIntroEngine, { BEATS } from './introEngine';
import './fastship-intro.css';

/**
 * Full-screen cinematic intro for the FastShip landing page.
 *
 *   <FastShipIntro onComplete={() => setIntroDone(true)} />
 *
 * Renders a fixed overlay, plays ~9.6s, fades out, then calls onComplete and
 * unmounts itself. Click, Escape, or the Skip button jumps to the end.
 */
export default function FastShipIntro({
  onComplete,
  title = 'FASTSHIP',
  tagline = 'THE RETRO E-COMMERCE ADVENTURE',
  speed = 1,
  pixelSize = 3,
  once = true,
  storageKey = 'fastship:intro-played',
}) {
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const engineRef = useRef(null);
  const finishedRef = useRef(false);

  const [mounted, setMounted] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (once && window.sessionStorage.getItem(storageKey) === '1') return false;
    return true;
  });
  const [leaving, setLeaving] = useState(false);

  const complete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (once && typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, '1');
    }
    setLeaving(true);
    window.setTimeout(() => {
      setMounted(false);
      if (onComplete) onComplete();
    }, 620);
  }, [onComplete, once, storageKey]);

  // Drop the landing page's scenery out of frame while intro covers screen
  // (see `.fsi-playing` in fastship-intro.css). Class comes off as soon as
  // `leaving` flips, so the scene is already painting under the fade-out.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('fsi-playing', mounted && !leaving);
    return () => root.classList.remove('fsi-playing');
  }, [mounted, leaving]);

  // if the intro is being skipped entirely, still tell the parent
  useEffect(() => {
    if (!mounted && !finishedRef.current) {
      finishedRef.current = true;
      if (onComplete) onComplete();
    }
  }, [mounted, onComplete]);

  useEffect(() => {
    if (!mounted) return undefined;

    const engine = new FastShipIntroEngine(canvasRef.current, {
      pixelSize,
      speed,
      onComplete: complete,
      onFrame: (s) => {
        const el = titleRef.current;
        if (!el) return;
        el.style.opacity = String(s.titleOpacity);
        el.style.transform = `translate(-50%, -50%) scale(${s.titleScale.toFixed(4)})`;
        el.style.filter = s.titleBlur > 0.15 ? `blur(${s.titleBlur.toFixed(2)}px)` : 'none';
        if (s.phase === 'settled') el.dataset.settled = 'true';
      },
    });
    engineRef.current = engine;
    engine.start();
    // No reduced-motion early finish() — see motionPolicy.js, site doesn't
    // honour that preference by design. finish() itself still used by Skip/Escape/click.

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') complete();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      engine.destroy();
    };
  }, [mounted, complete, pixelSize, speed]);

  if (!mounted) return null;

  return (
    <div
      className={`fsi-root${leaving ? ' fsi-leaving' : ''}`}
      onClick={complete}
      role="presentation"
    >
      <canvas ref={canvasRef} className="fsi-canvas" aria-hidden="true" />

      <div ref={titleRef} className="fsi-titleblock" style={{ opacity: 0 }}>
        {/* <div>, not <h1> — an <h1> here would duplicate Hero.jsx's real
            heading while both are mounted. Decorative only; .fsi-sr below
            handles the screen-reader announcement. Purely semantic change,
            styling is all class-based. */}
        <div className="fsi-title" data-text={title}>
          {title}
        </div>
        <p className="fsi-tagline">{tagline}</p>
      </div>

      <div className="fsi-scanlines" aria-hidden="true" />
      <div className="fsi-vignette" aria-hidden="true" />

      <button
        type="button"
        className="fsi-skip"
        onClick={(e) => {
          e.stopPropagation();
          complete();
        }}
      >
        Skip intro
      </button>

      <span className="fsi-sr">{title} — {tagline}</span>
    </div>
  );
}

export { BEATS };

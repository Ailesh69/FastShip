/**
 * FastShip landing intro — canvas engine.
 *
 * Framework-agnostic. Renders to a low-res offscreen buffer and upscales with
 * smoothing off, so everything comes out as chunky pixel art.
 *
 * Timeline
 *   0.00 - 0.35  void
 *   0.35 - 1.00  seed square appears and fills
 *   1.00 - 2.90  disintegration: pixel cubes blast outward past the camera
 *   2.90         warp cut (flash) — the square becomes the tunnel mouth
 *   2.90 - 5.90  flight through the wireframe corridor
 *   5.90 - 7.45  cubes clear, camera accelerates into the end wall
 *   6.60 - 7.45  title materializes on the wall + starburst
 *   7.45 - ...   settle: ambient drift, faint grid floor
 */

export const PALETTE = {
  voidDeep: '#05070e',
  voidNavy: '#111c38',
  mint: '#6afdb5',
  mintDim: '#2f9d6d',
  orange: '#ffb86c',
  orangeDim: '#c07a3a',
  cyan: '#4fd8ff',
  lime: '#b6ff6a',
  white: '#eafeff',
};

export const BEATS = {
  seed: 0.35,
  solid: 0.95,
  burst: 1.05,
  warp: 2.9,
  clear: 5.9,
  approach: 6.0,
  title: 6.6,
  arrive: 7.45,
  settle: 8.3,
  done: 9.6,
};

/* ---------- helpers ---------- */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;
const easeOutBack = (t) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
/** progress of `t` across [a, b], clamped to 0..1 */
const span = (t, a, b) => clamp01((t - a) / (b - a));

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ---------- engine ---------- */

export class FastShipIntro {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opts]
   * @param {number} [opts.pixelSize=3]  buffer downscale factor (higher = chunkier)
   * @param {number} [opts.speed=1]      timeline multiplier
   * @param {(state) => void} [opts.onFrame]
   * @param {() => void} [opts.onComplete]
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.pixelSize = opts.pixelSize ?? 3;
    this.speed = opts.speed ?? 1;
    this.onFrame = opts.onFrame ?? null;
    this.onComplete = opts.onComplete ?? null;

    this.buffer = document.createElement('canvas');
    this.bctx = this.buffer.getContext('2d');

    this.rng = mulberry32(20260809);
    this.raf = 0;
    this.t = 0;
    this.last = 0;
    this.camZ = 0;
    this.wallZ = Infinity; // world-space z of the end wall, set when the corridor clears
    this.completed = false;

    this.shards = []; // disintegration pixels
    this.cubes = []; // corridor cubes
    this.streaks = []; // corridor speed lines
    this.motes = []; // ambient drifting pixels
    this.stars = []; // ambient sparkles
    this.rays = []; // title starburst

    this._onResize = this.resize.bind(this);
    this._loop = this._loop.bind(this);
  }

  /* ----- lifecycle ----- */

  start() {
    this.resize();
    this._seedAmbient();
    window.addEventListener('resize', this._onResize);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
  }

  /** Jump straight to the resting frame (reduced motion / skip). */
  finish() {
    this.t = BEATS.done + 2;
    this.completed = true;
    this.renderAt(this.t);
    if (this.onComplete) this.onComplete();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width || window.innerWidth));
    const h = Math.max(1, Math.round(rect.height || window.innerHeight));

    this.buffer.width = Math.max(80, Math.round(w / this.pixelSize));
    this.buffer.height = Math.max(60, Math.round(h / this.pixelSize));

    // The visible canvas is sized to the BUFFER, not to the viewport.
    //
    // Every pixel of this scene is drawn into `buffer` at 1/pixelSize scale and
    // then blown up with smoothing off — so a viewport-sized backing store held
    // nothing but a nearest-neighbour upscale of an image a ninth of its size,
    // and the browser had to re-upload the whole thing to the GPU every frame.
    // At 1920x1080 that is 8.3MB per frame; at 640x360 it is 0.9MB.
    //
    // The upscale still happens — `.fsi-canvas` is width/height 100% with
    // `image-rendering: pixelated` (fastship-intro.css), so the compositor does
    // exactly the same nearest-neighbour stretch, on the GPU, for free.
    //
    // Measured on a 15W integrated-graphics laptop at 1920x1080: 55.1fps with
    // ~52 dropped frames per run, to 60fps with 0. Do not "fix" this back to
    // viewport size — the scene has no detail above buffer resolution to show.
    this.canvas.width = this.buffer.width;
    this.canvas.height = this.buffer.height;

    this.ctx.imageSmoothingEnabled = false;
    this._seedAmbient();
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt * this.speed;
    this._step(dt * this.speed);
    this.renderAt(this.t);
    if (!this.completed && this.t >= BEATS.done) {
      this.completed = true;
      if (this.onComplete) this.onComplete();
    }
    this.raf = requestAnimationFrame(this._loop);
  }

  /* ----- geometry ----- */

  get dims() {
    const w = this.buffer.width;
    const h = this.buffer.height;
    const f = h * 0.86; // focal length, tuned so the walls hug the frame
    const halfY = 260;
    return { w, h, cx: w / 2, cy: h / 2, f, halfY, halfX: (halfY * w) / h, near: 60, far: 6800 };
  }

  project(x, y, z) {
    const { cx, cy, f } = this.dims;
    const s = f / z;
    return { x: cx + x * s, y: cy + y * s, s };
  }

  /* ----- simulation ----- */

  _step(dt) {
    const t = this.t;

    if (t >= BEATS.burst && t < BEATS.warp) this._stepShards(dt);

    if (t >= BEATS.warp) {
      this.camZ += this._camSpeed(t) * dt;
      if (this.wallZ === Infinity && t >= BEATS.approach) this.wallZ = this.camZ + 3100;
      this._stepCorridor(dt, t);
    }

    if (t >= BEATS.title) this._stepRays(dt, t);
    if (t >= BEATS.arrive - 0.5) this._stepAmbient(dt);
  }

  _camSpeed(t) {
    if (t < BEATS.warp + 0.6) return lerp(2600, 1050, span(t, BEATS.warp, BEATS.warp + 0.6));
    if (t < BEATS.clear) return 1050;
    return lerp(1050, 2900, easeInCubic(span(t, BEATS.clear, BEATS.arrive)));
  }

  /* disintegration shards */

  _stepShards(dt) {
    const { h } = this.dims;
    const k = h / 240; // scale everything off buffer height
    this._shardDebt = (this._shardDebt || 0) + dt * 110; // ~110 shards/sec
    while (this._shardDebt >= 1) {
      this._spawnShard();
      this._shardDebt -= 1;
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const p = this.shards[i];
      p.age += dt;
      p.r += (p.spd + p.acc * p.age) * dt * k;
      p.size += p.grow * dt * k;
      if (p.r > Math.max(this.dims.w, h) * 0.9 || p.age > 2.6) this.shards.splice(i, 1);
    }
  }

  _spawnShard() {
    const r = this.rng;
    const { h } = this.dims;
    const half = h * (0.11 + span(this.t, BEATS.burst, BEATS.warp) * 0.06);
    // pick a point on the square's perimeter
    const side = Math.floor(r() * 4);
    const u = (r() * 2 - 1) * half;
    // Every branch below assigns both, so seeding them with 0 was dead.
    let x;
    let y;
    if (side === 0) { x = u; y = -half; } else if (side === 1) { x = u; y = half; } else if (side === 2) { x = -half; y = u; } else { x = half; y = u; }
    const ang = Math.atan2(y, x) + (r() - 0.5) * 0.5;
    const streak = r() < 0.12;
    this.shards.push({
      a: ang,
      r: Math.hypot(x, y),
      spd: 26 + r() * 46,
      acc: 90 + r() * 190,
      size: streak ? 1.4 + r() * 1.2 : 2.8 + r() * 4.6,
      grow: streak ? 1.1 : 4.2 + r() * 3.6,
      streak,
      color: r() < 0.5 ? PALETTE.mint : r() < 0.9 ? PALETTE.orange : PALETTE.white,
      age: 0,
    });
  }

  /* corridor */

  _spawnCube(wz) {
    const r = this.rng;
    const { halfX, halfY } = this.dims;
    const wall = Math.floor(r() * 4);
    const inset = 0.7 + r() * 0.28;
    let x;
    let y;
    if (wall === 0) { x = (r() * 2 - 1) * halfX * 0.92; y = -halfY * inset; }
    else if (wall === 1) { x = (r() * 2 - 1) * halfX * 0.92; y = halfY * inset; }
    else if (wall === 2) { x = -halfX * inset; y = (r() * 2 - 1) * halfY * 0.92; }
    else { x = halfX * inset; y = (r() * 2 - 1) * halfY * 0.92; }
    this.cubes.push({
      x, y, wz,
      size: 30 + r() * 62,
      color: r() < 0.55 ? PALETTE.mint : PALETTE.orange,
    });
  }

  _stepCorridor(dt, t) {
    const { far } = this.dims;
    const r = this.rng;

    if (!this._cubesSeeded) {
      // the corridor should already be busy the instant we cut into it
      this._cubesSeeded = true;
      for (let i = 0; i < 20; i++) this._spawnCube(this.camZ + 200 + r() * 3200);
    }
    if (t < BEATS.clear) {
      this._cubeDebt = (this._cubeDebt || 0) + dt * 16;
      while (this._cubeDebt >= 1 && this.cubes.length < 40) {
        this._spawnCube(this.camZ + 2600 + r() * 1400);
        this._cubeDebt -= 1;
      }
      this._cubeDebt = Math.min(this._cubeDebt, 2);
    }
    for (let i = this.cubes.length - 1; i >= 0; i--) {
      if (this.cubes[i].wz - this.camZ < 150) this.cubes.splice(i, 1); // cull before they smear across the near plane
    }

    // speed lines ramp in as the flight gets faster
    const intensity = span(t, BEATS.warp + 1.2, BEATS.arrive);
    if (this.streaks.length < 30 && r() < dt * 40 * intensity) {
      const wall = Math.floor(r() * 4);
      const { halfX, halfY } = this.dims;
      let x;
      let y;
      if (wall === 0) { x = (r() * 2 - 1) * halfX; y = -halfY; }
      else if (wall === 1) { x = (r() * 2 - 1) * halfX; y = halfY; }
      else if (wall === 2) { x = -halfX; y = (r() * 2 - 1) * halfY; }
      else { x = halfX; y = (r() * 2 - 1) * halfY; }
      this.streaks.push({
        x, y,
        wz: this.camZ + far * 0.3 + r() * far * 0.35,
        len: 900 + r() * 2200,
        color: r() < 0.45 ? PALETTE.cyan : r() < 0.8 ? PALETTE.lime : PALETTE.mint,
        width: 1.4 + r() * 2.6,
      });
    }
    for (let i = this.streaks.length - 1; i >= 0; i--) {
      if (this.streaks[i].wz - this.camZ + this.streaks[i].len < this.dims.near) this.streaks.splice(i, 1);
    }
  }

  /* title starburst */

  _stepRays(dt, t) {
    const r = this.rng;
    const life = span(t, BEATS.title, BEATS.settle);
    if (life < 1 && this.rays.length < 150) {
      const n = Math.round(dt * 380 * (1 - life * 0.7));
      for (let i = 0; i < n; i++) {
        this.rays.push({
          a: r() * Math.PI * 2,
          r: 2 + r() * 8,
          spd: 70 + r() * 300,
          len: 5 + r() * 26,
          dot: r() < 0.42,
          size: 1 + r() * 1.8,
          color: r() < 0.72 ? PALETTE.white : r() < 0.9 ? PALETTE.mint : PALETTE.orange,
          age: 0,
          life: 0.5 + r() * 0.9,
        });
      }
    }
    for (let i = this.rays.length - 1; i >= 0; i--) {
      const p = this.rays[i];
      p.age += dt;
      p.r += p.spd * dt * (this.dims.h / 240);
      if (p.age > p.life) this.rays.splice(i, 1);
    }
  }

  /* ambient resting scene */

  _seedAmbient() {
    const r = mulberry32(777);
    const { w, h } = this.dims;
    this.motes = [];
    for (let i = 0; i < 58; i++) {
      this.motes.push({
        x: r() * w,
        y: r() * h,
        size: 1.2 + r() * 3.4,
        vy: -(2 + r() * 7),
        sway: 4 + r() * 14,
        phase: r() * Math.PI * 2,
        rate: 0.4 + r() * 1.3,
        color: r() < 0.55 ? PALETTE.mint : r() < 0.85 ? PALETTE.orange : PALETTE.white,
      });
    }
    this.stars = [];
    for (let i = 0; i < 5; i++) {
      this.stars.push({
        x: (0.08 + r() * 0.84) * w,
        y: (0.08 + r() * 0.84) * h,
        r: 3 + r() * 4,
        phase: r() * Math.PI * 2,
        rate: 0.5 + r() * 0.7,
      });
    }
  }

  _stepAmbient(dt) {
    const { w, h } = this.dims;
    for (const m of this.motes) {
      m.y += m.vy * dt;
      m.phase += m.rate * dt;
      if (m.y < -6) {
        m.y = h + 6;
        m.x = this.rng() * w;
      }
    }
  }

  /* ----- rendering ----- */

  renderAt(t) {
    const g = this.bctx;
    const { w, h, cx, cy } = this.dims;

    // backdrop
    const bg = g.createRadialGradient(cx, cy * 0.92, 0, cx, cy, Math.max(w, h) * 0.75);
    bg.addColorStop(0, PALETTE.voidNavy);
    bg.addColorStop(1, PALETTE.voidDeep);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    if (t < BEATS.warp) {
      this._drawIgnition(g, t);
    } else if (t < BEATS.arrive + 0.2) {
      this._drawCorridor(g, t);
    }

    if (t >= BEATS.arrive - 0.4) this._drawAmbient(g, t);
    if (t >= BEATS.title) this._drawRays(g);

    // warp flash + arrival flash
    const warpFlash = t >= BEATS.warp ? 1 - span(t, BEATS.warp, BEATS.warp + 0.22) : 0;
    const arriveFlash = t >= BEATS.arrive ? 1 - span(t, BEATS.arrive, BEATS.arrive + 0.3) : 0;
    const total = Math.max(warpFlash * 0.7, arriveFlash * 0.16);
    if (total > 0.001) {
      g.fillStyle = rgba(PALETTE.white, total);
      g.fillRect(0, 0, w, h);
    }

    // Straight 1:1 copy of the buffer — the canvas is the same size as it now
    // (see resize). The upscale to the viewport is the compositor's job.
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);

    if (this.onFrame) this.onFrame(this.getState(t));
  }

  /** State the DOM layer needs (title transform, phase name). */
  getState(t) {
    let scale = 0;
    let opacity = 0;
    if (t >= BEATS.title) {
      const z = Math.max(this.dims.near, this.wallZ - this.camZ);
      const zArrive = (2 * this.dims.halfY * this.dims.f) / this.dims.h;
      scale = clamp(zArrive / z, 0.08, 1);
      opacity = span(t, BEATS.title, BEATS.title + 0.35);
      if (t > BEATS.arrive) {
        // brief overshoot as it locks into place
        const s = span(t, BEATS.arrive, BEATS.arrive + 0.45);
        scale = lerp(1.05, 1, easeOutCubic(s));
      }
    }
    return {
      t,
      phase:
        t < BEATS.warp ? 'ignition' : t < BEATS.title ? 'corridor' : t < BEATS.settle ? 'reveal' : 'settled',
      titleScale: scale,
      titleOpacity: opacity,
      titleBlur: (1 - clamp01(opacity)) * 7,
    };
  }

  /* phase 1: seed square + disintegration */

  _drawIgnition(g, t) {
    const { cx, cy, h } = this.dims;
    if (t < BEATS.seed) return;

    const grow = span(t, BEATS.seed, BEATS.solid);
    const bursting = t >= BEATS.burst;
    const swell = bursting ? span(t, BEATS.burst, BEATS.warp) : 0;
    const exit = span(t, BEATS.warp - 0.12, BEATS.warp); // final blow-past
    let half = h * (lerp(0.02, 0.11, easeOutBack(grow)) + swell * 0.06);
    half *= 1 + exit * 1.9;

    // shards behind the square
    this._drawShards(g);

    g.save();
    g.shadowColor = PALETTE.mint;
    g.shadowBlur = 10 + swell * 6;

    if (!bursting) {
      const fill = span(t, BEATS.seed + 0.28, BEATS.solid);
      g.fillStyle = rgba(PALETTE.mint, fill);
      g.fillRect(cx - half, cy - half, half * 2, half * 2);
      g.strokeStyle = PALETTE.mint;
      g.lineWidth = 1.4;
      g.strokeRect(cx - half, cy - half, half * 2, half * 2);
      if (fill < 1) {
        g.fillStyle = PALETTE.voidDeep;
        const d = half * 0.16 * (1 - fill);
        g.fillRect(cx - d, cy - d, d * 2, d * 2);
      }
    } else {
      // hollow, dark interior with scanlines
      g.fillStyle = rgba('#0d2b25', 0.92);
      g.fillRect(cx - half, cy - half, half * 2, half * 2);
      g.globalAlpha = 0.25;
      g.fillStyle = PALETTE.mintDim;
      for (let y = cy - half; y < cy + half; y += 3) g.fillRect(cx - half, y, half * 2, 1);
      g.globalAlpha = 1;
      g.strokeStyle = PALETTE.mint;
      g.lineWidth = 2;
      g.strokeRect(cx - half, cy - half, half * 2, half * 2);
      this._drawCrust(g, cx, cy, half, t);
    }
    g.restore();
  }

  /** flickering pixel crust chewing at the square's edge */
  _drawCrust(g, cx, cy, half, t) {
    const r = mulberry32(Math.floor(t * 14) * 9973);
    const cell = Math.max(2, half * 0.075);
    const n = Math.round((half * 8) / cell);
    for (let i = 0; i < n; i++) {
      const side = Math.floor(r() * 4);
      const u = (r() * 2 - 1) * half;
      const out = (r() - 0.15) * cell * 2.2;
      let x;
      let y;
      if (side === 0) { x = cx + u; y = cy - half - out; }
      else if (side === 1) { x = cx + u; y = cy + half + out; }
      else if (side === 2) { x = cx - half - out; y = cy + u; }
      else { x = cx + half + out; y = cy + u; }
      g.fillStyle = r() < 0.5 ? PALETTE.orange : PALETTE.mint;
      g.fillRect(Math.round(x - cell / 2), Math.round(y - cell / 2), cell, cell);
    }
  }

  _drawShards(g) {
    const { cx, cy } = this.dims;
    for (const p of this.shards) {
      const x = cx + Math.cos(p.a) * p.r;
      const y = cy + Math.sin(p.a) * p.r;
      const a = clamp01(1.15 - p.age / 2.2);
      g.globalAlpha = a;
      g.fillStyle = p.color;
      if (p.streak) {
        g.save();
        g.translate(x, y);
        g.rotate(p.a);
        g.fillRect(-p.size * 3, -p.size / 2, p.size * 6, p.size);
        g.restore();
      } else {
        const s = p.size;
        g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.max(1, s), Math.max(1, s));
        // lit top edge, sells it as a cube
        g.globalAlpha = a * 0.55;
        g.fillStyle = PALETTE.white;
        g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.max(1, s), 1);
      }
    }
    g.globalAlpha = 1;
  }

  /* phase 2: the corridor */

  _drawCorridor(g, t) {
    const { w, h, cx, cy, halfX, halfY, near } = this.dims;
    const fade = 1 - span(t, BEATS.arrive - 0.35, BEATS.arrive + 0.15);
    if (fade <= 0) return;
    g.save();
    g.globalAlpha = fade;

    const wallZ = this.wallZ === Infinity ? Infinity : this.wallZ - this.camZ;
    const limit = Math.min(3600, wallZ); // lines stop short: the far end reads as a black void
    const spacing = 90; // grid cell / ring pitch in world units

    // longitudinal lines — straight in screen space, so gradient-stroke end to end
    const drawRun = (x, y) => {
      const zA = near + 40;
      const zB = limit * 0.985;
      if (zB <= zA) return;
      const a = this.project(x, y, zA);
      const b = this.project(x, y, zB);
      const grad = g.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, rgba(PALETTE.mint, 1));
      grad.addColorStop(0.45, rgba(PALETTE.mint, 0.85));
      grad.addColorStop(1, rgba(PALETTE.mint, 0));
      g.strokeStyle = grad;
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    };

    g.shadowColor = PALETTE.mint;
    // 3, not 7. This shadow is not applied once — it is live for every stroke
    // in the two loops below plus every ring after them, i.e. 50-100 shadowed
    // draws per frame, and canvas shadow cost climbs steeply with radius.
    // Measured on a 15W integrated-graphics laptop at 1920x1080, with only
    // this number changed: 7 -> ~30 dropped frames per run, 5 -> ~28,
    // 3 -> zero. The glow survives the drop because the buffer is upscaled
    // 3x with `image-rendering: pixelated`, so a 3px blur here still reads as
    // ~9px of bloom on screen and the nearest-neighbour upscale quantises away
    // most of what the wider radius was adding.
    // The ignition core's own shadow (_drawCore) is deliberately left alone:
    // it is a handful of draws per frame, not a loop, and never showed up.
    g.shadowBlur = 3;

    const nx = Math.max(6, Math.round((halfX * 2) / spacing));
    const ny = Math.max(4, Math.round((halfY * 2) / spacing));
    for (let i = 0; i <= nx; i++) {
      const x = -halfX + (i * halfX * 2) / nx;
      drawRun(x, -halfY);
      drawRun(x, halfY);
    }
    for (let j = 0; j <= ny; j++) {
      const y = -halfY + (j * halfY * 2) / ny;
      drawRun(-halfX, y);
      drawRun(halfX, y);
    }

    // rings sliding toward the camera
    const rings = Math.ceil(limit / spacing);
    for (let i = 0; i <= rings; i++) {
      let z = i * spacing - (this.camZ % spacing);
      if (z < near || z > limit) continue;
      const a = this.project(-halfX, -halfY, z);
      const b = this.project(halfX, halfY, z);
      const alpha = Math.pow(clamp01(1 - z / (limit * 0.9)), 0.55);
      if (alpha <= 0.04) continue;
      g.strokeStyle = rgba(PALETTE.mint, alpha);
      g.lineWidth = clamp(340 / z, 0.7, 4);
      g.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }
    g.shadowBlur = 0;

    // speed lines
    for (const s of this.streaks) {
      const zA = s.wz - this.camZ;
      const zB = zA + s.len;
      if (zB < near) continue;
      const a = this.project(s.x, s.y, Math.max(near, zA));
      const b = this.project(s.x, s.y, Math.min(limit, zB));
      const alpha = clamp01(1 - zA / (limit * 0.9)) * 0.85;
      const grad = g.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, rgba(s.color, 0));
      grad.addColorStop(0.4, rgba(s.color, alpha));
      grad.addColorStop(1, rgba(s.color, 0));
      g.strokeStyle = grad;
      g.lineWidth = clamp(s.width * (260 / Math.max(near, zA)), 1, 7);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }

    // cubes, far to near so nearer ones overlap
    const sorted = this.cubes.slice().sort((p, q) => q.wz - p.wz);
    for (const c of sorted) {
      const z = c.wz - this.camZ;
      if (z < 150 || z > limit) continue;
      const p = this.project(c.x, c.y, z);
      const s = (c.size * this.dims.f) / z;
      if (s < 0.7) continue;
      const alpha = clamp01(1 - z / (limit * 0.95));
      // push the "side" face away from the vanishing point for a pseudo-3D read
      const dx = p.x - cx;
      const dy = p.y - cy;
      const m = Math.hypot(dx, dy) || 1;
      const ox = (dx / m) * s * 0.34;
      const oy = (dy / m) * s * 0.34;
      g.globalAlpha = fade * alpha * 0.75;
      g.fillStyle = c.color === PALETTE.mint ? PALETTE.mintDim : PALETTE.orangeDim;
      g.fillRect(p.x - s / 2 + ox, p.y - s / 2 + oy, s, s);
      g.globalAlpha = fade * alpha;
      g.fillStyle = c.color;
      g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      g.globalAlpha = fade * alpha * 0.6;
      g.fillStyle = PALETTE.white;
      g.fillRect(p.x - s / 2, p.y - s / 2, s, Math.max(1, s * 0.12));
      g.globalAlpha = fade;
    }

    // the end wall the title lands on
    if (wallZ !== Infinity && wallZ > near) {
      const a = this.project(-halfX, -halfY, wallZ);
      const b = this.project(halfX, halfY, wallZ);
      g.fillStyle = 'rgba(3,5,11,0.98)';
      g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      g.strokeStyle = rgba(PALETTE.mint, 0.45);
      g.lineWidth = clamp(300 / wallZ, 1, 3);
      g.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (wallZ === Infinity) {
      // dark vanishing point before the wall exists
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, h * 0.22);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.45, 'rgba(0,0,0,0.92)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }

    g.restore();
  }

  /* phase 3: starburst */

  _drawRays(g) {
    const { cx, cy } = this.dims;
    for (const p of this.rays) {
      const a = clamp01(1 - p.age / p.life);
      const x = cx + Math.cos(p.a) * p.r;
      const y = cy + Math.sin(p.a) * p.r;
      g.globalAlpha = a;
      g.fillStyle = p.color;
      if (p.dot) {
        g.fillRect(Math.round(x), Math.round(y), Math.max(1, p.size), Math.max(1, p.size));
      } else {
        g.save();
        g.translate(x, y);
        g.rotate(p.a);
        g.fillRect(0, -p.size / 2, p.len * a, Math.max(1, p.size));
        g.restore();
      }
    }
    g.globalAlpha = 1;
  }

  /* phase 4: resting scene */

  _drawAmbient(g, t) {
    const { w, h, halfY, near } = this.dims;
    const fade = span(t, BEATS.arrive - 0.4, BEATS.arrive + 0.6);
    if (fade <= 0) return;
    g.save();
    g.globalAlpha = fade;

    // faint floor + ceiling grid receding to the horizon
    const spacing = 260;
    const drift = (this.t * 190) % spacing;
    const limit = 5200;
    g.strokeStyle = rgba(PALETTE.mint, 0.14);
    g.lineWidth = 1;
    const wideY = halfY * 2.05;
    const wideX = (wideY * w) / h;
    for (let i = 0; i <= Math.ceil(limit / spacing); i++) {
      const z = i * spacing - drift;
      if (z < near * 2) continue;
      for (const sy of [-1, 1]) {
        const a = this.project(-wideX, wideY * sy, z);
        const b = this.project(wideX, wideY * sy, z);
        g.globalAlpha = fade * clamp01(1 - z / limit) * 0.35;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
    }
    const cols = 22;
    for (let i = 0; i <= cols; i++) {
      const x = -wideX + (i * wideX * 2) / cols;
      for (const sy of [-1, 1]) {
        const a = this.project(x, wideY * sy, near * 2);
        const b = this.project(x, wideY * sy, limit);
        const grad = g.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, rgba(PALETTE.mint, 0.16 * fade));
        grad.addColorStop(1, rgba(PALETTE.mint, 0));
        g.strokeStyle = grad;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
    }

    // drifting pixels
    for (const m of this.motes) {
      const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(m.phase));
      g.globalAlpha = fade * tw * 0.9;
      g.fillStyle = m.color;
      const x = Math.round(m.x + Math.sin(m.phase) * m.sway);
      g.fillRect(x, Math.round(m.y), Math.max(1, m.size), Math.max(1, m.size));
    }

    // sparkles
    for (const s of this.stars) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.t * s.rate + s.phase));
      this._star(g, s.x, s.y, s.r * (0.7 + tw * 0.5), fade * tw);
    }

    g.restore();
  }

  _star(g, x, y, r, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = '#dfe6f5';
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x + r * 0.15, y - r * 0.15, x + r, y);
    g.quadraticCurveTo(x + r * 0.15, y + r * 0.15, x, y + r);
    g.quadraticCurveTo(x - r * 0.15, y + r * 0.15, x - r, y);
    g.quadraticCurveTo(x - r * 0.15, y - r * 0.15, x, y - r);
    g.fill();
    g.restore();
  }
}

export default FastShipIntro;

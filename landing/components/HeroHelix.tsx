"use client";

// HeroHelix — the hero visual. A triple-strand spiral swept across the whole
// band, right edge to left edge, built from halftone dots like the footer.
// True pseudo-3D: each dot has (x, y, z), the helix slowly turns, the view is
// tilted, and depth decides a dot's size, opacity and colour — front dots run
// warm toward ReWeb yellow, back dots stay cream. The pointer parts the field
// on springs; click sends a shock ring down the strand.

import * as React from "react";

type PointerEv = PointerEvent;

interface HeroHelixProps {
  background?: string;
  ink?: string;
  warm?: string;
  /** Turns of the helix across the band. */
  turns?: number;
  /** Pointer push radius, CSS px. */
  radius?: number;
  grain?: number;
  className?: string;
}

function hhHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// one spring step of a dot's displacement toward zero, with pointer push
function hhStep(dx: number, dy: number, vx: number, vy: number, px: number, py: number, hx: number, hy: number, r: number) {
  const ddx = hx + dx - px;
  const ddy = hy + dy - py;
  const d2 = ddx * ddx + ddy * ddy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / r) * 2.8;
    vx += (ddx / d) * f;
    vy += (ddy / d) * f;
  }
  vx = (vx - dx * 0.06) * 0.85;
  vy = (vy - dy * 0.06) * 0.85;
  return [dx + vx, dy + vy, vx, vy];
}

const HH_CSS = `
.hh-root {
  position: relative; width: 100%; height: 100%; overflow: hidden; isolation: isolate;
  background: var(--hh-bg); -webkit-font-smoothing: antialiased;
}
.hh-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.hh-root:focus-visible { outline: 1px solid var(--hh-ink); outline-offset: 4px; }
`;

export default function HeroHelix({
  background = "#2261e9",
  ink = "#fbfbf8",
  warm = "#f5e942",
  turns = 2.4,
  radius = 85,
  grain = 0.3,
  className = "",
}: HeroHelixProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null);
  const canvasRef = React.useRef(null as HTMLCanvasElement | null);
  const opts = React.useRef({ background, ink, warm, turns, radius, grain });
  opts.current = { background, ink, warm, turns, radius, grain };

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let ring = { x: 0, y: 0, t: -1 };
    let phase = 0;
    let dragS = 0;
    let last = 0;
    let grainTile = null as HTMLCanvasElement | null;

    // per-dot displacement state, flat: dx, dy, vx, vy
    let disp = new Float32Array(0);
    let count = 0;
    const STRANDS = 3;
    const STEP = 5; // css px between dots along the strand
    const TILT = 0.55; // viewing angle around the x-axis
    const F = 820; // perspective focal length

    const inkRgb = hhHex(ink) || [251, 251, 248];
    const warmRgb = hhHex(warm) || [245, 233, 66];

    const layout = () => {
      const o = opts.current;
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const perStrand = Math.ceil(w / STEP) + 1;
      count = perStrand * STRANDS;
      disp = new Float32Array(count * 4);

      grainTile = document.createElement("canvas");
      grainTile.width = 256;
      grainTile.height = 256;
      const g = grainTile.getContext("2d");
      if (g) {
        const id = g.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
        }
        g.putImageData(id, 0, 0);
      }
      last = 0;
    };

    const draw = (now: number) => {
      const o = opts.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      // pointer drags the turn, smoothed; idle spin keeps it alive
      const drag = px > -1e4 && !reduced ? (px / w - 0.5) * 2.4 : 0;
      dragS += (drag - dragS) * Math.min(1, dt * 6);
      if (!reduced) phase += dt * (0.5 + dragS);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = o.background;
      ctx.fillRect(0, 0, w, h);

      const cy = h / 2;
      const R = Math.min(h * 0.32, 130);
      const cosA = Math.cos(TILT);
      const sinA = Math.sin(TILT);

      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = ringAge * 1.1;
      const r = Math.max(0, o.radius);

      for (let s = 0; s < STRANDS; s++) {
        const strandPhase = phase + (s * 2 * Math.PI) / STRANDS;
        for (let i = 0; i < w / STEP + 1; i++) {
          const idx = s * (Math.ceil(w / STEP) + 1) + i;
          const t = i * STEP;
          const ang = (t / w) * o.turns * 2 * Math.PI + strandPhase;
          // 3D home
          const x3 = t;
          const y3 = R * Math.cos(ang);
          const z3 = R * Math.sin(ang);
          // tilt the view
          const yv = y3 * cosA - z3 * sinA;
          const zv = y3 * sinA + z3 * cosA;
          // perspective — converges slightly toward the centre at the back
          const scale = F / (F + zv);
          const hx = w / 2 + (x3 - w / 2) * scale;
          const hy = cy + yv * scale;

          // displacement springs (shared by the strand's sub-rows)
          let j = idx * 4;
          let dx = disp[j];
          let dy = disp[j + 1];
          let vx = disp[j + 2];
          let vy = disp[j + 3];
          if (!reduced) {
            let st = hhStep(dx, dy, vx, vy, px, py, hx, hy, r);
            // shock ring from click
            if (ringAge < 900) {
              const rdx = hx - ring.x;
              const rdy = hy - ring.y;
              const rd = Math.sqrt(rdx * rdx + rdy * rdy) + 0.001;
              const band = 1 - Math.min(1, Math.abs(rd - ringR) / 30);
              if (band > 0) {
                st[2] += (rdx / rd) * band * 3.4 * (1 - ringAge / 900);
                st[3] += (rdy / rd) * band * 3.4 * (1 - ringAge / 900);
              }
            }
            dx = st[0]; dy = st[1]; vx = st[2]; vy = st[3];
            disp[j] = dx; disp[j + 1] = dy; disp[j + 2] = vx; disp[j + 3] = vy;
          }

          // three sub-rows across the tube — the rope's thickness
          for (let q = 0; q < 3; q++) {
            const rr = R * (1 + (q - 1) * 0.15);
            const sy3 = rr * Math.cos(ang);
            const sz3 = rr * Math.sin(ang);
            const yv2 = sy3 * cosA - sz3 * sinA;
            const zv2 = sy3 * sinA + sz3 * cosA;
            const sc2 = F / (F + zv2);
            const hx2 = w / 2 + (x3 - w / 2) * sc2;
            const hy2 = cy + yv2 * sc2;

            const depth01 = Math.max(0, Math.min(1, (R - zv2) / (2 * R)));
            const push = Math.min(1, Math.hypot(dx, dy) / 22);
            const k = Math.min(1, depth01 * 0.9 + push * 0.8);
            const cx2 = hx2 + dx;
            const cy2 = hy2 + dy;
            const fill =
              k > 0.02
                ? "rgb(" + Math.round(inkRgb[0] + (warmRgb[0] - inkRgb[0]) * k) + "," +
                  Math.round(inkRgb[1] + (warmRgb[1] - inkRgb[1]) * k) + "," +
                  Math.round(inkRgb[2] + (warmRgb[2] - inkRgb[2]) * k) + ")"
                : o.ink;
            if (q === 1) {
              // bloom halo behind the core row — gives the strand its volume
              ctx.globalAlpha = 0.06 + 0.12 * depth01;
              ctx.fillStyle = fill;
              ctx.beginPath();
              ctx.arc(cx2, cy2, 3 + 5 * depth01, 0, 6.2832);
              ctx.fill();
            }
            // crisp dot
            ctx.globalAlpha = 0.16 + 0.84 * depth01;
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(cx2, cy2, 1.1 + 2.6 * depth01 + push * 1.4, 0, 6.2832);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09;
        ctx.globalCompositeOperation = "overlay";
        const pattern = ctx.createPattern(grainTile, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!raf && visible && !reduced) raf = requestAnimationFrame(loop);
    };

    const toLocal = (e: PointerEv) => {
      const b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const onMove = (e: PointerEv) => {
      const p = toLocal(e);
      px = p[0];
      py = p[1];
      wake();
    };
    const onLeave = () => {
      px = -1e5;
      py = -1e5;
      wake();
    };
    const onDown = (e: PointerEv) => {
      if (reduced) return;
      const p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={"hh-root " + className}
      style={{ "--hh-bg": background, "--hh-ink": ink } as React.CSSProperties}
      role="img"
      aria-label="A three-strand spiral of halftone dots swept across the hero"
    >
      <style>{HH_CSS}</style>
      <canvas ref={canvasRef} />
    </div>
  );
}

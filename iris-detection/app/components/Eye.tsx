"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Iris fibres, generated once at module load from a fixed seed.
 *
 * Deterministic on purpose: the server and the client must draw the
 * identical eye, and a bare Math.random() here is a hydration mismatch
 * that only ever shows up as a flicker on first paint.
 */
const R = 56; // iris radius, in viewBox units

const FIBRES = (() => {
  let s = 20240211;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  // Coordinates are rounded here, once. Emitting raw floats lets the
  // server and client disagree on the last decimal place, which React
  // reports as a hydration mismatch on every one of these 118 lines.
  const r = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: 118 }, (_, i) => {
    const a = (i / 118) * Math.PI * 2 + rnd() * 0.05;
    const inner = 0.34 + rnd() * 0.1;
    const outer = 0.74 + rnd() * 0.26;
    return {
      x1: r(200 + Math.cos(a) * R * inner),
      y1: r(120 + Math.sin(a) * R * inner),
      x2: r(200 + Math.cos(a) * R * outer),
      y2: r(120 + Math.sin(a) * R * outer),
      w: r(0.5 + rnd() * 1.5),
      o: r(0.06 + rnd() * 0.3),
    };
  });
})();

export type EyeMood = "idle" | "scanning" | "granted" | "denied" | "asleep";

/* Iris colour per mood. Periwinkle at rest; the verdict colours are the
   only other things this eye is ever allowed to become. */
const MOOD = {
  idle:     { core: "#c7d2fe", mid: "#818cf8", rim: "#312e81", pupil: 0.155, glow: "rgb(129 140 248 / 0.34)" },
  scanning: { core: "#e0e7ff", mid: "#a5b4fc", rim: "#3730a3", pupil: 0.215, glow: "rgb(165 180 252 / 0.5)" },
  granted:  { core: "#bbf7d0", mid: "#4ade80", rim: "#14532d", pupil: 0.135, glow: "rgb(74 222 128 / 0.42)" },
  denied:   { core: "#fecdd3", mid: "#fb7185", rim: "#7f1d1d", pupil: 0.09,  glow: "rgb(251 113 133 / 0.4)" },
  asleep:   { core: "#9aa1b0", mid: "#5b6373", rim: "#1e212a", pupil: 0.14,  glow: "rgb(154 161 176 / 0.12)" },
} as const;

/**
 * The eye.
 *
 * Same anatomy and the same mouse-tracking idea as before, rebuilt:
 * layered iris fibres over a real limbal ring, depth in the pupil, a
 * soft catchlight, eased tracking rather than a hard set, idle
 * micro-saccades, natural blinking — and it reacts to what the system
 * is doing, so it is the status display rather than an ornament.
 */
export default function Eye({
  mood = "idle",
  /** 0–1. Fills the ring around the iris — the confidence figure, shown. */
  level,
  size = 440,
  className = "",
  tracking = true,
}: {
  mood?: EyeMood;
  level?: number;
  size?: number;
  className?: string;
  tracking?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const lidRef = useRef<SVGGElement>(null);

  const m = MOOD[mood];

  /* ── Tracking, blinking, saccades ─────────────────────────────── */
  useEffect(() => {
    const g = groupRef.current;
    const lid = lidRef.current;
    if (!g) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !tracking) {
      g.style.transform = "translate(0px, 0px)";
      return;
    }

    let raf = 0;
    let tx = 0, ty = 0;   // target
    let cx = 0, cy = 0;   // current, eased toward target
    let lastMove = performance.now();
    let sacX = 0, sacY = 0, nextSac = 900;

    const MAX_X = 26, MAX_Y = 13;

    const onMove = (e: PointerEvent) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      // Normalise by a generous radius so the gaze doesn't slam to the
      // stops the moment the pointer leaves the artwork.
      const k = Math.max(r.width, 520) * 0.9;
      tx = Math.max(-1, Math.min(1, dx / k)) * MAX_X;
      ty = Math.max(-1, Math.min(1, dy / k)) * MAX_Y;
      lastMove = performance.now();
      sacX = sacY = 0;
    };

    const loop = (now: number) => {
      // Idle: real eyes never hold perfectly still.
      if (now - lastMove > 2200 && now > nextSac) {
        sacX = (Math.random() - 0.5) * 9;
        sacY = (Math.random() - 0.5) * 4.5;
        nextSac = now + 1400 + Math.random() * 2600;
      }
      cx += (tx + sacX - cx) * 0.085;
      cy += (ty + sacY - cy) * 0.085;
      g.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });

    // Blink: a fast close, a slower open, at irregular intervals.
    let blinkTimer = 0;
    const blink = () => {
      if (lid) {
        lid.style.transition = "transform 90ms cubic-bezier(.4,0,1,1)";
        lid.style.transform = "scaleY(1)";
        window.setTimeout(() => {
          lid.style.transition = "transform 220ms cubic-bezier(.22,1,.36,1)";
          lid.style.transform = "scaleY(0)";
        }, 105);
      }
      blinkTimer = window.setTimeout(blink, 3600 + Math.random() * 5200);
    };
    blinkTimer = window.setTimeout(blink, 2600 + Math.random() * 2600);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(blinkTimer);
    };
  }, [tracking]);


  const pupilR = R * 2 * m.pupil;     // pupil scales with mood
  const ringC = 2 * Math.PI * (R + 13);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, maxWidth: "100%" }}
    >
      {/* Ambient light the eye casts on the page. */}
      <div
        aria-hidden="true"
        className="a-breathe pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.9,
          height: size * 0.52,
          background: `radial-gradient(circle, ${m.glow} 0%, transparent 68%)`,
          filter: "blur(34px)",
          transition: "background var(--d-slow) var(--out)",
        }}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 400 240"
        className="w-full overflow-visible"
        role="img"
        aria-label={
          mood === "scanning" ? "Scanning"
          : mood === "granted" ? "Recognised"
          : mood === "denied" ? "Not recognised"
          : "IrisGuard"
        }
      >
        <defs>
          {/* The eye opening. Everything inside is clipped to it. */}
          <clipPath id={`clip-${uid}`}>
            <path d="M 22 120 C 92 48, 308 48, 378 120 C 308 188, 92 188, 22 120 Z" />
          </clipPath>

          {/* Sclera. Never pure white — a blown-out white against a dark
              UI is the single loudest thing on the page, and real sclera
              is a soft warm grey that darkens into the corners. */}
          <radialGradient id={`sclera-${uid}`} cx="44%" cy="40%" r="68%">
            <stop offset="0%" stopColor="#f7f8fb" />
            <stop offset="52%" stopColor="#e6e9f1" />
            <stop offset="100%" stopColor="#aeb6c8" />
          </radialGradient>

          <radialGradient id={`iris-${uid}`} cx="40%" cy="36%" r="70%">
            <stop offset="0%" stopColor={m.core} />
            <stop offset="34%" stopColor={m.mid} />
            <stop offset="82%" stopColor={m.mid} stopOpacity="0.92" />
            <stop offset="100%" stopColor={m.rim} />
          </radialGradient>

          {/* Depth in the pupil — not a flat black disc. */}
          <radialGradient id={`pupil-${uid}`} cx="46%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#12131c" />
            <stop offset="55%" stopColor="#05060b" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* The lids shade the sclera from above and, more softly, below. */}
          <linearGradient id={`lidshade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(10 12 20 / 0.62)" />
            <stop offset="34%" stopColor="rgb(10 12 20 / 0.1)" />
            <stop offset="72%" stopColor="rgb(10 12 20 / 0)" />
            <stop offset="100%" stopColor="rgb(10 12 20 / 0.22)" />
          </linearGradient>

          {/* Corners sit in shadow — this is what gives the eye a socket. */}
          <radialGradient id={`socket-${uid}`} cx="50%" cy="50%" r="52%">
            <stop offset="55%" stopColor="rgb(10 12 20 / 0)" />
            <stop offset="100%" stopColor="rgb(10 12 20 / 0.55)" />
          </radialGradient>

          {/* The cornea is a dome. One broad, very soft highlight across
              it is what makes the whole eye read as wet and curved. */}
          <linearGradient id={`dome-${uid}`} x1="0.1" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.3)" />
            <stop offset="45%" stopColor="rgb(255 255 255 / 0.05)" />
            <stop offset="100%" stopColor="rgb(255 255 255 / 0)" />
          </linearGradient>

          <radialGradient id={`glint-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.95)" />
            <stop offset="45%" stopColor="rgb(255 255 255 / 0.4)" />
            <stop offset="100%" stopColor="rgb(255 255 255 / 0)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#clip-${uid})`}>
          <ellipse cx="200" cy="120" rx="178" ry="118" fill={`url(#sclera-${uid})`} />

          {/* Gaze group: the iris travels, the sclera does not. */}
          <g ref={groupRef} style={{ willChange: "transform" }}>
            {/* The iris sits in a soft shadow on the sclera — an iris with
                no contact shadow reads as a sticker on a white field. */}
            <circle cx="200" cy="120" r={R + 4} fill="rgb(24 26 40 / 0.28)" />

            <circle cx="200" cy="120" r={R} fill={`url(#iris-${uid})`} />

            {/* Fibres, in two passes: long strands from the collarette out
                to the limbus, then the same set again short and dark to
                break up the regularity. One pass alone reads as spokes. */}
            <g
              style={{
                transition: "opacity var(--d-slow) var(--out)",
                opacity: mood === "asleep" ? 0.25 : 1,
              }}
            >
              {FIBRES.map((f, i) => (
                <line
                  key={i}
                  x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2}
                  stroke={i % 4 === 0 ? m.core : m.rim}
                  strokeWidth={f.w * 0.8}
                  strokeOpacity={f.o * 0.5}
                  strokeLinecap="round"
                />
              ))}
              {FIBRES.filter((_, i) => i % 2 === 0).map((f, i) => (
                <line
                  key={`s${i}`}
                  x1={f.x1} y1={f.y1}
                  x2={f.x1 + (f.x2 - f.x1) * 0.42}
                  y2={f.y1 + (f.y2 - f.y1) * 0.42}
                  stroke={m.rim}
                  strokeWidth={f.w * 1.3}
                  strokeOpacity={f.o * 0.38}
                  strokeLinecap="round"
                />
              ))}
            </g>

            {/* Collarette — the raised ring around the pupil. Two offset
                strokes, one light above and one dark below, so it reads as
                a ridge with a light source rather than a dashed circle. */}
            <circle
              cx="200" cy="119" r={R * 0.44}
              fill="none" stroke={m.core} strokeOpacity="0.2" strokeWidth="3.5"
            />
            <circle
              cx="200" cy="121.5" r={R * 0.44}
              fill="none" stroke={m.rim} strokeOpacity="0.26" strokeWidth="3"
            />

            {/* Limbal ring: a wide soft edge, then a tight dark line. */}
            <circle
              cx="200" cy="120" r={R - 3}
              fill="none" stroke={m.rim} strokeOpacity="0.45" strokeWidth="9"
            />
            <circle
              cx="200" cy="120" r={R - 0.8}
              fill="none" stroke="rgb(10 10 24 / 0.55)" strokeWidth="2.4"
            />

            {/* pupil, with its own soft edge into the iris */}
            <circle
              cx="200" cy="120" r={pupilR + 2}
              fill="rgb(6 6 14 / 0.45)"
              style={{ transition: "r var(--d-slow) var(--spring)" }}
            />
            <circle
              cx="200" cy="120" r={pupilR}
              fill={`url(#pupil-${uid})`}
              style={{ transition: "r var(--d-slow) var(--spring)" }}
            />

            {/* confidence ring — the measurement, drawn on the eye itself */}
            {typeof level === "number" && (
              <circle
                cx="200" cy="120" r={R + 13}
                fill="none"
                stroke={m.mid}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - Math.max(0, Math.min(1, level)))}
                transform="rotate(-90 200 120)"
                style={{ transition: "stroke-dashoffset var(--d-slow) var(--out)" }}
                opacity="0.9"
              />
            )}

            {/* scanning sweep */}
            {mood === "scanning" && (
              <g
                className="a-orbit"
                style={{ transformOrigin: "200px 120px" }}
              >
                <circle
                  cx="200" cy="120" r={R + 13}
                  fill="none" stroke={m.core} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${ringC * 0.18} ${ringC}`}
                  opacity="0.9"
                />
              </g>
            )}

            {/* Catchlights: a broad soft one and a small sharp one, offset
                from each other the way two real light sources land. */}
            <ellipse
              cx={200 - R * 0.42} cy={120 - R * 0.44}
              rx={R * 0.3} ry={R * 0.24}
              fill={`url(#glint-${uid})`}
              transform={`rotate(-22 ${200 - R * 0.42} ${120 - R * 0.44})`}
            />
            <circle cx={200 - R * 0.12} cy={120 - R * 0.6} r="2.6" fill="rgb(255 255 255 / 0.8)" />
          </g>

          {/* The corneal dome — a single soft sweep across the whole eye,
              iris and sclera alike. It is the wetness. */}
          <ellipse
            cx="176" cy="96" rx="150" ry="66"
            fill={`url(#dome-${uid})`}
            transform="rotate(-9 176 96)"
            style={{ pointerEvents: "none" }}
          />

          {/* Lid shading, and the socket shadow in the corners. */}
          <rect x="0" y="0" width="400" height="240" fill={`url(#lidshade-${uid})`} />
          <rect x="0" y="0" width="400" height="240" fill={`url(#socket-${uid})`} />

          {/* the blinking lid */}
          <g
            ref={lidRef}
            style={{ transform: "scaleY(0)", transformOrigin: "200px 6px" }}
          >
            <path d="M 22 120 C 92 48, 308 48, 378 120 C 308 188, 92 188, 22 120 Z" fill="#12141a" />
          </g>
        </g>

        {/* Lash line. The upper lid is the heavy one — that asymmetry is
            most of what separates an eye from a symmetrical lens shape. */}
        <path
          d="M 22 120 C 92 48, 308 48, 378 120"
          fill="none"
          stroke="#0a0b10"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M 378 120 C 308 188, 92 188, 22 120"
          fill="none"
          stroke="#0a0b10"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* A soft inner rim so the opening reads as an eye, not a hole. */}
        <path
          d="M 22 120 C 92 48, 308 48, 378 120 C 308 188, 92 188, 22 120 Z"
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

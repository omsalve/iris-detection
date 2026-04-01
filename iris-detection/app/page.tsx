"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const irisRef = useRef<SVGCircleElement>(null);
  const pupilRef = useRef<SVGCircleElement>(null);
  const eyeRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const iris = irisRef.current;
      const pupil = pupilRef.current;
      const eye = eyeRef.current;
      if (!iris || !pupil || !eye) return;

      const eyeRect = eye.getBoundingClientRect();
      const eyeCX = eyeRect.left + eyeRect.width / 2;
      const eyeCY = eyeRect.top + eyeRect.height / 2;

      const dx = e.clientX - eyeCX;
      const dy = e.clientY - eyeCY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy), 28);

      const ix = Math.cos(angle) * dist;
      const iy = Math.sin(angle) * dist * 0.55; // flatten for ellipse shape

      iris.setAttribute("cx", String(200 + ix));
      iris.setAttribute("cy", String(120 + iy));
      pupil.setAttribute("cx", String(200 + ix * 1.1));
      pupil.setAttribute("cy", String(120 + iy * 1.1));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-12 px-6">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,120,0.07) 0%, transparent 70%)" }} />

      {/* Eye SVG */}
      <svg
        viewBox="0 0 400 240"
        className="w-full max-w-md select-none"
        style={{ filter: "drop-shadow(0 0 32px rgba(0,200,140,0.18))" }}
      >
        <defs>
          <clipPath id="eyeClip">
            <ellipse cx="200" cy="120" rx="160" ry="75" />
          </clipPath>
          <radialGradient id="irisGrad" cx="45%" cy="40%">
            <stop offset="0%" stopColor="#00e89a" />
            <stop offset="40%" stopColor="#00a86b" />
            <stop offset="100%" stopColor="#004d35" />
          </radialGradient>
          <radialGradient id="scleraGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#e8f5f0" />
            <stop offset="100%" stopColor="#c2ddd4" />
          </radialGradient>
        </defs>

        {/* Eyelid shadow top */}
        <ellipse cx="200" cy="108" rx="162" ry="76"
          fill="rgba(0,0,0,0.35)" clipPath="url(#eyeClip)" />

        {/* Sclera (white of eye) */}
        <ellipse ref={eyeRef} cx="200" cy="120" rx="160" ry="75"
          fill="url(#scleraGrad)" />

        {/* Iris */}
        <circle ref={irisRef} cx="200" cy="120" r="46"
          fill="url(#irisGrad)" clipPath="url(#eyeClip)" />

        {/* Iris texture rings */}
        <circle cx="200" cy="120" r="38"
          fill="none" stroke="rgba(0,80,50,0.4)" strokeWidth="1.5"
          clipPath="url(#eyeClip)"
          style={{ transform: "translate(0,0)", transformOrigin: "200px 120px" }}
          id="irisRing1" />
        <circle cx="200" cy="120" r="30"
          fill="none" stroke="rgba(0,60,40,0.3)" strokeWidth="1"
          clipPath="url(#eyeClip)" id="irisRing2" />

        {/* Pupil */}
        <circle ref={pupilRef} cx="200" cy="120" r="18"
          fill="#050f0b" clipPath="url(#eyeClip)" />

        {/* Pupil shine */}
        <circle cx="207" cy="113" r="5"
          fill="rgba(255,255,255,0.55)" clipPath="url(#eyeClip)" />
        <circle cx="204" cy="110" r="2"
          fill="rgba(255,255,255,0.3)" clipPath="url(#eyeClip)" />

        {/* Eyelid outlines */}
        <path
          d="M 40 120 Q 200 20 360 120"
          fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
        <path
          d="M 40 120 Q 200 220 360 120"
          fill="none" stroke="#111" strokeWidth="2" />

        {/* Lash hints top */}
        {[60,90,120,150,180,210,240,270,300,330].map((x, i) => (
          <line key={i}
            x1={x} y1={120 - Math.sin(Math.PI * (x - 40) / 320) * 72}
            x2={x + (i % 2 === 0 ? -3 : 3)}
            y2={120 - Math.sin(Math.PI * (x - 40) / 320) * 82}
            stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        ))}
      </svg>

      {/* Heading */}
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-white font-light tracking-[0.25em] uppercase text-3xl sm:text-4xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.3em" }}>
          IrisGuard
        </h1>
        <p className="text-sm tracking-widest uppercase"
          style={{ color: "rgba(0,200,140,0.7)", letterSpacing: "0.2em" }}>
          Smart Home Security — Iris Detection
        </p>
      </div>

      {/* CTA */}
      <Link href="/login"
        className="px-10 py-3 text-sm tracking-widest uppercase border transition-all duration-300"
        style={{
          borderColor: "rgba(0,200,140,0.4)",
          color: "rgba(0,200,140,0.9)",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.8)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.4)";
        }}>
        Authenticate
      </Link>
    </main>
  );
}
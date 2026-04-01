"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Home() {
  const irisRef = useRef<SVGCircleElement>(null);
  const pupilRef = useRef<SVGCircleElement>(null);
  const eyeRef = useRef<SVGEllipseElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      const iy = Math.sin(angle) * dist * 0.55;

      iris.setAttribute("cx", String(200 + ix));
      iris.setAttribute("cy", String(120 + iy));
      pupil.setAttribute("cx", String(200 + ix * 1.1));
      pupil.setAttribute("cy", String(120 + iy * 1.1));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "#030a07" }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,180,120,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Scanline texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,140,1) 2px, rgba(0,200,140,1) 3px)",
        }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: "rgba(0,200,140,0.08)", fontFamily: "monospace" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#00c88c" }}
          />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(0,200,140,0.5)" }}
          >
            IrisGuard v2.1
          </span>
        </div>
        <span
          className="text-[10px] tracking-[0.2em] uppercase hidden md:block"
          style={{ color: "rgba(0,200,140,0.25)" }}
        >
          {mounted
            ? new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "--:--:--"}
        </span>
      </div>

      {/* Eye SVG */}
      <div
        className="relative mb-8"
        style={{
          filter: "drop-shadow(0 0 40px rgba(0,200,140,0.15))",
        }}
      >
        <svg
          viewBox="0 0 400 240"
          className="w-full max-w-sm select-none"
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

          <ellipse cx="200" cy="108" rx="162" ry="76"
            fill="rgba(0,0,0,0.35)" clipPath="url(#eyeClip)" />
          <ellipse ref={eyeRef} cx="200" cy="120" rx="160" ry="75"
            fill="url(#scleraGrad)" />
          <circle ref={irisRef} cx="200" cy="120" r="46"
            fill="url(#irisGrad)" clipPath="url(#eyeClip)" />
          <circle cx="200" cy="120" r="38"
            fill="none" stroke="rgba(0,80,50,0.4)" strokeWidth="1.5"
            clipPath="url(#eyeClip)" />
          <circle cx="200" cy="120" r="30"
            fill="none" stroke="rgba(0,60,40,0.3)" strokeWidth="1"
            clipPath="url(#eyeClip)" />
          <circle ref={pupilRef} cx="200" cy="120" r="18"
            fill="#050f0b" clipPath="url(#eyeClip)" />
          <circle cx="207" cy="113" r="5"
            fill="rgba(255,255,255,0.55)" clipPath="url(#eyeClip)" />
          <circle cx="204" cy="110" r="2"
            fill="rgba(255,255,255,0.3)" clipPath="url(#eyeClip)" />
          <path d="M 40 120 Q 200 20 360 120"
            fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
          <path d="M 40 120 Q 200 220 360 120"
            fill="none" stroke="#111" strokeWidth="2" />
          {[60,90,120,150,180,210,240,270,300,330].map((x, i) => (
            <line key={i}
              x1={x} y1={120 - Math.sin(Math.PI * (x - 40) / 320) * 72}
              x2={x + (i % 2 === 0 ? -3 : 3)}
              y2={120 - Math.sin(Math.PI * (x - 40) / 320) * 82}
              stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          ))}
        </svg>

        {/* Scanning line animation */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ borderRadius: "50%" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "rgba(0,200,140,0.4)",
              animation: "scanline 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1
          className="text-white font-light tracking-[0.3em] uppercase mb-1"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          }}
        >
          IrisGuard
        </h1>
        <p
          className="text-xs tracking-[0.25em] uppercase"
          style={{ color: "rgba(0,200,140,0.55)", fontFamily: "monospace" }}
        >
          Smart Home Security System
        </p>
      </div>

      {/* Status indicator */}
      <div
        className="flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full border"
        style={{
          borderColor: "rgba(0,200,140,0.2)",
          background: "rgba(0,200,140,0.04)",
          fontFamily: "monospace",
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#00c88c" }}
        />
        <span
          className="text-[9px] tracking-[0.25em] uppercase"
          style={{ color: "rgba(0,200,140,0.6)" }}
        >
          System Online — Biometric Active
        </span>
      </div>

      {/* Two CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {/* Admin Login */}
        <Link
          href="/login"
          className="flex-1 group relative flex flex-col items-center gap-2 px-6 py-5 border transition-all duration-300"
          style={{
            borderColor: "rgba(0,200,140,0.35)",
            background: "rgba(0,200,140,0.04)",
            fontFamily: "monospace",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.04)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.35)";
          }}
        >
          {/* Shield icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z"
              stroke="rgba(0,200,140,0.8)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4"
              stroke="rgba(0,200,140,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-center">
            <div
              className="text-xs tracking-[0.2em] uppercase font-light"
              style={{ color: "rgba(0,200,140,0.9)" }}
            >
              Admin Login
            </div>
            <div
              className="text-[9px] tracking-widest mt-0.5 uppercase opacity-40"
              style={{ color: "rgba(0,200,140,1)" }}
            >
              Iris · OTP · Password
            </div>
          </div>
        </Link>

        {/* Request Access */}
        <Link
          href="/access"
          className="flex-1 group relative flex flex-col items-center gap-2 px-6 py-5 border transition-all duration-300"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            fontFamily: "monospace",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {/* Door/person icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="2" width="13" height="20" rx="1"
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <circle cx="19" cy="12" r="3"
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <path d="M16 12h-2"
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="14.5" cy="12" r="0.75"
              fill="rgba(255,255,255,0.5)" />
          </svg>
          <div className="text-center">
            <div
              className="text-xs tracking-[0.2em] uppercase font-light"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Request Access
            </div>
            <div
              className="text-[9px] tracking-widest mt-0.5 uppercase opacity-40"
              style={{ color: "rgba(255,255,255,1)" }}
            >
              Visitor Entry
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom label */}
      <p
        className="mt-8 text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "rgba(0,200,140,0.2)", fontFamily: "monospace" }}
      >
        Biometric Authentication Platform
      </p>

      <style>{`
        @keyframes scanline {
          0% { top: 20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>
    </main>
  );
}
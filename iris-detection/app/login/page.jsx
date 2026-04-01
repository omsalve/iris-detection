"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 relative">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,120,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Login Card */}
      <div className="w-full max-w-md border border-[rgba(0,200,140,0.25)] p-8 backdrop-blur-md bg-[rgba(0,0,0,0.6)] shadow-[0_0_40px_rgba(0,200,140,0.08)] rounded-2xl flex flex-col gap-6">
        {/* Heading */}
        <div className="text-center flex flex-col gap-2">
          <h1
            className="text-white font-light uppercase text-2xl tracking-[0.3em]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            IrisGuard
          </h1>
          <p className="text-xs tracking-[0.2em] text-[rgba(0,200,140,0.6)] uppercase">
            Secure Authentication
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border border-[rgba(0,200,140,0.25)] px-4 py-3 text-sm tracking-widest text-white outline-none focus:border-[rgba(0,200,140,0.7)] transition-all"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border border-[rgba(0,200,140,0.25)] px-4 py-3 text-sm tracking-widest text-white outline-none focus:border-[rgba(0,200,140,0.7)] transition-all"
          />
        </div>

        {/* Button */}
        <button
          className="mt-2 px-6 py-3 text-sm tracking-[0.2em] uppercase border transition-all duration-300"
          style={{
            borderColor: "rgba(0,200,140,0.4)",
            color: "rgba(0,200,140,0.9)",
            fontFamily: "monospace",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,200,140,0.08)";
            e.currentTarget.style.borderColor = "rgba(0,200,140,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(0,200,140,0.4)";
          }}
        >
          Authenticate
        </button>

        {/* Footer */}
        <p className="text-center text-[10px] tracking-[0.2em] text-[rgba(0,200,140,0.4)] uppercase">
          Iris Detection Enabled System
        </p>
      </div>
    </main>
  );
}
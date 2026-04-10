"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState("");

  const router = useRouter();

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("INVALID CREDENTIALS: ACCESS DENIED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#030a07", fontFamily: "monospace" }}
    >
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: "rgba(0,200,140,0.08)" }}
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
          {now}
        </span>
      </div>

      {/* Login Container */}
      <div
        className="w-full max-w-sm border flex flex-col overflow-hidden transition-all duration-500"
        style={{
          borderColor: "rgba(0,200,140,0.2)",
          boxShadow: "0 0 40px rgba(0,200,140,0.08)",
          background: "rgba(3,10,7,0.9)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(0,200,140,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: loading ? "rgba(60,180,255,0.8)" : "#00c88c" }}
            />
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(0,200,140,0.5)" }}
            >
              Admin Terminal
            </span>
          </div>
          <span
            className="text-[10px] tracking-widest"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            AUTH-01
          </span>
        </div>

        {/* Eye logo */}
        <div className="flex justify-center pt-8 pb-4">
          <div style={{ filter: "drop-shadow(0 0 20px rgba(0,200,140,0.15))" }}>
            <svg viewBox="0 0 120 60" className="w-28" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="lg-iris" cx="45%" cy="40%">
                  <stop offset="0%" stopColor="#00e89a" />
                  <stop offset="40%" stopColor="#00a86b" />
                  <stop offset="100%" stopColor="#004d35" />
                </radialGradient>
                <radialGradient id="lg-sclera" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#e8f5f0" />
                  <stop offset="100%" stopColor="#c2ddd4" />
                </radialGradient>
                <clipPath id="lg-clip">
                  <ellipse cx="60" cy="30" rx="55" ry="26" />
                </clipPath>
              </defs>
              <ellipse cx="60" cy="30" rx="55" ry="26" fill="url(#lg-sclera)" />
              <circle cx="60" cy="30" r="16" fill="url(#lg-iris)" clipPath="url(#lg-clip)" />
              <circle cx="60" cy="30" r="13" fill="none" stroke="rgba(0,80,50,0.4)" strokeWidth="0.8" clipPath="url(#lg-clip)" />
              <circle cx="60" cy="30" r="7" fill="#050f0b" clipPath="url(#lg-clip)" />
              <circle cx="63" cy="27" r="2.5" fill="rgba(255,255,255,0.55)" clipPath="url(#lg-clip)" />
              <path d="M 5 30 Q 60 4 115 30" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
              <path d="M 5 30 Q 60 56 115 30" fill="none" stroke="#111" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center pb-6">
          <h1
            className="text-white font-light tracking-[0.25em] uppercase text-lg mb-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            IrisGuard
          </h1>
          <p
            className="text-[9px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(0,200,140,0.4)" }}
          >
            Secure Admin Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              required
              disabled={loading}
              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 disabled:opacity-50"
              style={{
                border: "1px solid rgba(0,200,140,0.2)",
                fontFamily: "monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              required
              disabled={loading}
              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 disabled:opacity-50"
              style={{
                border: "1px solid rgba(0,200,140,0.2)",
                fontFamily: "monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-[9px] tracking-widest uppercase text-center"
              style={{ color: "rgba(255,80,80,0.8)" }}
            >
              ✕ {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-4 mt-1 text-xs tracking-[0.25em] uppercase border transition-all duration-300 disabled:opacity-30"
            style={{
              borderColor: "rgba(0,200,140,0.3)",
              color: "rgba(0,200,140,0.9)",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex justify-center"
          style={{ borderColor: "rgba(0,200,140,0.06)", background: "rgba(0,0,0,0.2)" }}
        >
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            Biometric Authentication Platform
          </span>
        </div>

        {/* Scan line effect when loading */}
        {loading && (
          <div
            className="absolute left-0 right-0 h-[1px] pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(60,180,255,0.8) 50%, transparent 100%)",
              animation: "scan-sweep 1.5s linear infinite",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes scan-sweep {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
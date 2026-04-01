"use client";
import { useState } from "react";
import Link from "next/link";

type Stage = "choose" | "iris" | "otp" | "granted" | "denied";

const API = "http://localhost:8000";

export default function AccessPage() {
  const [stage, setStage] = useState<Stage>("choose");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confidence, setConfidence] = useState(0);

  const handleIrisScan = async () => {
    setLoading(true);
    setError("");
    setStatus("Scanning iris pattern...");
    try {
      const res = await fetch(`${API}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: "mock_visitor_iris" }),
      });
      const data = await res.json();
      setConfidence(Math.round(data.confidence * 100));
      if (data.matched) {
        setStatus("Match confirmed — notifying admin...");
        // Trigger admin alert
        await fetch(`${API}/admin/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Visitor access granted via iris scan" }),
        }).catch(() => {});
        setTimeout(() => setStage("granted"), 1000);
      } else {
        setTimeout(() => setStage("denied"), 800);
      }
    } catch {
      setError("Scanner offline. Backend not reachable.");
      setStatus("");
    }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!phone) { setError("Enter your phone number"); return; }
    setLoading(true);
    setError("");
    try {
      await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
      setStatus("OTP sent — check your phone");
    } catch {
      setError("Failed to send OTP. Backend offline?");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) { setError("Enter the OTP code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Verified — notifying admin...");
        await fetch(`${API}/admin/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: `Visitor access granted via OTP (${phone})` }),
        }).catch(() => {});
        setTimeout(() => setStage("granted"), 1000);
      } else {
        setTimeout(() => setStage("denied"), 500);
      }
    } catch {
      setError("Verification failed. Backend offline?");
    }
    setLoading(false);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: "#030a07", fontFamily: "monospace" }}
    >
      {/* Ambient glow — changes based on stage */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-1000" style={{
        background: stage === "granted"
          ? "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,200,140,0.12) 0%, transparent 70%)"
          : stage === "denied"
          ? "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,60,60,0.1) 0%, transparent 70%)"
          : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,100,200,0.05) 0%, transparent 70%)",
      }} />

      {/* Back link — only on choose/iris/otp */}
      {(stage === "choose" || stage === "iris" || stage === "otp") && (
        <Link
          href="/"
          className="absolute top-6 left-6 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
        >
          ← Back
        </Link>
      )}

      {/* ── STAGE: CHOOSE ── */}
      {stage === "choose" && (
        <div className="flex flex-col items-center gap-8 w-full max-w-xs">
          <div className="text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              Visitor Entry
            </p>
            <h1 className="text-white font-light tracking-[0.2em] uppercase" style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem" }}>
              Request Access
            </h1>
            <p className="text-[9px] tracking-widest uppercase mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
              Choose verification method
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setStage("iris")}
              className="w-full flex items-center gap-4 px-5 py-4 border transition-all duration-200"
              style={{ borderColor: "rgba(0,200,140,0.25)", background: "rgba(0,200,140,0.04)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.6)";
                (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.25)";
                (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.04)";
              }}
            >
              <span style={{ fontSize: "24px" }}>👁</span>
              <div className="text-left">
                <div className="text-xs tracking-[0.15em] uppercase" style={{ color: "rgba(0,200,140,0.9)" }}>
                  Iris Scan
                </div>
                <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(0,200,140,0.35)" }}>
                  Biometric — fastest
                </div>
              </div>
              <span className="ml-auto" style={{ color: "rgba(0,200,140,0.3)" }}>→</span>
            </button>

            <button
              onClick={() => setStage("otp")}
              className="w-full flex items-center gap-4 px-5 py-4 border transition-all duration-200"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <span style={{ fontSize: "24px" }}>📱</span>
              <div className="text-left">
                <div className="text-xs tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                  OTP via SMS
                </div>
                <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Phone verification
                </div>
              </div>
              <span className="ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: IRIS ── */}
      {stage === "iris" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <div className="text-center">
            <p className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: "rgba(0,200,140,0.35)" }}>
              Iris Verification
            </p>
            <h2 className="text-white font-light tracking-[0.2em] uppercase" style={{ fontFamily: "Georgia, serif" }}>
              Look at the Camera
            </h2>
          </div>

          {/* Iris scanner UI */}
          <div className="relative w-48 h-48">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "rgba(0,200,140,0.2)" }} />
            {/* Spinning dashed ring */}
            <div
              className="absolute inset-3 rounded-full border-2 border-dashed"
              style={{
                borderColor: loading ? "rgba(0,200,140,0.5)" : "rgba(0,200,140,0.2)",
                animation: loading ? "spin 4s linear infinite" : "none",
              }}
            />
            {/* Inner eye area */}
            <div className="absolute inset-6 rounded-full flex items-center justify-center border" style={{ borderColor: "rgba(0,200,140,0.15)" }}>
              <span style={{ fontSize: "48px", filter: loading ? "brightness(1.3)" : "brightness(0.7)" }}>👁</span>
            </div>
            {/* Corner brackets */}
            {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-4 h-4`} style={{
                borderTop: i < 2 ? "2px solid rgba(0,200,140,0.6)" : "none",
                borderBottom: i >= 2 ? "2px solid rgba(0,200,140,0.6)" : "none",
                borderLeft: i % 2 === 0 ? "2px solid rgba(0,200,140,0.6)" : "none",
                borderRight: i % 2 === 1 ? "2px solid rgba(0,200,140,0.6)" : "none",
              }} />
            ))}
          </div>

          {status && (
            <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(0,200,140,0.7)" }}>
              ● {status}
            </p>
          )}
          {error && (
            <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(255,80,80,0.7)" }}>
              ✕ {error}
            </p>
          )}

          <button
            onClick={handleIrisScan}
            disabled={loading}
            className="w-full py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-50"
            style={{ border: "1px solid rgba(0,200,140,0.4)", color: "rgba(0,200,140,0.9)", background: "transparent" }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {loading ? "Scanning..." : "Begin Scan"}
          </button>

          <button onClick={() => { setStage("choose"); setError(""); setStatus(""); }}
            className="text-[9px] tracking-widest uppercase transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
          >
            Try another method
          </button>
        </div>
      )}

      {/* ── STAGE: OTP ── */}
      {stage === "otp" && (
        <div className="flex flex-col gap-5 w-full max-w-xs">
          <div className="text-center">
            <p className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              SMS Verification
            </p>
            <h2 className="text-white font-light tracking-[0.2em] uppercase" style={{ fontFamily: "Georgia, serif" }}>
              Phone Access
            </h2>
          </div>

          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent}
            className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all disabled:opacity-40 text-center tracking-widest"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
          />

          {!otpSent ? (
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-50"
              style={{ border: "1px solid rgba(0,200,140,0.35)", color: "rgba(0,200,140,0.9)", background: "transparent" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="bg-transparent px-4 py-3 text-xl text-white outline-none transition-all text-center tracking-[0.5em]"
                style={{ border: "1px solid rgba(0,200,140,0.3)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.7)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.3)")}
              />
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-50"
                style={{ border: "1px solid rgba(0,200,140,0.35)", color: "rgba(0,200,140,0.9)", background: "transparent" }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </>
          )}

          {status && <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(0,200,140,0.7)" }}>● {status}</p>}
          {error && <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(255,80,80,0.7)" }}>✕ {error}</p>}

          <button onClick={() => { setStage("choose"); setError(""); setStatus(""); setOtpSent(false); setOtpCode(""); }}
            className="text-[9px] tracking-widest uppercase text-center transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
          >
            ← Back
          </button>
        </div>
      )}

      {/* ── STAGE: GRANTED ── */}
      {stage === "granted" && (
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Unlock animation */}
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "rgba(0,200,140,0.5)" }} />
            <div className="absolute inset-0 rounded-full flex items-center justify-center border-2" style={{ borderColor: "rgba(0,200,140,0.6)", background: "rgba(0,200,140,0.08)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(0,200,140,0.9)" strokeWidth="1.5" />
                <path d="M7 11V7a5 5 0 0 1 10 0" stroke="rgba(0,200,140,0.9)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="rgba(0,200,140,0.9)" />
              </svg>
            </div>
          </div>

          <div>
            <h2 className="text-white font-light tracking-[0.3em] uppercase text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Access Granted
            </h2>
            {confidence > 0 && (
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>
                Confidence: {confidence}%
              </p>
            )}
          </div>

          <div className="border px-6 py-3 text-[10px] tracking-widest uppercase" style={{ borderColor: "rgba(0,200,140,0.2)", color: "rgba(0,200,140,0.6)" }}>
            ● Admin has been notified
          </div>

          <div className="flex flex-col gap-2 items-center">
            <div className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
              Entry logged to database
            </div>
            <button
              onClick={() => { setStage("choose"); setConfidence(0); setStatus(""); setOtpSent(false); setOtpCode(""); }}
              className="text-[9px] tracking-widest uppercase transition-colors mt-4"
              style={{ color: "rgba(255,255,255,0.2)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
            >
              New request →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: DENIED ── */}
      {stage === "denied" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full flex items-center justify-center border-2" style={{ borderColor: "rgba(255,60,60,0.5)", background: "rgba(255,60,60,0.06)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div>
            <h2 className="text-white font-light tracking-[0.3em] uppercase text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Access Denied
            </h2>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,80,80,0.5)" }}>
              Identity not recognized
            </p>
          </div>

          <div className="border px-6 py-3 text-[10px] tracking-widest uppercase" style={{ borderColor: "rgba(255,60,60,0.2)", color: "rgba(255,80,80,0.5)" }}>
            ● Attempt logged
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={() => { setStage("choose"); setError(""); setStatus(""); setOtpSent(false); setOtpCode(""); }}
              className="text-[9px] tracking-widest uppercase transition-colors"
              style={{ color: "rgba(0,200,140,0.4)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.8)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.4)")}
            >
              Try again →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
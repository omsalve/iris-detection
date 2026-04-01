"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMethod = "password" | "iris" | "otp";

const API = "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("password");

  // Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError("");
    // Mock: accept any admin@irisguard.com / admin123
    await new Promise((r) => setTimeout(r, 800));
    if (email === "admin@irisguard.com" && password === "admin123") {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials. Use admin@irisguard.com / admin123");
    }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!phone) { setError("Enter a phone number"); return; }
    setLoading(true);
    setError("");
    try {
      await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
      setStatus("OTP sent to " + phone);
    } catch {
      setError("Failed to send OTP. Is the backend running?");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) { setError("Enter the OTP"); return; }
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
        router.push("/dashboard");
      } else {
        setError("Invalid OTP. Check console for dev OTP.");
      }
    } catch {
      setError("Failed to verify OTP. Is the backend running?");
    }
    setLoading(false);
  };

  const handleIrisLogin = async () => {
    setLoading(true);
    setError("");
    setStatus("Scanning iris...");
    try {
      // Mock base64 image for now — IrisScanner will replace this
      const res = await fetch(`${API}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: "mock_admin_iris" }),
      });
      const data = await res.json();
      if (data.matched) {
        setStatus(`Match confirmed — confidence ${(data.confidence * 100).toFixed(0)}%`);
        await new Promise((r) => setTimeout(r, 800));
        router.push("/dashboard");
      } else {
        setError(`Iris not recognized — confidence too low (${(data.confidence * 100).toFixed(0)}%)`);
        setStatus("");
      }
    } catch {
      setError("Scanner unavailable. Is the backend running?");
      setStatus("");
    }
    setLoading(false);
  };

  const methods: { id: AuthMethod; label: string; icon: string }[] = [
    { id: "password", label: "Password", icon: "🔑" },
    { id: "iris", label: "Iris Scan", icon: "👁" },
    { id: "otp", label: "OTP", icon: "📱" },
  ];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: "#030a07", fontFamily: "monospace" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,120,0.07) 0%, transparent 70%)",
      }} />

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-[10px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: "rgba(0,200,140,0.4)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.8)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.4)")}
      >
        ← Back
      </Link>

      <div
        className="w-full max-w-sm border p-8 flex flex-col gap-6"
        style={{
          borderColor: "rgba(0,200,140,0.2)",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="text-center flex flex-col gap-1">
          <div
            className="flex items-center justify-center gap-2 mb-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z"
                stroke="rgba(0,200,140,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <h1
              className="text-white font-light uppercase tracking-[0.3em]"
              style={{ fontFamily: "Georgia, serif", fontSize: "1.25rem" }}
            >
              Admin Access
            </h1>
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(0,200,140,0.45)" }}>
            IrisGuard Control Panel
          </p>
        </div>

        {/* Method selector */}
        <div className="flex gap-1">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setError(""); setStatus(""); }}
              className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase transition-all duration-200 flex flex-col items-center gap-1"
              style={{
                border: method === m.id
                  ? "1px solid rgba(0,200,140,0.6)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: method === m.id
                  ? "rgba(0,200,140,0.1)"
                  : "transparent",
                color: method === m.id
                  ? "rgba(0,200,140,0.9)"
                  : "rgba(255,255,255,0.3)",
              }}
            >
              <span style={{ fontSize: "14px" }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Method content */}
        <div className="flex flex-col gap-4">
          {method === "password" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  border: "1px solid rgba(0,200,140,0.2)",
                  letterSpacing: "0.05em",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  border: "1px solid rgba(0,200,140,0.2)",
                  letterSpacing: "0.05em",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
              />
              <AuthButton onClick={handlePasswordLogin} loading={loading} label="Authenticate" />
            </>
          )}

          {method === "iris" && (
            <div className="flex flex-col items-center gap-4">
              {/* Iris scan placeholder — IrisScanner component will replace this */}
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center border relative overflow-hidden"
                style={{ borderColor: "rgba(0,200,140,0.3)" }}
              >
                <div
                  className="absolute inset-0 rounded-full animate-pulse opacity-20"
                  style={{ background: "radial-gradient(circle, rgba(0,200,140,0.4), transparent)" }}
                />
                <span style={{ fontSize: "48px" }}>👁</span>
                {/* Scanning ring */}
                <div
                  className="absolute inset-2 rounded-full border-2 border-dashed animate-spin"
                  style={{
                    borderColor: "rgba(0,200,140,0.3)",
                    animationDuration: "8s",
                  }}
                />
              </div>
              <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(0,200,140,0.4)" }}>
                Position your eye in the frame
              </p>
              <AuthButton onClick={handleIrisLogin} loading={loading} label="Scan Iris" />
            </div>
          )}

          {method === "otp" && (
            <>
              <input
                type="tel"
                placeholder="Phone (+91XXXXXXXXXX)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all disabled:opacity-40"
                style={{
                  border: "1px solid rgba(0,200,140,0.2)",
                  letterSpacing: "0.05em",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
              />
              {!otpSent ? (
                <AuthButton onClick={handleSendOTP} loading={loading} label="Send OTP" />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all tracking-[0.4em] text-center"
                    style={{ border: "1px solid rgba(0,200,140,0.2)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
                  />
                  <AuthButton onClick={handleVerifyOTP} loading={loading} label="Verify OTP" />
                  <button
                    onClick={() => { setOtpSent(false); setOtpCode(""); setStatus(""); }}
                    className="text-[9px] tracking-widest uppercase text-center transition-colors"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
                  >
                    Change number
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Status / error */}
        {status && (
          <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(0,200,140,0.7)" }}>
            ● {status}
          </p>
        )}
        {error && (
          <p className="text-[10px] tracking-widest uppercase text-center" style={{ color: "rgba(255,80,80,0.8)" }}>
            ✕ {error}
          </p>
        )}

        {/* Divider */}
        <div className="border-t" style={{ borderColor: "rgba(0,200,140,0.08)" }} />

        {/* Footer note */}
        <p className="text-center text-[9px] tracking-[0.15em] uppercase" style={{ color: "rgba(0,200,140,0.2)" }}>
          Authorized Personnel Only
        </p>
      </div>
    </main>
  );
}

function AuthButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50"
      style={{
        border: "1px solid rgba(0,200,140,0.4)",
        color: "rgba(0,200,140,0.9)",
        background: "transparent",
        fontFamily: "monospace",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.8)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.4)";
      }}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
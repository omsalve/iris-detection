"use client";

import { useState, useRef, useCallback } from "react";
import WebcamScanner, { type WebcamScannerHandle } from "../components/WebcamScanner";

type Stage = "choose" | "iris" | "otp" | "granted" | "denied";

const API = "http://127.0.0.1:8000";
export default function AccessPage() {
  const [stage,      setStage]      = useState<Stage>("choose");
  const [phone,      setPhone]      = useState("");
  const [otpCode,    setOtpCode]    = useState("");
  const [otpSent,    setOtpSent]    = useState(false);
  const [scanning,   setScanning]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [status,     setStatus]     = useState("");
  const [confidence, setConfidence] = useState(0);
  const [overlayFrame,  setOverlayFrame]  = useState<string | null>(null);
  const [snapshotUrl,   setSnapshotUrl]   = useState<string | null>(null);

  const scannerRef = useRef<WebcamScannerHandle>(null);

  /* ── Iris scan handler ─────────────────────────────────────────── */
  const handleIrisScan = useCallback(async (base64Image: string) => {
    setScanning(false);
    setLoading(true);
    setError("");
    setStatus("Analysing biometric data…");

    try {
      const res = await fetch(`${API}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64Image }),
      });

      const data = await res.json();

      // Show the HUD overlay frame from backend
      if (data.overlay_frame) setOverlayFrame(data.overlay_frame);
      if (data.snapshot_url)  setSnapshotUrl(data.snapshot_url);

      setConfidence(Math.round(data.confidence * 100));

      if (data.matched) {
        setStatus("Identity confirmed — notifying admin…");
        await fetch(`${API}/admin/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Visitor access granted via iris scan" }),
        }).catch(() => {});
        setTimeout(() => setStage("granted"), 1200);
      } else {
        setStatus("No biometric match detected.");
        setTimeout(() => setStage("denied"), 900);
      }
    } catch {
      setError("Scanner offline. Backend not reachable.");
      setStatus("");
    }

    setLoading(false);
  }, []);

  /* ── OTP handlers ──────────────────────────────────────────────── */
  const handleSendOTP = async () => {
    if (!phone) { setError("Enter your phone number"); return; }
    setLoading(true); setError("");
    try {
      await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setOtpSent(true);
      setStatus("OTP sent — check your phone");
    } catch { setError("Failed to send OTP. Backend offline?"); }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) { setError("Enter the OTP code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Verified — notifying admin…");
        await fetch(`${API}/admin/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: `Visitor access granted via OTP (${phone})` }),
        }).catch(() => {});
        setTimeout(() => setStage("granted"), 1000);
      } else {
        setTimeout(() => setStage("denied"), 500);
      }
    } catch { setError("Verification failed. Backend offline?"); }
    setLoading(false);
  };

  const resetIris = () => {
    setScanning(false); setLoading(false); setError(""); setStatus("");
    setOverlayFrame(null); setSnapshotUrl(null);
    setStage("choose");
  };

  /* ── Shared styles ─────────────────────────────────────────────── */
  const btn      = "w-full py-3 text-xs tracking-[0.2em] uppercase border transition-all duration-300 disabled:opacity-40 font-mono";
  const btnGreen = "border-[rgba(0,200,140,0.4)] text-[rgba(0,200,140,0.9)] hover:bg-[rgba(0,200,140,0.08)] hover:border-[rgba(0,200,140,0.8)]";
  const btnWhite = "border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.4)] hover:border-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.7)]";
  const inputSty = "bg-transparent px-4 py-3 text-sm text-white outline-none border border-[rgba(0,200,140,0.2)] focus:border-[rgba(0,200,140,0.6)] transition-all w-full font-mono tracking-wide";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: "#030a07", fontFamily: "monospace" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,120,0.06) 0%, transparent 70%)" }}
      />

      {/* ── CHOOSE METHOD ── */}
      {stage === "choose" && (
        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <p className="text-center text-[10px] tracking-[0.25em] uppercase mb-2"
            style={{ color: "rgba(0,200,140,0.5)" }}>
            Select Access Method
          </p>
          <button className={`${btn} ${btnGreen}`} onClick={() => setStage("iris")}>
            👁 Iris Scan
          </button>
          <button className={`${btn} ${btnWhite}`} onClick={() => setStage("otp")}>
            📱 OTP Verification
          </button>
        </div>
      )}

      {/* ── IRIS SCAN ── */}
      {stage === "iris" && (
        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <p className="text-center text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(0,200,140,0.5)" }}>
            Iris Scan
          </p>

          {/* Webcam + overlay container */}
          <div
            className="relative w-full aspect-square rounded-full overflow-hidden border"
            style={{ borderColor: "rgba(0,200,140,0.3)" }}
          >
            {/* Outer spinning ring during scan */}
            {scanning && (
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed animate-spin z-10 pointer-events-none"
                style={{ borderColor: "rgba(0,200,140,0.5)", animationDuration: "3s" }}
              />
            )}

            <WebcamScanner
              ref={scannerRef}
              onCapture={handleIrisScan}
              isScanning={scanning}
              overlayFrame={overlayFrame}
            />
          </div>

          {/* Eye snapshot thumbnail — shown after scan */}
          {snapshotUrl && snapshotUrl.startsWith("http") && (
            <div className="flex flex-col gap-1">
              <p className="text-[9px] tracking-[0.2em] uppercase text-center"
                style={{ color: "rgba(0,200,140,0.4)" }}>
                Eye Snapshot Captured
              </p>
              <div
                className="w-full overflow-hidden border"
                style={{ borderColor: "rgba(0,200,140,0.2)", maxHeight: "80px" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={snapshotUrl}
                  alt="Eye scan snapshot"
                  className="w-full object-cover"
                  style={{ filter: "hue-rotate(100deg) saturate(0.6) brightness(0.9)" }}
                />
              </div>
            </div>
          )}

          <button
            className={`${btn} ${btnGreen}`}
            disabled={loading || scanning}
            onClick={() => { setError(""); setStatus(""); setOverlayFrame(null); setScanning(true); }}
          >
            {loading ? "Processing…" : scanning ? "Capturing…" : "Scan Iris"}
          </button>

          {status && (
            <p className="text-center text-[10px] tracking-widest uppercase"
              style={{ color: "rgba(0,200,140,0.7)" }}>
              ● {status}
            </p>
          )}
          {error && (
            <p className="text-center text-[10px] tracking-widest uppercase"
              style={{ color: "rgba(255,80,80,0.8)" }}>
              ✕ {error}
            </p>
          )}

          <button className={`${btn} ${btnWhite}`} onClick={resetIris}>
            ← Back
          </button>
        </div>
      )}

      {/* ── OTP ── */}
      {stage === "otp" && (
        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <p className="text-center text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(0,200,140,0.5)" }}>
            OTP Verification
          </p>

          <input
            className={inputSty}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            disabled={otpSent}
          />

          {!otpSent ? (
            <button className={`${btn} ${btnGreen}`} onClick={handleSendOTP} disabled={loading}>
              {loading ? "Sending…" : "Send OTP"}
            </button>
          ) : (
            <>
              <input
                className={`${inputSty} tracking-[0.4em] text-center`}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
              />
              <button className={`${btn} ${btnGreen}`} onClick={handleVerifyOTP} disabled={loading}>
                {loading ? "Verifying…" : "Verify OTP"}
              </button>
              <button
                className="text-[9px] tracking-widest uppercase text-center transition-colors"
                style={{ color: "rgba(255,255,255,0.2)" }}
                onClick={() => { setOtpSent(false); setOtpCode(""); setStatus(""); }}
              >
                Change number
              </button>
            </>
          )}

          {status && (
            <p className="text-center text-[10px] tracking-widest uppercase"
              style={{ color: "rgba(0,200,140,0.7)" }}>
              ● {status}
            </p>
          )}
          {error && (
            <p className="text-center text-[10px] tracking-widests uppercase"
              style={{ color: "rgba(255,80,80,0.8)" }}>
              ✕ {error}
            </p>
          )}

          <button
            className={`${btn} ${btnWhite}`}
            onClick={() => { setStage("choose"); setError(""); setStatus(""); setOtpSent(false); }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* ── GRANTED ── */}
      {stage === "granted" && (
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border"
            style={{
              borderColor: "rgba(0,200,140,0.5)",
              background: "rgba(0,200,140,0.08)",
              boxShadow: "0 0 40px rgba(0,200,140,0.2)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>✓</span>
          </div>

          <div className="text-center flex flex-col gap-2">
            <h1 className="text-white font-light tracking-[0.3em] uppercase text-xl"
              style={{ fontFamily: "Georgia, serif" }}>
              Access Granted
            </h1>
            {confidence > 0 && (
              <p className="text-[10px] tracking-widest uppercase"
                style={{ color: "rgba(0,200,140,0.5)" }}>
                Confidence: {confidence}%
              </p>
            )}

            {/* Snapshot displayed on granted screen */}
            {snapshotUrl && snapshotUrl.startsWith("http") && (
              <div className="mt-2 flex flex-col gap-1 items-center">
                <p className="text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(0,200,140,0.35)" }}>
                  Eye Scan Stored
                </p>
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "rgba(0,200,140,0.15)", width: "120px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={snapshotUrl}
                    alt="Stored eye scan"
                    className="w-full object-cover"
                    style={{ filter: "hue-rotate(100deg) saturate(0.5) brightness(0.85)" }}
                  />
                </div>
              </div>
            )}
          </div>

          <button className={`${btn} ${btnGreen} max-w-xs`} onClick={() => {
            setStage("choose"); setConfidence(0); setStatus("");
            setOverlayFrame(null); setSnapshotUrl(null);
          }}>
            Reset
          </button>
        </div>
      )}

      {/* ── DENIED ── */}
      {stage === "denied" && (
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border"
            style={{
              borderColor: "rgba(255,60,60,0.4)",
              background: "rgba(255,60,60,0.06)",
              boxShadow: "0 0 40px rgba(255,60,60,0.15)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>✕</span>
          </div>
          <h1 className="text-white font-light tracking-[0.3em] uppercase text-xl"
            style={{ fontFamily: "Georgia, serif" }}>
            Access Denied
          </h1>
          <button className={`${btn} ${btnWhite} max-w-xs`} onClick={() => {
            setStage("choose"); setStatus(""); setError("");
            setOverlayFrame(null); setSnapshotUrl(null);
          }}>
            Try Again
          </button>
        </div>
      )}
    </main>
  );
}
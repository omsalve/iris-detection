"use client";

import { useState } from "react";
import Link from "next/link";
import WebcamScanner from "../components/WebcamScanner";

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

  const handleIrisScan = async (base64Image: string) => {
    setLoading(true);
    setError("");
    setStatus("Scanning iris pattern...");

    try {
      const res = await fetch(`${API}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64Image }),
      });

      const data = await res.json();
      setConfidence(Math.round(data.confidence * 100));

      if (data.matched) {
        setStatus("Match confirmed — notifying admin...");

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
    if (!phone) {
      setError("Enter your phone number");
      return;
    }

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
    if (!otpCode) {
      setError("Enter the OTP code");
      return;
    }

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
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#030a07" }}>
      {stage === "choose" && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setStage("iris")} className="border p-4">
            Iris Scan
          </button>
          <button onClick={() => setStage("otp")} className="border p-4">
            OTP
          </button>
        </div>
      )}

      {stage === "iris" && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <WebcamScanner
  onCapture={(base64: string) => {
    handleIrisScan(base64);
  }}
  isScanning={loading}
/>
          {status && <p>{status}</p>}
          {error && <p>{error}</p>}

          <button onClick={() => setStage("choose")}>Back</button>
        </div>
      )}

      {stage === "otp" && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />

          {!otpSent ? (
            <button onClick={handleSendOTP}>Send OTP</button>
          ) : (
            <>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="OTP"
              />
              <button onClick={handleVerifyOTP}>Verify</button>
            </>
          )}

          {status && <p>{status}</p>}
          {error && <p>{error}</p>}

          <button onClick={() => setStage("choose")}>Back</button>
        </div>
      )}

      {stage === "granted" && (
        <div>
          <h1>Access Granted</h1>
          <p>Confidence: {confidence}%</p>
          <button onClick={() => setStage("choose")}>Reset</button>
        </div>
      )}

      {stage === "denied" && (
        <div>
          <h1>Access Denied</h1>
          <button onClick={() => setStage("choose")}>Try Again</button>
        </div>
      )}
    </main>
  );
}
"use client";

import { useState, useEffect } from "react";
import WebcamScanner from "../components/WebcamScanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AccessTerminal() {
  const [status, setStatus] = useState<"idle" | "scanning" | "granted" | "denied">("idle");
  const [message, setMessage] = useState("AWAITING SUBJECT...");
  const [overlayFrame, setOverlayFrame] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [now, setNow] = useState("");
  
  // OTP Fallback state
  const [useOtp, setUseOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Clock for the terminal UI
  useEffect(() => {
    const tick = () => {
      setNow(new Date().toLocaleTimeString("en-IN", { 
        hour: "2-digit", minute: "2-digit", second: "2-digit" 
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Handle image captured from WebcamScanner
  const handleCapture = async (base64: string) => {
    setIsScanning(false); // Reset trigger
    setStatus("scanning");
    setMessage("ANALYZING BIOMETRICS...");

    try {
      // Clean base64 string for Python backend
      const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

      const res = await fetch(`${API_URL}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: cleanBase64 }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();

      if (data.overlay_frame) {
        setOverlayFrame(data.overlay_frame);
      }

      if (data.matched) {
        setStatus("granted");
        setMessage(`ACCESS GRANTED [CONFIDENCE: ${(data.confidence * 100).toFixed(1)}%]`);
      } else {
        setStatus("denied");
        setMessage("ACCESS DENIED: UNRECOGNIZED SUBJECT");
      }

    } catch (err) {
      console.error(err);
      setStatus("denied");
      setMessage("SYSTEM ERROR: UNABLE TO CONNECT TO SERVER");
    } finally {
      // Auto-reset terminal after 3.5 seconds
      setTimeout(() => {
        setStatus("idle");
        setMessage("AWAITING SUBJECT...");
        setOverlayFrame(null);
      }, 3500);
    }
  };

  // Handle OTP Submission
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    
    setVerifyingOtp(true);
    setStatus("scanning");
    setMessage("VERIFYING PASSCODE...");

    try {
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      
      const data = await res.json();

      if (data.success || data.matched || res.ok) { // Adjust based on your OTP endpoint response structure
        setStatus("granted");
        setMessage("ACCESS GRANTED VIA OVERRIDE");
        setOtpCode("");
      } else {
        setStatus("denied");
        setMessage("ACCESS DENIED: INVALID PASSCODE");
      }
    } catch (err) {
      setStatus("denied");
      setMessage("SYSTEM ERROR: VERIFICATION FAILED");
    } finally {
      setVerifyingOtp(false);
      setTimeout(() => {
        setStatus("idle");
        setMessage("AWAITING SUBJECT...");
      }, 3500);
    }
  };

  // Dynamic styling based on status
  const getThemeColor = () => {
    if (status === "granted") return { text: "text-green-400", border: "border-green-500", glow: "rgba(0, 220, 130, 0.4)" };
    if (status === "denied") return { text: "text-red-500", border: "border-red-500", glow: "rgba(255, 60, 60, 0.4)" };
    if (status === "scanning") return { text: "text-blue-400", border: "border-blue-500", glow: "rgba(60, 180, 255, 0.4)" };
    return { text: "text-[#00c88c]", border: "border-[#00c88c]/30", glow: "rgba(0, 200, 140, 0.15)" };
  };

  const theme = getThemeColor();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#030a07", fontFamily: "monospace" }}>
      
      {/* Terminal Container */}
      <div 
        className="w-full max-w-md relative flex flex-col items-center border transition-all duration-500 overflow-hidden"
        style={{ 
          borderColor: theme.border.replace("border-", ""),
          boxShadow: `0 0 40px ${theme.glow}`,
          background: "rgba(3, 10, 7, 0.8)" 
        }}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${status === "idle" ? "bg-[#00c88c]" : (status === "scanning" ? "bg-blue-400" : (status === "granted" ? "bg-green-400" : "bg-red-500"))}`} />
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Terminal 01</span>
          </div>
          <span className="text-[10px] tracking-widest text-white/30">{now}</span>
        </div>

        {/* Main Display Area */}
        <div className="w-full p-8 flex flex-col items-center justify-center min-h-[400px]">
          
          {!useOtp ? (
            <>
              {/* Camera Scanner View */}
              <div className="relative w-64 h-64 mb-8">
                <WebcamScanner 
                  isScanning={isScanning} 
                  onCapture={handleCapture} 
                  overlayFrame={overlayFrame} 
                />
              </div>

              {/* Status Message */}
              <div className="text-center h-12 flex items-center justify-center mb-6">
                <p className={`text-sm tracking-[0.2em] uppercase font-bold ${theme.text} transition-colors duration-300`}>
                  {message}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsScanning(true)}
                disabled={status !== "idle"}
                className={`w-full py-4 text-xs tracking-[0.25em] uppercase border transition-all duration-300 disabled:opacity-50
                  ${status === "idle" ? "hover:bg-[#00c88c]/10 hover:border-[#00c88c]" : ""}
                `}
                style={{ borderColor: "rgba(0, 200, 140, 0.3)", color: "rgba(0, 200, 140, 0.9)" }}
              >
                {status === "idle" ? "Initiate Scan" : "Processing..."}
              </button>
            </>
          ) : (
            /* OTP Fallback View */
            <div className="w-full flex flex-col items-center animate-fade-in">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-6 opacity-80" stroke="rgba(0, 200, 140, 0.8)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              
              <div className="text-center h-12 flex items-center justify-center mb-6">
                <p className={`text-sm tracking-[0.2em] uppercase font-bold ${theme.text} transition-colors duration-300`}>
                  {message === "AWAITING SUBJECT..." ? "ENTER SECURE PASSCODE" : message}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="w-full flex flex-col gap-4">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full bg-transparent border-b text-center text-3xl tracking-[0.5em] py-4 text-white outline-none transition-all placeholder:text-white/10 focus:border-[#00c88c]"
                  style={{ borderColor: "rgba(0, 200, 140, 0.3)" }}
                  disabled={status !== "idle"}
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={otpCode.length < 6 || status !== "idle" || verifyingOtp}
                  className="w-full py-4 mt-4 text-xs tracking-[0.25em] uppercase border transition-all duration-300 disabled:opacity-30 hover:bg-[#00c88c]/10 hover:border-[#00c88c]"
                  style={{ borderColor: "rgba(0, 200, 140, 0.3)", color: "rgba(0, 200, 140, 0.9)" }}
                >
                  {verifyingOtp ? "Verifying..." : "Authorize"}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer / Toggle Mode */}
        <div className="w-full p-4 border-t border-white/5 flex justify-center bg-black/20">
          <button
            onClick={() => {
              setUseOtp(!useOtp);
              setStatus("idle");
              setMessage("AWAITING SUBJECT...");
              setOtpCode("");
            }}
            disabled={status !== "idle"}
            className="text-[9px] tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors disabled:opacity-50"
          >
            {useOtp ? "Switch to Biometric Scanner" : "Access Denied? Use Passcode Override"}
          </button>
        </div>

        {/* Scan line effect */}
        {status === "scanning" && (
          <div 
            className="absolute left-0 right-0 h-[2px] z-50 pointer-events-none"
            style={{ 
              background: "linear-gradient(90deg, transparent 0%, rgba(60, 180, 255, 0.8) 50%, transparent 100%)",
              boxShadow: "0 0 10px rgba(60, 180, 255, 0.5)",
              animation: "scan-sweep 1.5s linear infinite" 
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
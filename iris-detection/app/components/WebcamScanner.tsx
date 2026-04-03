"use client";
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";

export interface WebcamScannerHandle {
  capture: () => string | null;
}

interface Props {
  onCapture: (base64: string) => void;
  isScanning: boolean;
  overlayFrame?: string | null; // base64 JPEG with HUD drawn by backend
}

const WebcamScanner = forwardRef<WebcamScannerHandle, Props>(
  ({ onCapture, isScanning, overlayFrame }, ref) => {
    const videoRef  = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState("");
    const [showOverlay, setShowOverlay] = useState(false);

    // Expose capture method to parent
    useImperativeHandle(ref, () => ({
      capture: () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement("canvas");
        canvas.width  = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9);
      },
    }));

    // Start camera
    useEffect(() => {
      let stream: MediaStream;
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
          setError("Camera access denied or unavailable.");
        }
      };
      startCamera();
      return () => { stream?.getTracks().forEach((t) => t.stop()); };
    }, []);

    // Capture frame when scanning starts
    useEffect(() => {
      if (!isScanning || !videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width  = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL("image/jpeg", 0.9));
      }
    }, [isScanning, onCapture]);

    // When overlayFrame arrives, flash it for 2 seconds then revert to live feed
    useEffect(() => {
      if (!overlayFrame) return;
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 2200);
      return () => clearTimeout(t);
    }, [overlayFrame]);

    // Draw overlay frame onto canvas
    useEffect(() => {
      if (!showOverlay || !overlayFrame || !canvasRef.current) return;
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;
        canvasRef.current.width  = img.width;
        canvasRef.current.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${overlayFrame}`;
    }, [showOverlay, overlayFrame]);

    if (error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-400 text-[10px] uppercase tracking-widest text-center px-4">{error}</p>
        </div>
      );
    }

    return (
      <>
        {/* Live camera feed — hidden when overlay is active */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-6 rounded-full object-cover w-[calc(100%-3rem)] h-[calc(100%-3rem)] transition-opacity duration-300"
          style={{
            filter: isScanning ? "brightness(1.3) contrast(1.2)" : "brightness(0.8)",
            opacity: showOverlay ? 0 : 1,
          }}
        />

        {/* Backend HUD overlay frame */}
        {showOverlay && overlayFrame && (
          <canvas
            ref={canvasRef}
            className="absolute inset-6 rounded-full object-cover w-[calc(100%-3rem)] h-[calc(100%-3rem)]"
            style={{ imageRendering: "pixelated" }}
          />
        )}

        {/* Animated scan-line sweep (CSS only, always visible) */}
        {isScanning && (
          <div
            className="absolute inset-6 rounded-full overflow-hidden pointer-events-none z-10"
            style={{ mixBlendMode: "screen" }}
          >
            {/* horizontal sweep */}
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(0,220,130,0.8) 50%, transparent 100%)",
                animation: "scan-sweep 1.2s ease-in-out infinite",
              }}
            />
            {/* radial pulse */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(0,220,130,0.12) 0%, transparent 70%)",
                animation: "pulse-glow 1s ease-in-out infinite alternate",
              }}
            />
          </div>
        )}

        {/* Eye-targeting reticle corners (always shown) */}
        <div className="absolute inset-6 rounded-full pointer-events-none z-20">
          {[
            "top-2 left-2 border-t-2 border-l-2 rounded-tl-full",
            "top-2 right-2 border-t-2 border-r-2 rounded-tr-full",
            "bottom-2 left-2 border-b-2 border-l-2 rounded-bl-full",
            "bottom-2 right-2 border-b-2 border-r-2 rounded-br-full",
          ].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-5 h-5 ${cls}`}
              style={{ borderColor: "rgba(0,220,130,0.6)" }}
            />
          ))}
        </div>

        <style>{`
          @keyframes scan-sweep {
            0%   { top: 10%; opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { top: 90%; opacity: 0; }
          }
          @keyframes pulse-glow {
            from { opacity: 0.4; }
            to   { opacity: 1; }
          }
        `}</style>
      </>
    );
  }
);

WebcamScanner.displayName = "WebcamScanner";
export default WebcamScanner;
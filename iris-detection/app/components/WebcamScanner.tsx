"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export default function WebcamScanner({ 
  onCapture, 
  isScanning 
}: { 
  onCapture: (base64: string) => void;
  isScanning: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
      }
    };
    startCamera();

    // Cleanup tracks on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture frame when scanning starts
  useEffect(() => {
    if (isScanning && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Extract base64. Your backend already handles the 'data:image/jpeg;base64,' prefix.
        const base64Image = canvas.toDataURL("image/jpeg", 0.9);
        onCapture(base64Image);
      }
    }
  }, [isScanning, onCapture]);

  if (error) {
    return <div className="text-red-400 text-[10px] uppercase text-center">{error}</div>;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-6 rounded-full object-cover w-[calc(100%-3rem)] h-[calc(100%-3rem)]"
      style={{ filter: isScanning ? "brightness(1.3) contrast(1.2)" : "brightness(0.8)" }}
    />
  );
}
"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { IconNoCam } from "./ui";

export interface WebcamScannerHandle {
  capture: () => string | null;
}

export type FeedState = "starting" | "live" | "denied" | "unavailable";

interface Props {
  onStateChange?: (s: FeedState) => void;
  /** Dims and cools the picture while the system is thinking. */
  busy?: boolean;
}

/**
 * The camera.
 *
 * Owns the stream and nothing else. It never draws analysis over the
 * picture — the frame the backend marks up is rendered separately, so
 * what you see here is never retouched by us.
 */
const WebcamScanner = forwardRef<WebcamScannerHandle, Props>(
  ({ onStateChange, busy = false }, ref) => {
    const video = useRef<HTMLVideoElement>(null);
    const [state, setState] = useState<FeedState>("starting");

    const report = useCallback(
      (s: FeedState) => { setState(s); onStateChange?.(s); },
      [onStateChange]
    );

    useImperativeHandle(ref, () => ({
      capture: () => {
        const v = video.current;
        if (!v || !v.videoWidth) return null;
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return null;
        // Captured unmirrored — the backend needs the real geometry.
        ctx.drawImage(v, 0, 0);
        return c.toDataURL("image/jpeg", 0.9);
      },
    }));

    useEffect(() => {
      let stream: MediaStream | null = null;
      let cancelled = false;

      (async () => {
        if (!navigator.mediaDevices?.getUserMedia) return report("unavailable");
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          if (video.current) {
            video.current.srcObject = stream;
            report("live");
          }
        } catch (err) {
          const n = (err as DOMException)?.name;
          report(n === "NotFoundError" || n === "OverconstrainedError" ? "unavailable" : "denied");
        }
      })();

      return () => {
        cancelled = true;
        stream?.getTracks().forEach((t) => t.stop());
      };
    }, [report]);

    if (state === "denied" || state === "unavailable") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--warn-dim)", color: "var(--warn)" }}
          >
            <IconNoCam size={24} />
          </span>
          <div className="max-w-[34ch]">
            <p className="text-[1rem] font-semibold">No camera</p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
              {state === "denied"
                ? "Your browser is blocking the camera for this page. Allow it in the address bar, then reload."
                : "This device doesn't have a camera we can use. Use a passcode instead."}
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <video
          ref={video}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{
            transform: "scaleX(-1)",
            opacity: state === "live" ? (busy ? 0.55 : 1) : 0,
            filter: busy ? "saturate(0.65)" : "none",
            transition: "opacity var(--d) var(--out), filter var(--d) var(--out)",
          }}
        />

        {/* A soft oval guide — where a face wants to be. No hard reticle. */}
        {state === "live" && (
          <svg
            viewBox="0 0 160 90"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <ellipse
              cx="80" cy="44" rx="27" ry="35"
              fill="none"
              stroke="rgb(165 180 252 / 0.5)"
              strokeWidth="0.7"
              strokeDasharray="3 3.5"
              vectorEffect="non-scaling-stroke"
              style={{ transition: "stroke var(--d) var(--out)" }}
            />
          </svg>
        )}

        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[0.9375rem] text-muted">Waking the camera…</p>
          </div>
        )}
      </>
    );
  }
);

WebcamScanner.displayName = "WebcamScanner";
export default WebcamScanner;

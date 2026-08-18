"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Eye, { type EyeMood } from "../components/Eye";
import WebcamScanner, {
  type FeedState,
  type WebcamScannerHandle,
} from "../components/WebcamScanner";
import {
  Button,
  ButtonLink,
  Card,
  Field,
  Header,
  IconBack,
  IconCamera,
  IconKey,
} from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const HOLD = 4000;

type Phase = "ready" | "working" | "granted" | "denied" | "problem";
type Route = "face" | "code";

export default function AccessPage() {
  const cam = useRef<WebcamScannerHandle>(null);
  const timer = useRef<number | undefined>(undefined);

  const [route, setRoute] = useState<Route>("face");
  const [phase, setPhase] = useState<Phase>("ready");
  const [message, setMessage] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [marked, setMarked] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedState>("starting");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const settled = phase === "granted" || phase === "denied" || phase === "problem";
  const working = phase === "working" || busy;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const reset = useCallback(() => {
    setPhase("ready");
    setMessage("");
    setConfidence(0);
    setMarked(null);
    setCode("");
    setSent(false);
    setEmail("");
    setFieldError("");
  }, []);

  const holdThenReset = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(reset, HOLD);
  }, [reset]);

  /* ── Face ─────────────────────────────────────────────────────── */
  const scan = async () => {
    const frame = cam.current?.capture();
    if (!frame) {
      setPhase("problem");
      setMessage("The camera didn't give us a frame. Try once more.");
      return holdThenReset();
    }

    setPhase("working");
    setMessage("Looking…");

    try {
      const b64 = frame.includes(",") ? frame.split(",")[1] : frame;
      const res = await fetch(`${API}/iris/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: b64 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();

      if (data.overlay_frame) setMarked(data.overlay_frame);
      const c = typeof data.confidence === "number" ? data.confidence : 0;
      setConfidence(c);

      if (data.matched) {
        setPhase("granted");
        setMessage(`Welcome back. We're ${(c * 100).toFixed(0)}% sure it's you.`);
      } else {
        setPhase("denied");
        setMessage("We don't recognise you. If you're expected, use a passcode instead.");
      }
    } catch {
      setPhase("problem");
      setMessage("We couldn't reach the door service. Nothing was recorded — try again.");
    } finally {
      holdThenReset();
    }
  };

  /* ── Passcode ─────────────────────────────────────────────────── */
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setFieldError("That doesn't look like an email address.");
    setBusy(true);
    setFieldError("");
    try {
      const data = await fetch(`${API}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());

      if (data.success) {
        setSent(true);
        setMessage("Code sent. It's good for a few minutes.");
      } else {
        setPhase("denied");
        setMessage("That address isn't on the list. Ask the admin to add you.");
        holdThenReset();
      }
    } catch {
      setPhase("problem");
      setMessage("We couldn't reach the door service. Try the camera instead.");
      holdThenReset();
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return setFieldError("The code is six digits.");
    setBusy(true);
    setFieldError("");
    setPhase("working");
    setMessage("Checking…");
    try {
      const data = await fetch(`${API}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      }).then((r) => r.json());

      if (data.success) {
        setConfidence(1);
        setPhase("granted");
        setMessage("Passcode accepted. Come in.");
      } else {
        setConfidence(0);
        setPhase("denied");
        setMessage("That code is wrong or has expired. Send a new one.");
      }
    } catch {
      setPhase("problem");
      setMessage("We couldn't check that code. Nothing was recorded.");
    } finally {
      setBusy(false);
      holdThenReset();
    }
  };

  /* ── The eye is the status display ────────────────────────────── */
  const mood: EyeMood =
    phase === "working" ? "scanning"
    : phase === "granted" ? "granted"
    : phase === "denied" ? "denied"
    : phase === "problem" ? "asleep"
    : route === "face" && feed !== "live" ? "asleep"
    : "idle";

  const tone =
    phase === "granted" ? "var(--granted)"
    : phase === "denied" ? "var(--denied)"
    : phase === "problem" ? "var(--warn)"
    : "var(--muted)";

  const headline =
    phase === "granted" ? "You're in"
    : phase === "denied" ? "Not you"
    : phase === "problem" ? "Something's off"
    : phase === "working" ? "One moment"
    : route === "face" ? "Look at the camera" : "Use a passcode";

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div aria-hidden="true" className="aurora" />

      <Header
        subtle="Front door"
        right={
          <ButtonLink href="/" variant="ghost" size="sm" icon={<IconBack size={16} />}>
            Back
          </ButtonLink>
        }
      />

      <p aria-live="assertive" className="sr-only">
        {settled ? `${headline}. ${message}` : phase === "working" ? "Checking" : ""}
      </p>

      <main
        id="main"
        className="relative mx-auto grid w-full max-w-[1180px] items-center gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-14"
      >
        {/* ── The eye, and what it's saying ──────────────────────── */}
        <section className="flex flex-col items-center text-center">
          <Eye
            size={400}
            mood={mood}
            level={settled || phase === "working" ? confidence : undefined}
            tracking={phase === "ready"}
          />

          <h1
            className="display mt-8 text-[clamp(1.875rem,5vw,2.75rem)]"
            style={{ color: settled ? tone : "var(--text)", transition: "color var(--d) var(--out)" }}
          >
            {headline}
          </h1>

          <p className="measure mt-3 min-h-[3rem] text-[1.0625rem] leading-relaxed text-muted">
            {message ||
              (route === "face"
                ? "Get your face inside the oval, then tap the button."
                : "We'll send a six-digit code to the address the admin has on file.")}
          </p>

          {/* The confidence figure, in words and in a figure. */}
          {(phase === "granted" || phase === "working") && confidence > 0 && (
            <p className="num a-fade mt-1 text-[0.875rem]" style={{ color: tone }}>
              {(confidence * 100).toFixed(1)}% match
            </p>
          )}
        </section>

        {/* ── The camera, or the passcode form ───────────────────── */}
        <section className="flex flex-col gap-4">
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0b0e] sm:aspect-[3/2]">
              {route === "face" ? (
                <>
                  <WebcamScanner ref={cam} onStateChange={setFeed} busy={working} />
                  {/* The frame the system actually looked at. */}
                  {marked && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`data:image/jpeg;base64,${marked}`}
                      alt="The frame IrisGuard looked at, with the eye regions it found drawn on it."
                      className="a-fade absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full w-full flex-col justify-center p-6 sm:p-8">
                  {!sent ? (
                    <form onSubmit={sendCode} className="a-fade flex flex-col gap-5">
                      <Field
                        label="Your email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                        placeholder="you@example.com"
                        error={fieldError || undefined}
                        disabled={busy}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={busy || !email.includes("@")}
                      >
                        {busy ? "Sending…" : "Send me a code"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={submitCode} className="a-fade flex flex-col gap-5">
                      <Field
                        label="Six-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setFieldError(""); }}
                        placeholder="000000"
                        hint={`Sent to ${email}`}
                        error={fieldError || undefined}
                        disabled={busy}
                        autoFocus
                        inputClassName="num h-14 text-center text-[1.5rem] tracking-[0.35em]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Button type="button" onClick={() => { setSent(false); setCode(""); }} disabled={busy}>
                          Back
                        </Button>
                        <Button type="submit" variant="primary" disabled={busy || code.length < 6}>
                          {busy ? "Checking…" : "Open the door"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* A soft indeterminate sweep while the backend thinks. */}
              {working && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                  <div
                    className="a-slide h-full w-1/3 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Primary action */}
          {route === "face" && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={feed !== "live" || phase !== "ready"}
              onClick={() => { setMarked(null); scan(); }}
              icon={<IconCamera size={19} />}
            >
              {phase === "ready"
                ? feed === "live" ? "Scan my face" : "Waiting for the camera"
                : settled ? "Just a sec…" : "Looking…"}
            </Button>
          )}

          {/* The other way in — always visible, never an apology. */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[0.875rem] text-faint">
              {route === "face" ? "Camera not working?" : "Camera working again?"}
            </span>
            <button
              type="button"
              disabled={working}
              onClick={() => { setRoute(route === "face" ? "code" : "face"); reset(); }}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] text-[0.875rem] font-medium transition-colors disabled:opacity-40"
              style={{ color: "var(--accent)" }}
            >
              {route === "face" ? <IconKey size={15} /> : <IconCamera size={15} />}
              {route === "face" ? "Use a passcode" : "Use the camera"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

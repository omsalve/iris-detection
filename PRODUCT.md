# Product

<!-- impeccable:product-schema 1 -->

> **Provenance note.** The user was AFK and explicitly waived the init interview
> ("edit automatically and do as you please, don't ask me for permissions").
> Facts below marked **[repo]** are read directly from code, config, or the
> README. Facts marked **[inferred]** are derived from the explicit brief plus
> repository evidence and were never confirmed by a human. Treat every
> **[inferred]** line as provisional.

## Platform

web

## Users

**[repo]** Two distinct people use this product, and they never share a screen.

1. **The administrator** — the person who owns the door. They enroll people by
   uploading a face photo plus a Telegram chat ID, watch the access log, and
   revoke people who should no longer get in. They work at a desktop, usually
   not under time pressure, and they are the only authenticated user in the
   system (Firebase email/password, `/login` → `/dashboard`).
2. **The person at the door** — a resident or a visitor standing in front of a
   camera, wanting in. **[inferred]** They are outdoors or in an entryway, often
   one-handed, often in bad light, and they are looking at a kiosk-style screen
   for at most a few seconds. They are not logged in and never will be.

**[repo]** A third party exists but has no screen: the Telegram bot channel that
receives breach snapshots and confidence diagnostics.

## Product Purpose

**[repo]** IrisGuard decides whether the person standing at a door is someone
the administrator enrolled, and it makes that decision legible — both to the
person at the door in the moment, and to the administrator afterward as an
auditable record.

**[repo]** Success is a correct, fast, and *explained* verdict: granted or
denied, with a confidence figure, an eye-tracking overlay showing what the
system actually looked at, a stored snapshot, and a log entry.

**[repo]** Originating context: an advanced academic capstone project. It is a
working prototype, not a deployed commercial security product.

## Positioning

**[repo]** The mechanism a neighboring product could not truthfully copy: the
verdict is *shown, not asserted*. The backend returns an OpenCV-drawn HUD frame
with the detected eye bounding boxes composited onto the captured image, plus a
128-dimension face-embedding Euclidean distance rendered as a confidence
percentage. The person at the door sees the machine's own view of their face —
the boxes it drew, the number it computed — not a green checkmark.

**[repo]** Second differentiator: graceful degradation is a designed feature,
not an accident. Every secondary action (eye cropping, cloud upload, telemetry,
Telegram dispatch) sits inside its own fail-safe boundary so identity evaluation
still returns a verdict when the network is gone. The OTP override exists for
exactly the case where biometrics correctly fail an authorized person.

## Operating Context

**[repo]** Five surfaces, all Next.js App Router:

| Route | Who | Job |
|---|---|---|
| `/` | Anyone | Front door. Choose administrator or visitor path. |
| `/access` | Person at the door | Webcam scan → verdict; OTP override fallback. |
| `/login` | Administrator | Firebase email/password auth. |
| `/dashboard` | Administrator | Enrolled people, person detail, enroll, remove, access logs. |
| `/admin` | Administrator | Live log stream + enrolled-user roster, auto-refresh every 5s. |

**[repo]** Backend is FastAPI at `NEXT_PUBLIC_API_URL` (default
`http://127.0.0.1:8000`), routers `/iris`, `/otp`, `/admin`, `/enroll`.
Persistence is Firebase (Auth + Firestore). Notification is a Telegram bot,
with Twilio SMS and Brevo email as alternate bindings.

**[repo]** The `/access` flow has real latency: a base64 frame goes up, face
recognition runs, an overlay frame comes back. The waiting state is a genuine,
unavoidable part of the experience — not a spinner to be minimized away.

**[repo]** Verdicts auto-reset to idle after 3.5 seconds. The terminal is
designed to be left running unattended between subjects.

## Capabilities and Constraints

**[repo]** Confirmed functionality:
- Face enrollment by photo upload (drag/drop or file picker, ≤10MB, image/*),
  requiring name + Telegram chat ID; email optional.
- Face verification returning `{matched, confidence, message, overlay_frame,
  snapshot_url}`.
- Email-addressed OTP with a registration precheck — unregistered emails are
  rejected before any code is sent, with the message "not registered by the
  admin".
- Access log of `{id, method, status, timestamp, location, details}` where
  method ∈ iris | otp | admin_alert | admin_override and status ∈ granted |
  denied | triggered.
- Person deactivate/activate toggle (client-state only today) and removal
  (DELETE `/enroll/{id}`).

**[repo]** Technical constraints that bind design:
- Next.js 16.2.2, React 19.2.4, Tailwind v4 (CSS-first `@theme`), TypeScript.
- No animation library is installed. Motion must be CSS/Web Animations/rAF, or a
  dependency must be added deliberately.
- Firestore timestamps arrive in three shapes (`{_seconds}`, ISO string with or
  without `Z`, epoch ms) and are already normalized in `app/admin/page.tsx`.
- `getUserMedia` requires a secure context; camera denial is a first-class state.
- The overlay frame is a raw base64 JPEG at camera resolution, drawn to canvas.

**[repo]** Known gaps that are *product* facts, not design bugs:
- `/dashboard` and `/admin` have no auth guard; both fetch unauthenticated.
- The `status` toggle does not persist to the backend.
- `location` is hardcoded "Front Door" server-side.
- `app/components/IrisScanner.jsx`, `OTPModal.jsx`, and `lib/types.ts` are empty
  files. `AccessLog.jsx`, `AdminAlert.jsx`, `StatusBadge.jsx` are orphaned —
  nothing imports them.

**[repo]** Terminology in use: *enroll* (not register), *subject* (person at the
door), *granted/denied*, *override*, *confidence*, *snapshot*, *terminal*.

## Brand Commitments

**[repo]** The name **IrisGuard** is fixed and appears in the FastAPI title, the
README, the deployed Vercel domain (`iris-guard.vercel.app`), and every screen.

**[repo]** The eye is the product's mark. It is drawn as SVG in three places at
three scales. It is the one visual element that must survive any redesign.

**[inferred]** No other brand asset exists — no logo file, no wordmark, no
typeface license, no color specification. Everything else is open.

## Evidence on Hand

**[repo]** Real material the design can build on:
- Live webcam feed via `getUserMedia`.
- Backend-rendered HUD overlay frames (real computer-vision output).
- Real Firestore access logs and enrolled-user records.
- Real confidence figures from Euclidean distance on face embeddings.
- `backend/snapshots/` — stored eye crops.

**[repo]** Absent, and must not be fabricated: customers, deployments,
certifications, uptime figures, pricing, accuracy benchmarks, security audits,
compliance claims (SOC 2, GDPR, FIPS), or any statement about how many doors
this protects. This is a capstone prototype and no claim may imply otherwise.

**[repo]** Demonstration data (log entries, enrolled names) may be authored at
full fidelity for empty states, but must be visibly labeled as sample data.

## Product Principles

1. **Show the machine's reasoning.** The overlay frame and the confidence figure
   are the product. Any design that hides them behind a badge has thrown away
   the thing that makes IrisGuard itself.
2. **The verdict is the loudest thing on the screen.** Granted, denied, and
   thinking must be distinguishable from across a room, in under a second, by
   someone not looking for them.
3. **Denial is not failure — it is a working system.** A denied scan is the
   product succeeding. The override path must sit in plain sight, never buried
   as an apology.
4. **Two products, one identity.** The door terminal is glanceable at distance;
   the dashboard is dense and readable up close. They share materials and marks,
   never layouts or type scales.
5. **Honest prototype.** Never dress the capstone as an enterprise deployment.
   Confidence about craft, zero claims about scale.

## Accessibility & Inclusion

**[repo]** The incumbent UI fails badly and this is a defect to be fixed, not a
style to be preserved: body text at 9–10px, uppercase, letter-spaced 0.25em, at
15–30% opacity on a near-black ground. Multiple values land under 2:1 contrast.

**[inferred]** Requirements binding the redesign:
- WCAG 2.2 AA contrast (4.5:1 body, 3:1 large text and UI boundaries).
- No text below 12px anywhere; no uppercase letter-spaced running text.
- Every state change announced to assistive tech — the verdict especially.
- Full keyboard reachability, visible focus, correct dialog semantics.
- `prefers-reduced-motion` honored across every animation the brief asks for.
- The camera-denied state must be as designed as the success state.

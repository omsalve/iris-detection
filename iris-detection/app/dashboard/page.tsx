"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAuth } from "firebase/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Person = {
  id: string;
  name: string;
  phone: string;
  irisDate: string;
  lastSeen: string;
  location: string;
  initials: string;
  status: "active" | "inactive";
  firestoreId?: string;
};

type LogEntry = {
  id: string;
  method: "iris" | "otp" | "admin_alert" | "admin_override";
  status: "granted" | "denied" | "triggered";
  timestamp: string;
  location: string;
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

const METHOD_LABEL: Record<string, string> = {
  iris: "Iris Scan", otp: "OTP", admin_alert: "Admin Alert", admin_override: "Override",
};

// ─────────────────────────────────────────────
// Enroll Modal — file upload, no camera
// ─────────────────────────────────────────────
function EnrollModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (person: Person) => void;
}) {
  const [name, setName]                   = useState("");
  const [phone, setPhone]                 = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [enrolling, setEnrolling]         = useState(false);
  const [error, setError]                 = useState("");
  const [dragging, setDragging]           = useState(false);
  const [mode, setMode]                   = useState<"upload" | "selfie">("upload");
  const [cameraActive, setCameraActive]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  // Start camera when selfie mode is active
  useEffect(() => {
    if (mode === "selfie" && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => setError("Camera access denied or unavailable."));
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, cameraActive]);

  const handleModeSwitch = (m: "upload" | "selfie") => {
    setCapturedImage(null);
    setError("");
    setCameraActive(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMode(m);
  };

  const takeSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024)   { setError("Image must be under 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setCapturedImage(e.target?.result as string); setError(""); };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async () => {
    if (!name.trim())   { setError("Enter a name."); return; }
    if (!capturedImage) { setError("Capture or upload a photo first."); return; }
    setEnrolling(true); setError("");
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      const base64 = capturedImage.includes(",") ? capturedImage.split(",")[1] : capturedImage;
      const res  = await fetch(`${API}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: name.trim(), image_base64: base64 }),
      });
      const data = await res.json();
      if (data.success) {
        const initials = name.trim().split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        onSuccess({ id: data.person_id ?? Date.now().toString(), firestoreId: data.person_id, name: name.trim(), phone: phone.trim() || "—", irisDate: new Date().toISOString().split("T")[0], lastSeen: new Date().toISOString(), location: "Front Door", initials, status: "active" });
      } else {
        setError(data.message ?? "Enrollment failed.");
      }
    } catch { setError("Backend unreachable."); }
    finally  { setEnrolling(false); }
  };

  const borderGreen = "rgba(0,200,140,0.2)";
  const textGreen   = "rgba(0,200,140,0.9)";
  const textDim     = "rgba(255,255,255,0.3)";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-6"
      style={{ background: "rgba(3,10,7,0.95)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm border flex flex-col gap-0 overflow-hidden" style={{ background: "#030a07", borderColor: borderGreen }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.1)" }}>
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.6)" }}>Enroll New Person</span>
          <button onClick={onClose} className="text-[10px] uppercase tracking-widest" style={{ color: textDim }}>✕</button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b" style={{ borderColor: "rgba(0,200,140,0.1)" }}>
          {(["upload", "selfie"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              className="flex-1 py-3 text-[9px] tracking-[0.2em] uppercase transition-all"
              style={{
                color:      mode === m ? textGreen : textDim,
                background: mode === m ? "rgba(0,200,140,0.07)" : "transparent",
                borderBottom: mode === m ? `2px solid ${textGreen}` : "2px solid transparent",
              }}
            >
              {m === "upload" ? "📁 File Upload" : "📸 Selfie"}
            </button>
          ))}
        </div>

        {/* Image capture area */}
        <div className="px-6 pt-6 pb-4">
          {capturedImage ? (
            <div className="relative w-full overflow-hidden" style={{ borderRadius: "2px", border: `1px solid ${borderGreen}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Preview" className="w-full object-cover" style={{ maxHeight: "200px", filter: "hue-rotate(100deg) saturate(0.4) brightness(0.9)", objectFit: "cover" }} />
              <div className="absolute top-2 left-2 px-2 py-1 text-[8px] tracking-widest uppercase" style={{ background: "rgba(0,200,140,0.15)", color: textGreen, border: `1px solid rgba(0,200,140,0.3)` }}>✓ Photo ready</div>
              <button
                onClick={() => { setCapturedImage(null); setError(""); if (mode === "selfie") setCameraActive(true); }}
                className="absolute top-2 right-2 px-2 py-1 text-[8px] tracking-widest uppercase"
                style={{ background: "rgba(3,10,7,0.8)", color: textDim, border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✕ Retake
              </button>
            </div>

          ) : mode === "upload" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className="relative w-full flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{ border: `2px dashed ${dragging ? "rgba(0,200,140,0.7)" : borderGreen}`, background: dragging ? "rgba(0,200,140,0.05)" : "rgba(0,200,140,0.02)", borderRadius: "2px", minHeight: "160px", gap: "10px" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(0,200,140,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 8 12 3 7 8" stroke="rgba(0,200,140,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(0,200,140,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="text-center flex flex-col gap-1">
                <span className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(0,200,140,0.7)" }}>Click or drop photo here</span>
                <span className="text-[9px] tracking-widest uppercase" style={{ color: textDim }}>JPG · PNG · WEBP — max 10MB</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

          ) : !cameraActive ? (
            <div
              className="w-full flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{ border: `2px dashed ${borderGreen}`, background: "rgba(0,200,140,0.02)", borderRadius: "2px", minHeight: "160px" }}
            >
              <span style={{ fontSize: "2rem" }}>📸</span>
              <button
                onClick={() => setCameraActive(true)}
                className="px-5 py-2 text-[9px] tracking-[0.2em] uppercase border transition-all"
                style={{ borderColor: "rgba(0,200,140,0.4)", color: textGreen }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Open Camera
              </button>
            </div>

          ) : (
            <div className="relative w-full overflow-hidden" style={{ borderRadius: "2px", border: `1px solid ${borderGreen}` }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: "200px", filter: "brightness(0.9)" }} />
              {/* scanning reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 rounded-full" style={{ border: "1.5px solid rgba(0,200,140,0.5)", boxShadow: "0 0 12px rgba(0,200,140,0.2)" }} />
              </div>
              <button
                onClick={takeSelfie}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 text-[9px] tracking-[0.2em] uppercase border transition-all"
                style={{ borderColor: "rgba(0,200,140,0.6)", color: textGreen, background: "rgba(3,10,7,0.8)" }}
              >
                Capture
              </button>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="px-6 pb-4 flex flex-col gap-3">
          {(["text", "tel"] as const).map((type, i) => (
            <input
              key={type}
              type={type}
              placeholder={i === 0 ? "Full name *" : "Phone (optional)"}
              value={i === 0 ? name : phone}
              onChange={(e) => i === 0 ? setName(e.target.value) : setPhone(e.target.value)}
              className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all"
              style={{ border: `1px solid ${borderGreen}`, fontFamily: "monospace" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
              onBlur={(e)  => (e.target.style.borderColor = borderGreen)}
            />
          ))}

          {error && <p className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,80,80,0.8)" }}>✕ {error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border" style={{ borderColor: "rgba(255,255,255,0.1)", color: textDim }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={enrolling || !capturedImage || !name.trim()}
              className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border transition-all disabled:opacity-30"
              style={{ borderColor: "rgba(0,200,140,0.4)", color: textGreen }}
              onMouseEnter={(e) => { if (!enrolling) (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {enrolling ? "Enrolling…" : "Enroll Face"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function Dashboard() {
  const [people, setPeople]                 = useState<Person[]>([]);
  const [logs, setLogs]                     = useState<LogEntry[]>([]);
  const [selected, setSelected]             = useState<Person | null>(null);
  const [showEnroll, setShowEnroll]         = useState(false);
  const [showConfirmDel, setShowConfirmDel] = useState(false);
  const [now, setNow]                       = useState("");
  const [deleteLoading, setDeleteLoading]   = useState(false);

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${API}/admin/logs`)
      .then((r) => r.json())
      .then((d) => { if (d.logs?.length) setLogs(d.logs); })
      .catch(() => {});

    fetch(`${API}/admin/enrolled-users`)
      .then((r) => r.json())
      .then((d) => {
        if (d.users?.length) {
          const people = d.users.map((user: any) => {
            const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            return {
              id: user.id,
              firestoreId: user.firestoreId,
              name: user.name,
              phone: "—",
              irisDate: user.enrolled_at.split("T")[0],
              lastSeen: user.enrolled_at,
              location: "Front Door",
              initials,
              status: "active" as const,
            };
          });
          setPeople(people);
        }
      })
      .catch(() => {});
  }, []);

  const handleEnrollSuccess = (person: Person) => {
    setPeople((prev) => [person, ...prev]);
    setShowEnroll(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteLoading(true);
    if (selected.firestoreId) {
      try {
        const auth  = getAuth();
        const token = await auth.currentUser?.getIdToken();
        await fetch(`${API}/enroll/${selected.firestoreId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch { /* non-blocking */ }
    }
    setPeople((prev) => prev.filter((p) => p.id !== selected.id));
    setSelected(null);
    setShowConfirmDel(false);
    setDeleteLoading(false);
  };

  const toggleStatus = (person: Person) => {
    const updated = { ...person, status: person.status === "active" ? "inactive" as const : "active" as const };
    setPeople((prev) => prev.map((p) => p.id === person.id ? updated : p));
    setSelected(updated);
  };

  const refreshLogs = () => {
    fetch(`${API}/admin/logs`)
      .then((r) => r.json())
      .then((d) => { if (d.logs?.length) setLogs(d.logs); })
      .catch(() => {});
  };

  const granted = logs.filter((l) => l.status === "granted").length;
  const denied  = logs.filter((l) => l.status === "denied").length;

  return (
    <div className="min-h-screen text-white" style={{ background: "#030a07", fontFamily: "monospace" }}>

      {/* ── TOPBAR ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "rgba(0,200,140,0.08)" }}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 20" className="w-8 opacity-90">
            <ellipse cx="20" cy="10" rx="19" ry="9" fill="none" stroke="#00c88c" strokeWidth="1.2" />
            <circle cx="20" cy="10" r="5.5" fill="#004d35" stroke="#00c88c" strokeWidth="0.8" />
            <circle cx="20" cy="10" r="2.5" fill="#050f0b" />
            <circle cx="22" cy="8.5" r="1" fill="rgba(255,255,255,0.55)" />
          </svg>
          <div>
            <span className="text-white font-light tracking-[0.25em] uppercase text-sm" style={{ fontFamily: "Georgia, serif" }}>IrisGuard</span>
            <span className="text-[9px] opacity-30 tracking-[0.2em] uppercase ml-2">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-widest opacity-25 hidden md:block">{now}</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ borderColor: "rgba(0,200,140,0.2)", background: "rgba(0,200,140,0.04)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00c88c" }} />
            <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(0,200,140,0.6)" }}>Secure</span>
          </div>
          <Link href="/"
            className="text-[9px] tracking-widest uppercase transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
          >
            Logout
          </Link>
        </div>
      </header>

      {/* ── STAT STRIP ── */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
        {[
          { label: "Registered",    value: people.length, color: "rgba(0,200,140,0.9)" },
          { label: "Granted Today", value: granted,       color: "rgba(0,200,140,0.6)" },
          { label: "Denied Today",  value: denied,        color: "rgba(255,80,80,0.6)" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center py-4 border-r last:border-r-0" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
            <span className="text-2xl font-light" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid md:grid-cols-2 min-h-[calc(100vh-120px)]">

        {/* ── LEFT: PEOPLE ── */}
        <div className="border-r flex flex-col" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Registered People</span>
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,200,140,0.1)", color: "rgba(0,200,140,0.7)" }}>{people.length}</span>
            </div>
            <button
              onClick={() => setShowEnroll(true)}
              className="text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-all"
              style={{ borderColor: "rgba(0,200,140,0.3)", color: "rgba(0,200,140,0.7)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.3)"; }}
            >
              + Enroll Person
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {people.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <span className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>No registered people</span>
              </div>
            )}
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className="w-full flex items-center gap-4 px-6 py-4 border-b text-left transition-all"
                style={{
                  borderColor: "rgba(0,200,140,0.05)",
                  background: selected?.id === p.id ? "rgba(0,200,140,0.06)" : "transparent",
                  borderLeft: selected?.id === p.id ? "2px solid rgba(0,200,140,0.5)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (selected?.id !== p.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { if (selected?.id !== p.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-light tracking-wider"
                  style={{
                    background: p.status === "active" ? "rgba(0,200,140,0.12)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${p.status === "active" ? "rgba(0,200,140,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color:  p.status === "active" ? "rgba(0,200,140,0.9)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-light tracking-wide text-white truncate">{p.name}</span>
                    {p.status === "active" && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "rgba(0,200,140,0.6)" }} />
                    )}
                  </div>
                  <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Last seen {timeAgo(p.lastSeen)} · {p.location}
                    {p.firestoreId && (
                      <span className="ml-2" style={{ color: "rgba(0,200,140,0.4)" }}>· enrolled</span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] opacity-20 shrink-0">
                  {selected?.id === p.id ? "▲" : "▶"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAIL or LOGS ── */}
        <div className="flex flex-col">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Person Detail</span>
                <button onClick={() => setSelected(null)} className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 flex flex-col px-6 py-6 gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-light tracking-widest"
                    style={{
                      background: selected.status === "active" ? "rgba(0,200,140,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${selected.status === "active" ? "rgba(0,200,140,0.35)" : "rgba(255,255,255,0.1)"}`,
                      color:  selected.status === "active" ? "rgba(0,200,140,0.9)" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {selected.initials}
                  </div>
                  <div>
                    <h2 className="text-white font-light tracking-widest text-lg">{selected.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected.status === "active" ? "rgba(0,200,140,0.7)" : "rgba(255,255,255,0.2)" }} />
                      <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: selected.status === "active" ? "rgba(0,200,140,0.6)" : "rgba(255,255,255,0.2)" }}>
                        {selected.status}
                      </span>
                      {selected.firestoreId && (
                        <span className="text-[9px] tracking-[0.15em] uppercase ml-2" style={{ color: "rgba(0,200,140,0.5)" }}>
                          · face enrolled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-0 border" style={{ borderColor: "rgba(0,200,140,0.08)" }}>
                  {[
                    { label: "Phone",         value: selected.phone },
                    { label: "Face Enrolled", value: new Date(selected.irisDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                    { label: "Last Seen",     value: fmt(selected.lastSeen) },
                    { label: "Location",      value: selected.location },
                    { label: "Last Access",   value: timeAgo(selected.lastSeen) },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                      <span className="text-[9px] tracking-[0.2em] uppercase w-28 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{row.label}</span>
                      <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => toggleStatus(selected)}
                    className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase transition-all border"
                    style={{ borderColor: "rgba(0,200,140,0.25)", color: "rgba(0,200,140,0.6)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {selected.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => setShowConfirmDel(true)}
                    className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase transition-all border"
                    style={{ borderColor: "rgba(255,60,60,0.25)", color: "rgba(255,80,80,0.6)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,60,60,0.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    Remove Person
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Recent Access Logs</span>
                <button
                  onClick={refreshLogs}
                  className="text-[9px] tracking-widest uppercase transition-colors"
                  style={{ color: "rgba(0,200,140,0.3)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.7)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(0,200,140,0.3)")}
                >
                  ↻ Refresh
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {logs.map((log, i) => {
                  const isGranted   = log.status === "granted";
                  const isDenied    = log.status === "denied";
                  const statusColor = isGranted ? "rgba(0,200,140,0.7)" : isDenied ? "rgba(255,80,80,0.7)" : "rgba(250,180,60,0.7)";
                  const statusBg    = isGranted ? "rgba(0,200,140,0.06)" : isDenied ? "rgba(255,60,60,0.06)" : "rgba(250,180,60,0.06)";
                  return (
                    <div
                      key={log.id ?? i}
                      className="flex items-center gap-4 px-6 py-3.5 border-b"
                      style={{ borderColor: "rgba(0,200,140,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {METHOD_LABEL[log.method] ?? log.method}
                        </span>
                        <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                          {log.location ?? "Front Door"} · {timeAgo(log.timestamp)}
                        </div>
                      </div>
                      <span className="text-[9px] font-light hidden sm:block shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {fmt(log.timestamp)}
                      </span>
                      <span
                        className="text-[8px] tracking-[0.15em] uppercase px-2 py-1 shrink-0"
                        style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}` }}
                      >
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ENROLL MODAL ── */}
      {showEnroll && (
        <EnrollModal
          onClose={() => setShowEnroll(false)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {showConfirmDel && selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: "rgba(3,10,7,0.92)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmDel(false); }}
        >
          <div className="w-full max-w-xs border p-6 flex flex-col gap-5" style={{ background: "#030a07", borderColor: "rgba(255,60,60,0.2)" }}>
            <div className="text-center flex flex-col gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,80,80,0.6)" }}>Confirm Removal</span>
              <p className="text-sm font-light text-white">{selected.name}</p>
              <p className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
                This will remove their face data and access rights
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDel(false)}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border transition-all disabled:opacity-40"
                style={{ borderColor: "rgba(255,60,60,0.4)", color: "rgba(255,80,80,0.9)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,60,60,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {deleteLoading ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,140,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = "http://localhost:8000";

type Person = {
  id: string;
  name: string;
  phone: string;
  irisDate: string;
  lastSeen: string;
  location: string;
  initials: string;
  status: "active" | "inactive";
};

type LogEntry = {
  id: string;
  method: "iris" | "otp" | "admin_alert" | "admin_override";
  status: "granted" | "denied" | "triggered";
  timestamp: string;
  location: string;
};

const SEED_PEOPLE: Person[] = [
  { id: "1", name: "Arjun Mehta",    phone: "+91 98765 43210", irisDate: "2025-03-10", lastSeen: "2025-03-31T08:42:00Z", location: "Front Door", initials: "AM", status: "active" },
  { id: "2", name: "Priya Sharma",   phone: "+91 91234 56789", irisDate: "2025-03-12", lastSeen: "2025-03-30T19:15:00Z", location: "Front Door", initials: "PS", status: "active" },
  { id: "3", name: "Rohan Das",      phone: "+91 99887 76655", irisDate: "2025-03-15", lastSeen: "2025-03-28T11:03:00Z", location: "Front Door", initials: "RD", status: "active" },
  { id: "4", name: "Kavya Nair",     phone: "+91 87654 32109", irisDate: "2025-03-20", lastSeen: "2025-03-25T14:30:00Z", location: "Front Door", initials: "KN", status: "inactive" },
];

const SEED_LOGS: LogEntry[] = [
  { id: "1", method: "iris",        status: "granted",   timestamp: new Date(Date.now() - 40000).toISOString(),   location: "Front Door" },
  { id: "2", method: "otp",         status: "granted",   timestamp: new Date(Date.now() - 120000).toISOString(),  location: "Front Door" },
  { id: "3", method: "iris",        status: "denied",    timestamp: new Date(Date.now() - 300000).toISOString(),  location: "Front Door" },
  { id: "4", method: "iris",        status: "granted",   timestamp: new Date(Date.now() - 600000).toISOString(),  location: "Front Door" },
  { id: "5", method: "admin_alert", status: "triggered", timestamp: new Date(Date.now() - 900000).toISOString(),  location: "System" },
  { id: "6", method: "otp",         status: "denied",    timestamp: new Date(Date.now() - 1800000).toISOString(), location: "Front Door" },
  { id: "7", method: "iris",        status: "granted",   timestamp: new Date(Date.now() - 3600000).toISOString(), location: "Front Door" },
];

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

export default function Dashboard() {
  const [people, setPeople]         = useState<Person[]>(SEED_PEOPLE);
  const [logs, setLogs]             = useState<LogEntry[]>(SEED_LOGS);
  const [selected, setSelected]     = useState<Person | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [showConfirmDel, setShowConfirmDel] = useState(false);
  const [tick, setTick]             = useState(0);
  const [now, setNow]               = useState("");

  // new person form
  const [newName, setNewName]   = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setNow(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    setNow(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    return () => clearInterval(id);
  }, []);

  // fetch real logs once
  useEffect(() => {
    fetch(`${API}/admin/logs`)
      .then((r) => r.json())
      .then((d) => { if (d.logs?.length) setLogs(d.logs); })
      .catch(() => {});
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const p: Person = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim() || "—",
      irisDate: new Date().toISOString().split("T")[0],
      lastSeen: new Date().toISOString(),
      location: "Front Door",
      initials: newName.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      status: "active",
    };
    setPeople((prev) => [p, ...prev]);
    setNewName(""); setNewPhone(""); setShowAdd(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    setPeople((prev) => prev.filter((p) => p.id !== selected.id));
    setSelected(null); setShowConfirmDel(false);
  };

  const active   = people.filter((p) => p.status === "active").length;
  const granted  = logs.filter((l) => l.status === "granted").length;
  const denied   = logs.filter((l) => l.status === "denied").length;

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
          <Link href="/" className="text-[9px] tracking-widest uppercase transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
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
          { label: "Registered", value: people.length, color: "rgba(0,200,140,0.9)" },
          { label: "Granted Today", value: granted, color: "rgba(0,200,140,0.6)" },
          { label: "Denied Today",  value: denied,  color: "rgba(255,80,80,0.6)" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center py-4 border-r last:border-r-0" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
            <span className="text-2xl font-light" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid md:grid-cols-2 min-h-[calc(100vh-120px)]" style={{ borderColor: "rgba(0,200,140,0.06)" }}>

        {/* ── LEFT: PEOPLE ── */}
        <div className="border-r flex flex-col" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
          {/* section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Registered People</span>
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,200,140,0.1)", color: "rgba(0,200,140,0.7)" }}>{people.length}</span>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-all"
              style={{ borderColor: "rgba(0,200,140,0.3)", color: "rgba(0,200,140,0.7)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,200,140,0.3)"; }}
            >
              + Add Person
            </button>
          </div>

          {/* people list */}
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
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-light tracking-wider"
                  style={{
                    background: p.status === "active" ? "rgba(0,200,140,0.12)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${p.status === "active" ? "rgba(0,200,140,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: p.status === "active" ? "rgba(0,200,140,0.9)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {p.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-light tracking-wide text-white truncate">{p.name}</span>
                    {p.status === "active" && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,200,140,0.6)" }} />
                    )}
                  </div>
                  <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Last seen {timeAgo(p.lastSeen)} · {p.location}
                  </div>
                </div>

                <span className="text-[9px] opacity-20 flex-shrink-0">
                  {selected?.id === p.id ? "▲" : "▶"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAIL PANEL or LOGS ── */}
        <div className="flex flex-col">
          {selected ? (
            /* ── PERSON DETAIL ── */
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Person Detail</span>
                <button onClick={() => setSelected(null)} className="text-[9px] tracking-widest uppercase transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 flex flex-col px-6 py-6 gap-6">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-light tracking-widest"
                    style={{
                      background: selected.status === "active" ? "rgba(0,200,140,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${selected.status === "active" ? "rgba(0,200,140,0.35)" : "rgba(255,255,255,0.1)"}`,
                      color: selected.status === "active" ? "rgba(0,200,140,0.9)" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {selected.initials}
                  </div>
                  <div>
                    <h2 className="text-white font-light tracking-[0.1em] text-lg">{selected.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected.status === "active" ? "rgba(0,200,140,0.7)" : "rgba(255,255,255,0.2)" }} />
                      <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: selected.status === "active" ? "rgba(0,200,140,0.6)" : "rgba(255,255,255,0.2)" }}>
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 gap-0 border" style={{ borderColor: "rgba(0,200,140,0.08)" }}>
                  {[
                    { label: "Phone",         value: selected.phone },
                    { label: "Iris Enrolled", value: new Date(selected.irisDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                    { label: "Last Seen",     value: fmt(selected.lastSeen) },
                    { label: "Location",      value: selected.location },
                    { label: "Last Access",   value: timeAgo(selected.lastSeen) },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                      <span className="text-[9px] tracking-[0.2em] uppercase w-28 flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{row.label}</span>
                      <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => {
                      setPeople((prev) => prev.map((p) =>
                        p.id === selected.id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
                      ));
                      setSelected((prev) => prev ? { ...prev, status: prev.status === "active" ? "inactive" : "active" } : null);
                    }}
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
            /* ── LOGS ── */
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,200,140,0.06)" }}>
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.5)" }}>Recent Access Logs</span>
                <button
                  onClick={() =>
                    fetch(`${API}/admin/logs`).then((r) => r.json())
                    .then((d) => { if (d.logs?.length) setLogs(d.logs); })
                    .catch(() => {})
                  }
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
                  const isGranted  = log.status === "granted";
                  const isDenied   = log.status === "denied";
                  const isAlert    = log.status === "triggered";
                  const statusColor = isGranted ? "rgba(0,200,140,0.7)" : isDenied ? "rgba(255,80,80,0.7)" : "rgba(250,180,60,0.7)";
                  const statusBg    = isGranted ? "rgba(0,200,140,0.06)" : isDenied ? "rgba(255,60,60,0.06)" : "rgba(250,180,60,0.06)";

                  return (
                    <div key={log.id ?? i}
                      className="flex items-center gap-4 px-6 py-3.5 border-b"
                      style={{ borderColor: "rgba(0,200,140,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                    >
                      {/* Status dot */}
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />

                      {/* Method */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {METHOD_LABEL[log.method] ?? log.method}
                        </span>
                        <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                          {log.location ?? "Front Door"} · {timeAgo(log.timestamp)}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[9px] font-light hidden sm:block flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {fmt(log.timestamp)}
                      </span>

                      {/* Badge */}
                      <span
                        className="text-[8px] tracking-[0.15em] uppercase px-2 py-1 flex-shrink-0"
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

      {/* ── ADD PERSON MODAL ── */}
      {showAdd && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: "rgba(3,10,7,0.92)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div className="w-full max-w-sm border p-6 flex flex-col gap-5" style={{ background: "#030a07", borderColor: "rgba(0,200,140,0.2)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,140,0.6)" }}>Add Person</span>
              <button onClick={() => setShowAdd(false)} className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all"
              style={{ border: "1px solid rgba(0,200,140,0.2)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="bg-transparent px-4 py-3 text-sm text-white outline-none transition-all"
              style={{ border: "1px solid rgba(0,200,140,0.2)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,200,140,0.2)")}
            />

            <div className="text-[9px] tracking-widest uppercase px-1" style={{ color: "rgba(255,255,255,0.15)" }}>
              Iris scan enrollment happens at the device
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}
              >
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border transition-all"
                style={{ borderColor: "rgba(0,200,140,0.4)", color: "rgba(0,200,140,0.9)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,140,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Add to Database
              </button>
            </div>
          </div>
        </div>
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
                This will remove their iris data and access rights
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDel(false)}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}
              >
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 text-[9px] tracking-[0.15em] uppercase border transition-all"
                style={{ borderColor: "rgba(255,60,60,0.4)", color: "rgba(255,80,80,0.9)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,60,60,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Remove
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
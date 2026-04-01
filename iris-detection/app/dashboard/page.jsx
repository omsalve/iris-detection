"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:8000";

const SEED_LOGS = [
  { id: 1, method: "iris",        status: "granted",   timestamp: new Date(Date.now() - 40000).toISOString(),  details: "confidence=0.94" },
  { id: 2, method: "otp",         status: "granted",   timestamp: new Date(Date.now() - 120000).toISOString(), details: "phone=+91*****1234" },
  { id: 3, method: "iris",        status: "denied",    timestamp: new Date(Date.now() - 300000).toISOString(), details: "confidence=0.21" },
  { id: 4, method: "iris",        status: "granted",   timestamp: new Date(Date.now() - 600000).toISOString(), details: "confidence=0.88" },
  { id: 5, method: "admin_alert", status: "triggered", timestamp: new Date(Date.now() - 900000).toISOString(), details: "Manual override" },
  { id: 6, method: "iris",        status: "denied",    timestamp: new Date(Date.now() - 1800000).toISOString(),details: "confidence=0.18" },
  { id: 7, method: "otp",         status: "granted",   timestamp: new Date(Date.now() - 3600000).toISOString(),details: "phone=+91*****5678" },
];

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function fmt(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ── mini sparkline (SVG) ──────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7 opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── donut chart ───────────────────────────────────────────────────────────────
function Donut({ granted, denied }) {
  const total = granted + denied || 1;
  const r = 38, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const grantedArc = (granted / total) * circ;
  const deniedArc  = (denied  / total) * circ;
  return (
    <svg viewBox="0 0 88 88" className="w-24 h-24">
      {/* bg ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      {/* denied arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth="10"
        strokeDasharray={`${deniedArc} ${circ}`}
        strokeDashoffset={-grantedArc}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />
      {/* granted arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00c88c" strokeWidth="10"
        strokeDasharray={`${grantedArc} ${circ}`}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />
      {/* label */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="13" fontFamily="monospace" opacity="0.9">
        {total}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" letterSpacing="1">
        SCANS
      </text>
    </svg>
  );
}

// ── status badge ──────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    granted:   "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    denied:    "text-red-400    border-red-500/30    bg-red-500/10",
    triggered: "text-amber-400  border-amber-500/30  bg-amber-500/10",
  };
  return (
    <span className={`text-[9px] tracking-widest uppercase border px-2 py-0.5 rounded-full font-mono flex-shrink-0 ${map[status] ?? map.denied}`}>
      {status}
    </span>
  );
}

// ── method icon ───────────────────────────────────────────────────────────────
const METHOD_ICON = { iris: "👁", otp: "📱", admin_alert: "⚠️", admin_override: "🔑" };
const METHOD_LABEL = { iris: "Iris Scan", otp: "OTP Auth", admin_alert: "Admin Alert", admin_override: "Override" };

// ── card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "", glow }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col gap-4 ${className}`}
      style={glow ? { boxShadow: `0 0 32px ${glow}22` } : {}}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return <span className="text-[10px] tracking-[0.25em] uppercase opacity-40 font-mono">{children}</span>;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [logs,      setLogs]      = useState(SEED_LOGS);
  const [loading,   setLoading]   = useState(false);
  const [tick,      setTick]      = useState(0); // forces timeAgo re-render

  // derived stats
  const granted   = logs.filter(l => l.status === "granted").length;
  const denied    = logs.filter(l => l.status === "denied").length;
  const triggered = logs.filter(l => l.status === "triggered").length;
  const total     = granted + denied;
  const grantRate = total ? Math.round((granted / total) * 100) : 0;

  // last 7 events grant=1 denied=0 as sparkline
  const sparkData = [...logs].reverse().slice(0, 7).map(l => l.status === "granted" ? 1 : 0);

  // system status
  const sysStatus = logs[0]?.status === "denied"    ? "Warning" :
                    logs[0]?.status === "triggered"  ? "Breach"  : "Secure";
  const statusColor = sysStatus === "Secure" ? "#00c88c" : sysStatus === "Warning" ? "#facc15" : "#f87171";

  // tick every 10s for timeAgo
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/logs`);
      const data = await res.json();
      if (data.logs?.length) setLogs(data.logs);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#030a07] text-white" style={{ fontFamily: "monospace" }}>

      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${statusColor}0f 0%, transparent 60%)`,
        transition: "background 1.2s ease",
      }} />

      {/* ── TOPBAR ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.06]">
        {/* logo */}
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 20" className="w-10 opacity-90">
            <ellipse cx="20" cy="10" rx="19" ry="9" fill="none" stroke="#00c88c" strokeWidth="1.2" />
            <circle cx="20" cy="10" r="5.5" fill="#004d35" stroke="#00c88c" strokeWidth="0.8" />
            <circle cx="20" cy="10" r="2.5" fill="#050f0b" />
            <circle cx="22" cy="8.5" r="1" fill="rgba(255,255,255,0.55)" />
          </svg>
          <div className="flex flex-col">
            <span className="text-white/90 font-light tracking-[0.25em] uppercase text-sm leading-none"
                  style={{ fontFamily: "Georgia, serif" }}>IrisGuard</span>
            <span className="text-[9px] opacity-30 tracking-[0.2em] uppercase mt-0.5">Smart Home Security</span>
          </div>
        </div>

        {/* status pill */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border rounded-full px-3 py-1.5"
               style={{ borderColor: `${statusColor}40`, background: `${statusColor}0a` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono" style={{ color: statusColor }}>
              {sysStatus}
            </span>
          </div>
          <span className="text-[10px] opacity-25 tracking-widest hidden md:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </span>
        </div>
      </header>

      {/* ── GRID ── */}
      <div className="relative z-10 p-6 grid gap-4"
           style={{ gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "auto" }}>

        {/* ── STAT: Total Scans + donut ── col 1-4 */}
        <Card className="col-span-12 md:col-span-4" glow="#00c88c">
          <CardLabel>Scan Overview</CardLabel>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-4xl font-light" style={{ color: "#00c88c" }}>{total}</p>
                <p className="text-[10px] opacity-40 tracking-widest mt-0.5 uppercase">Total scans</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-lg text-emerald-400">{granted}</p>
                  <p className="text-[9px] opacity-40 tracking-widest uppercase">Granted</p>
                </div>
                <div>
                  <p className="text-lg text-red-400">{denied}</p>
                  <p className="text-[9px] opacity-40 tracking-widest uppercase">Denied</p>
                </div>
              </div>
            </div>
            <Donut granted={granted} denied={denied} />
          </div>
        </Card>

        {/* ── STAT: Grant rate ── col 5-7 */}
        <Card className="col-span-6 md:col-span-3">
          <CardLabel>Grant Rate</CardLabel>
          <div className="flex flex-col gap-2 flex-1 justify-between">
            <p className="text-4xl font-light text-emerald-400">{grantRate}%</p>
            {/* progress bar */}
            <div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                     style={{ width: `${grantRate}%`, background: "linear-gradient(90deg,#00a86b,#00c88c)" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] opacity-30">0%</span>
                <span className="text-[9px] opacity-30">100%</span>
              </div>
            </div>
            <Sparkline data={sparkData} color="#00c88c" />
          </div>
        </Card>

        {/* ── STAT: Alerts ── col 8-9 */}
        <Card className="col-span-6 md:col-span-2">
          <CardLabel>Alerts</CardLabel>
          <div className="flex flex-col gap-1 flex-1 justify-between">
            <p className="text-4xl font-light text-amber-400">{triggered}</p>
            <p className="text-[9px] opacity-40 tracking-widest uppercase">Admin alerts</p>
            <div className="text-[9px] text-amber-400/50 font-mono mt-auto">
              {triggered === 0 ? "● No active alerts" : `● ${triggered} alert${triggered > 1 ? "s" : ""} fired`}
            </div>
          </div>
        </Card>

        {/* ── STAT: System health ── col 10-12 */}
        <Card className="col-span-12 md:col-span-3">
          <CardLabel>System Health</CardLabel>
          <div className="flex flex-col gap-2.5">
            {[
              { name: "FastAPI",   ok: true  },
              { name: "Firestore", ok: true  },
              { name: "OpenCV",    ok: true  },
              { name: "Twilio",    ok: false },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-[11px] font-mono opacity-55">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className={`text-[9px] tracking-widest uppercase font-mono ${s.ok ? "text-emerald-400/70" : "text-amber-400/70"}`}>
                    {s.ok ? "online" : "dev"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── ACCESS LOGS (full width) ── */}
        <Card className="col-span-12">
          {/* header row */}
          <div className="flex items-center justify-between">
            <CardLabel>Access Event Log</CardLabel>
            <button
              onClick={fetchLogs}
              className="text-[10px] tracking-widest uppercase text-emerald-500/60 hover:text-emerald-400 transition-colors font-mono"
            >
              {loading ? "loading…" : "↻ refresh"}
            </button>
          </div>

          {/* column headers */}
          <div className="grid gap-3 text-[9px] tracking-[0.2em] uppercase opacity-30 px-3"
               style={{ gridTemplateColumns: "2rem 1fr 5rem 7rem 6rem" }}>
            <span>#</span><span>Method</span><span>Details</span><span>Time</span><span className="text-right">Status</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {logs.map((log, i) => (
              <div
                key={log.id ?? i}
                className="grid gap-3 items-center px-3 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                style={{ gridTemplateColumns: "2rem 1fr 5rem 7rem 6rem" }}
              >
                {/* index */}
                <span className="text-[10px] opacity-25 font-mono">{String(i + 1).padStart(2, "0")}</span>

                {/* method */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{METHOD_ICON[log.method] ?? "🔐"}</span>
                  <span className="text-[11px] font-mono text-white/75 truncate">
                    {METHOD_LABEL[log.method] ?? log.method}
                  </span>
                </div>

                {/* details */}
                <span className="text-[10px] font-mono opacity-35 truncate">{log.details ?? "—"}</span>

                {/* time */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono opacity-55">{fmt(log.timestamp)}</span>
                  <span className="text-[9px] opacity-30">{timeAgo(log.timestamp)}</span>
                </div>

                {/* badge */}
                <div className="flex justify-end">
                  <Badge status={log.status} />
                </div>
              </div>
            ))}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="text-[9px] opacity-25 font-mono">
              Showing {logs.length} most recent events
            </span>
            <span className="text-[9px] opacity-25 font-mono">
              Source: {logs.length === SEED_LOGS.length ? "mock data" : "firebase firestore"}
            </span>
          </div>
        </Card>

        {/* ── ADMIN ALERT trigger ── */}
        <Card className="col-span-12 md:col-span-4 border-red-500/15" glow="#f87171">
          <CardLabel>Admin Override</CardLabel>
          <p className="text-[11px] opacity-35 leading-relaxed">
            Manually trigger a security alert. The event is logged to Firestore and the system status updates immediately.
          </p>
          <button
            onClick={async () => {
              try {
                await fetch(`${API}/admin/alert`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reason: "Manual override from dashboard" }),
                });
              } catch {}
              // add mock log entry
              setLogs(prev => [{
                id: Date.now(),
                method: "admin_alert",
                status: "triggered",
                timestamp: new Date().toISOString(),
                details: "Manual override",
              }, ...prev]);
            }}
            className="self-start px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-mono rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400/60 transition-all"
          >
            Trigger Alert
          </button>
        </Card>

        {/* ── QUICK LINKS ── */}
        <Card className="col-span-12 md:col-span-8">
          <CardLabel>Quick Access</CardLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Iris Scanner", icon: "👁",  href: "/iris"  },
              { label: "OTP Verify",   icon: "📱",  href: "/otp"   },
              { label: "Admin Panel",  icon: "🛡️",  href: "/admin" },
              { label: "Login",        icon: "🔑",  href: "/login" },
            ].map(link => (
              <a key={link.href} href={link.href}
                 className="flex flex-col items-center gap-2 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-emerald-500/[0.07] hover:border-emerald-500/30 transition-all group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{link.icon}</span>
                <span className="text-[10px] tracking-widest uppercase opacity-50 group-hover:opacity-80 transition-opacity font-mono">
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </Card>

      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,140,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
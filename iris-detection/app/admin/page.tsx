"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, Stat } from "../components/Activity";
import {

  ButtonLink,
  Card,
  Dot,
  Header,
  IconAlert,
  IconBack,
  IconUsers,
} from "../components/ui";
import { ClientOnly } from "../components/ui";
import { avatarTint, clock, dayLabel, isToday, timeAgo, type LogEntry } from "../lib/log";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const EVERY = 5000;

type EnrolledUser = {
  id: string;
  name: string;
  enrolled_at?: string;
  irisDate?: string;
  lastSeen?: string;
  initials?: string;
};

export default function LivePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<EnrolledUser[]>([]);
  const [tab, setTab] = useState<"activity" | "people">("activity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRead, setLastRead] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<number | undefined>(undefined);

  const read = useCallback(async () => {
    try {
      const [l, u] = await Promise.all([
        fetch(`${API}/admin/logs/`).then((r) => r.json()),
        fetch(`${API}/admin/enrolled-users/`).then((r) => r.json()),
      ]);
      if (Array.isArray(l.logs)) setLogs(l.logs);
      if (Array.isArray(u.users)) setUsers(u.users);
      setError("");
      setLastRead(Date.now());
      setPulse(true);
      window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => setPulse(false), 500);
    } catch {
      setError("Can't reach the IrisGuard server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    read();
    const id = window.setInterval(read, EVERY);
    return () => { window.clearInterval(id); window.clearTimeout(pulseTimer.current); };
  }, [read]);

  const today = logs.filter((l) => isToday(l.timestamp));
  const granted = today.filter((l) => l.status === "granted").length;
  const denied = today.filter((l) => l.status === "denied").length;

  const TABS = [
    { id: "activity" as const, label: `Activity`, count: logs.length },
    { id: "people" as const, label: `People`, count: users.length },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Header
        subtle="Live"
        right={
          <ButtonLink href="/dashboard" variant="ghost" size="sm" icon={<IconBack size={16} />}>
            Dashboard
          </ButtonLink>
        }
      />

      <main id="main" className="mx-auto w-full max-w-[1180px] px-5 pb-20 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[clamp(1.75rem,4vw,2.25rem)]">Live</h1>
            <p className="mt-2 flex items-center gap-2 text-[0.9375rem] text-muted">
              <Dot tone={error ? "var(--warn)" : "var(--granted)"} pulse={!error && pulse} />
              {error ? "Reconnecting…" : "Updating every few seconds"}
              <ClientOnly>
                {lastRead && !error && (
                  <span className="num text-[0.8125rem] text-faint">· {clock(lastRead)}</span>
                )}
              </ClientOnly>
            </p>
          </div>
        </div>

        {error && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-[var(--r-lg)] px-5 py-4 text-[0.9375rem]"
            style={{ background: "var(--warn-dim)", color: "var(--warn)" }}
          >
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error} Showing the last thing we saw{lastRead ? ` at ${clock(lastRead)}` : ""}.</span>
          </div>
        )}

        <Card className="stagger mt-7 grid divide-y divide-[var(--line)] p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat label="Events on record" value={logs.length} />
          <Stat label="Let in today" value={granted} tone="var(--granted)" />
          <Stat label="Turned away today" value={denied} tone={denied ? "var(--denied)" : "var(--text)"} />
        </Card>

        {/* ── Tabs: a soft segmented control, not a row of buttons ── */}
        <div
          role="tablist"
          aria-label="What to show"
          className="mt-7 inline-flex gap-1 rounded-[var(--r-pill)] border border-[var(--line)] bg-[rgb(255_255_255/0.03)] p-1"
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className="rounded-[var(--r-pill)] px-4 py-2 text-[0.875rem] font-medium transition-all duration-[var(--d-fast)] ease-[var(--out)]"
                style={{
                  background: on ? "var(--raised-hi)" : "transparent",
                  color: on ? "var(--text)" : "var(--muted)",
                  boxShadow: on ? "var(--lift-1)" : undefined,
                }}
              >
                {t.label}
                <span className="num ml-2 text-[0.8125rem] text-faint">{t.count}</span>
              </button>
            );
          })}
        </div>

        <Card className="mt-4 overflow-hidden p-0">
          {tab === "activity" ? (
            <Activity
              entries={logs}
              loading={loading}
              empty="Nothing recorded yet. Scans at the door land here within a few seconds."
            />
          ) : users.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "rgb(255 255 255 / 0.05)", color: "var(--faint)" }}>
                <IconUsers size={20} />
              </span>
              <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">
                Nobody is set up yet. Add someone from the{" "}
                <Link href="/dashboard" className="underline decoration-[var(--line-strong)] hover:text-text">
                  dashboard
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="p-2 sm:p-3">
              {users.map((u) => {
                const tint = avatarTint(u.id || u.name);
                const when = u.enrolled_at ?? u.irisDate ?? u.lastSeen;
                const initials =
                  u.initials ||
                  (u.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 rounded-[var(--r-md)] px-3 py-3 transition-colors duration-[var(--d-fast)] hover:bg-[rgb(255_255_255/0.035)]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[0.9375rem] font-semibold"
                      style={{ background: `color-mix(in srgb, ${tint} 20%, transparent)`, color: tint }}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium">{u.name || "Unnamed"}</p>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-faint">
                        {when ? `Added ${dayLabel(when)} · ${timeAgo(when)}` : "Date not recorded"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

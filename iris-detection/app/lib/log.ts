/**
 * Access-log vocabulary and time handling.
 *
 * Firestore hands timestamps back in three different shapes depending on
 * which router served them, so every surface normalises through here
 * rather than each page re-deriving it.
 */

export type LogMethod = "iris" | "otp" | "admin_alert" | "admin_override";
export type LogStatus = "granted" | "denied" | "triggered";

export type LogEntry = {
  id: string;
  method: LogMethod | string;
  status: LogStatus | string;
  timestamp: unknown;
  location?: string;
  details?: string;
  snapshot_url?: string;
};

export function parseTimestamp(ts: unknown): Date {
  if (ts && typeof ts === "object" && "_seconds" in (ts as Record<string, unknown>)) {
    return new Date(Number((ts as { _seconds: number })._seconds) * 1000);
  }
  if (typeof ts === "string") {
    // ISO strings without a zone are UTC on this backend.
    const iso = /Z$|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts}Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? new Date(ts) : d;
  }
  if (typeof ts === "number") return new Date(ts);
  return new Date(NaN);
}

export function timeAgo(ts: unknown): string {
  const d = parseTimestamp(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const secs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/** Wall clock, HH:MM. Seconds are noise in a log you read by eye. */
export function clock(ts: unknown): string {
  const d = parseTimestamp(ts);
  if (Number.isNaN(d.getTime())) return "--:--";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function dayLabel(ts: unknown): string {
  const d = parseTimestamp(ts);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  const today = new Date();
  const same =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (same) return "Today";
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (
    d.getDate() === y.getDate() &&
    d.getMonth() === y.getMonth() &&
    d.getFullYear() === y.getFullYear()
  ) {
    return "Yesterday";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function isToday(ts: unknown): boolean {
  const d = parseTimestamp(ts);
  if (Number.isNaN(d.getTime())) return false;
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

export const METHOD_LABEL: Record<string, string> = {
  iris: "Biometric",
  otp: "Passcode",
  admin_alert: "Alert",
  admin_override: "Override",
};

type ChipTone = "granted" | "denied" | "warn" | "neutral";

export const STATUS_META: Record<
  string,
  { label: string; tone: string; chip: ChipTone }
> = {
  granted:   { label: "Granted",   tone: "var(--granted)", chip: "granted" },
  denied:    { label: "Denied",    tone: "var(--denied)",  chip: "denied" },
  triggered: { label: "Alert",     tone: "var(--warn)",    chip: "warn" },
};

export function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status || "Unknown",
      tone: "var(--muted)",
      chip: "neutral" as ChipTone,
    }
  );
}

/**
 * Avatar tints, assigned per person.
 *
 * Green, rose and amber are deliberately absent: on these screens they
 * are the verdict vocabulary (granted / denied / alert). An identity
 * colour that borrows one of them makes a person look like a state.
 */
export const AVATAR_TINTS = [
  "#a5b4fc", // periwinkle
  "#93c5fd", // sky
  "#c4b5fd", // violet
  "#7dd3fc", // cyan
  "#d8b4fe", // orchid
  "#a8b3cf", // slate
];

export function avatarTint(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

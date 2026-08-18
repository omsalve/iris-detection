"use client";

import { Chip, Dot } from "./ui";
import {
  METHOD_LABEL,
  clock,
  dayLabel,
  statusMeta,
  timeAgo,
  type LogEntry,
} from "../lib/log";

/**
 * Activity — the access log as a calm timeline.
 *
 * Grouped by day, one row per event, tap targets the full width. No
 * table, no grid lines: the eye should be able to skim the status column
 * alone and get the whole picture.
 */
export function Activity({
  entries,
  loading = false,
  empty = "Nothing yet. Scans at the door show up here.",
}: {
  entries: LogEntry[];
  loading?: boolean;
  empty?: string;
}) {
  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col gap-1 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[var(--r-md)] px-3 py-3.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[rgb(255_255_255/0.1)]" />
            <span className="h-3.5 flex-1 rounded-full bg-[rgb(255_255_255/0.06)]" />
            <span className="h-3.5 w-16 rounded-full bg-[rgb(255_255_255/0.06)]" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgb(255 255 255 / 0.05)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)"
               strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" />
          </svg>
        </span>
        <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">{empty}</p>
      </div>
    );
  }

  const days = entries.map((e) => dayLabel(e.timestamp));

  return (
    <div className="p-2 sm:p-3">
      {entries.map((log, i) => {
        const s = statusMeta(String(log.status));
        const newDay = i === 0 || days[i - 1] !== days[i];

        return (
          <div key={log.id ?? i}>
            {newDay && (
              <p className="px-3 pb-2 pt-4 text-[0.8125rem] font-medium text-faint first:pt-1">
                {days[i]}
              </p>
            )}
            <div className="flex items-center gap-3.5 rounded-[var(--r-md)] px-3 py-3 transition-colors duration-[var(--d-fast)] hover:bg-[rgb(255_255_255/0.035)] sm:gap-4">
              <Dot tone={s.tone} />
              <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
                <span className="truncate text-[0.9375rem] font-medium">
                  {METHOD_LABEL[String(log.method)] ?? String(log.method)}
                </span>
                <span className="truncate text-[0.8125rem] text-faint">
                  {log.location || "Front door"} · {timeAgo(log.timestamp)}
                </span>
              </div>
              <span className="num hidden shrink-0 text-[0.8125rem] text-faint sm:block">
                {clock(log.timestamp)}
              </span>
              <Chip tone={s.chip}>{s.label}</Chip>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Stat — a plain figure with a label. No sparkline, no ring, no bar:
 * the number is the content and anything wrapped around it is noise.
 */
export function Stat({
  label,
  value,
  tone = "var(--text)",
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-5 sm:px-6">
      <span className="text-[0.875rem] text-muted">{label}</span>
      <span
        className="num text-[1.875rem] font-medium leading-none tracking-[-0.02em]"
        style={{ color: tone }}
      >
        {value}
      </span>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import Link from "next/link";

/* ══════════════════════════════════════════════════════════════════
   Buttons — soft, rounded, and they respond to being pressed.
   ══════════════════════════════════════════════════════════════════ */

type Variant = "primary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[#101223] hover:bg-[#b8c4fd] shadow-[0_6px_20px_-6px_var(--glow)]",
  soft:
    "bg-[var(--raised)] text-text border border-[var(--line)] hover:bg-[var(--raised-hi)] hover:border-[var(--line-strong)]",
  ghost:
    "text-muted hover:text-text hover:bg-[rgb(255_255_255/0.05)]",
  danger:
    "bg-[var(--denied-dim)] text-[var(--denied)] border border-[rgb(251_113_133/0.28)] hover:bg-[rgb(251_113_133/0.2)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] rounded-[var(--r-sm)] gap-1.5",
  md: "h-11 px-5 text-[0.9375rem] rounded-[var(--r-md)] gap-2",
  lg: "h-14 px-7 text-[1.0625rem] rounded-[var(--r-lg)] gap-2.5",
};

const BASE =
  "inline-flex select-none items-center justify-center font-medium " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--d-fast)] ease-[var(--out)] " +
  "active:scale-[0.975] disabled:pointer-events-none disabled:opacity-40";

export function Button({
  variant = "soft",
  size = "md",
  icon,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}) {
  return (
    <button {...rest} className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "soft",
  size = "md",
  icon,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}>
      {icon}
      {children}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Surfaces
   ══════════════════════════════════════════════════════════════════ */

export function Card({
  className = "",
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`card ${className}`}>
      {children}
    </div>
  );
}

export function Chip({
  tone = "accent",
  children,
  className = "",
}: {
  tone?: "accent" | "granted" | "denied" | "warn" | "neutral";
  children: React.ReactNode;
  className?: string;
}) {
  const map = {
    accent:  { bg: "var(--accent-dim)",  fg: "var(--accent)" },
    granted: { bg: "var(--granted-dim)", fg: "var(--granted)" },
    denied:  { bg: "var(--denied-dim)",  fg: "var(--denied)" },
    warn:    { bg: "var(--warn-dim)",    fg: "var(--warn)" },
    neutral: { bg: "rgb(255 255 255 / 0.07)", fg: "var(--muted)" },
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--r-pill)] px-2.5 py-1 text-[0.75rem] font-medium ${className}`}
      style={{ background: map.bg, color: map.fg }}
    >
      {children}
    </span>
  );
}

/** A small filled dot. Reads as a live indicator without a border. */
export function Dot({ tone = "var(--muted)", pulse = false }: { tone?: string; pulse?: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {pulse && (
        <span
          className="a-breathe absolute inset-0 rounded-full"
          style={{ background: tone, opacity: 0.5 }}
        />
      )}
      <span className="relative h-2 w-2 rounded-full" style={{ background: tone }} />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Fields
   ══════════════════════════════════════════════════════════════════ */

export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  inputClassName = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = [hint ? `${fid}-h` : null, error ? `${fid}-e` : null]
    .filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={fid} className="text-[0.875rem] font-medium text-muted">
        {label}
      </label>
      <input
        {...rest}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-12 w-full rounded-[var(--r-md)] border bg-[rgb(255_255_255/0.035)] px-4 text-[0.9375rem] text-text
          outline-none transition-[border-color,background-color,box-shadow] duration-[var(--d-fast)]
          placeholder:text-faint focus:border-[var(--accent)] focus:bg-[rgb(255_255_255/0.055)]
          focus:shadow-[0_0_0_4px_var(--accent-dim)] disabled:opacity-45 ${inputClassName}`}
        style={{ borderColor: error ? "var(--denied)" : "var(--line-strong)" }}
      />
      {hint && !error && (
        <p id={`${fid}-h`} className="text-[0.8125rem] leading-snug text-faint">{hint}</p>
      )}
      {error && (
        <p id={`${fid}-e`} className="text-[0.8125rem] leading-snug" style={{ color: "var(--denied)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Sheet — a rounded modal that springs up from below on phones and
   scales in on desktop. Proper dialog semantics throughout.
   ══════════════════════════════════════════════════════════════════ */

export function Sheet({
  title,
  description,
  onClose,
  children,
  width = "30rem",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const tid = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    (focusables()[0] ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="a-fade fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[rgb(6_7_10/0.72)] p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tid}
        tabIndex={-1}
        className="a-pop my-0 w-full border border-[var(--line-strong)] bg-surface shadow-[var(--lift-3)] outline-none sm:my-auto"
        style={{
          maxWidth: width,
          borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div className="min-w-0">
            <h2 id={tid} className="text-[1.125rem] font-semibold tracking-[-0.02em]">{title}</h2>
            {description && (
              <p className="mt-1 text-[0.875rem] leading-snug text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-[rgb(255_255_255/0.07)] hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>

      <style>{`
        @media (min-width: 640px) {
          [role="dialog"] { border-radius: var(--r-xl) !important; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Header
   ══════════════════════════════════════════════════════════════════ */

export function Header({
  right,
  subtle,
}: {
  right?: React.ReactNode;
  subtle?: string;
}) {
  return (
    <header className="floating sticky top-0 z-40">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 rounded-[var(--r-sm)]">
          <Mark />
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="text-[1.0625rem] font-semibold tracking-[-0.025em]">IrisGuard</span>
            {subtle && (
              <span className="hidden truncate text-[0.875rem] text-faint sm:inline">{subtle}</span>
            )}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">{right}</div>
      </div>
    </header>
  );
}

/** The mark: a small, soft iris. Same idea as the big eye, at glyph scale. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <radialGradient id="mk" cx="42%" cy="38%" r="66%">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="55%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>
      </defs>
      <path
        d="M2 16 Q16 3 30 16 Q16 29 2 16 Z"
        fill="rgb(165 180 252 / 0.10)"
        stroke="rgb(165 180 252 / 0.45)"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="6.4" fill="url(#mk)" />
      <circle cx="16" cy="16" r="2.5" fill="#0a0b12" />
      <circle cx="13.9" cy="13.9" r="1.15" fill="rgb(255 255 255 / 0.85)" />
    </svg>
  );
}

/** Mounts children only on the client. */
const noop = () => () => {};
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const on = useSyncExternalStore(noop, () => true, () => false);
  return on ? <>{children}</> : null;
}

/* ══════════════════════════════════════════════════════════════════
   Icons — one grid, one stroke, rounded joins to match the shapes.
   ══════════════════════════════════════════════════════════════════ */

const ico = (d: React.ReactNode) =>
  function Icon({ size = 18, className = "" }: { size?: number; className?: string }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
           aria-hidden="true" className={className}>
        {d}
      </svg>
    );
  };

export const IconCamera = ico(<><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .84.42l.92 1.42a1 1 0 0 0 .84.46h1.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/><circle cx="12" cy="12.2" r="3.4"/></>);
export const IconKey = ico(<><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3.5M15.5 12v2.5"/></>);
export const IconShield = ico(<><path d="M12 3l7 3v5.5c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5V6z"/><path d="M9.2 12.2l2 2 3.6-3.8"/></>);
export const IconUsers = ico(<><circle cx="9" cy="8.5" r="3.2"/><path d="M3.2 19a5.8 5.8 0 0 1 11.6 0"/><path d="M16.4 6.2a3 3 0 0 1 0 5.6M17.6 19a5.9 5.9 0 0 0-2-4.4"/></>);
export const IconClock = ico(<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></>);
export const IconPlus = ico(<path d="M12 5v14M5 12h14"/>);
export const IconArrow = ico(<path d="M5 12h13M12.5 6l6 6-6 6"/>);
export const IconBack = ico(<path d="M19 12H6M11.5 6l-6 6 6 6"/>);
export const IconRefresh = ico(<><path d="M20 5.5v5h-5"/><path d="M20 10.5A8.2 8.2 0 1 0 18.4 16"/></>);
export const IconUpload = ico(<><path d="M12 16.5V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></>);
export const IconTrash = ico(<><path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.5 6.5l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/></>);
export const IconCheck = ico(<path d="M4.5 12.5l5 5 10-11"/>);
export const IconX = ico(<path d="M6 6l12 12M18 6L6 18"/>);
export const IconAlert = ico(<><path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4M12 16.8h.01"/></>);
export const IconLogout = ico(<><path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9"/><path d="M15 15.5l3.5-3.5L15 8.5M18 12H9"/></>);
export const IconNoCam = ico(<><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8"/><path d="M21 16.5V8.5A2.5 2.5 0 0 0 18.5 6h-1.7a1 1 0 0 1-.84-.46l-.92-1.42a1 1 0 0 0-.84-.42H9.8"/><path d="M3 12v4.5A2.5 2.5 0 0 0 5.5 19h13c.4 0 .78-.1 1.11-.27"/><path d="M4 4l16 16"/></>);

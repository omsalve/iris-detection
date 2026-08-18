"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { Activity, Stat } from "../components/Activity";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  Dot,
  Field,
  Header,
  IconAlert,
  IconArrow,
  IconLogout,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
  Sheet,
} from "../components/ui";
import { avatarTint, clock, dayLabel, isToday, timeAgo, type LogEntry } from "../lib/log";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Person = {
  id: string;
  name: string;
  email: string;
  telegramid?: string;
  irisDate: string;
  lastSeen: string;
  location: string;
  initials: string;
  status: "active" | "inactive";
  firestoreId?: string;
};

function Avatar({ person, size = 44 }: { person: Person; size?: number }) {
  const tint = avatarTint(person.id || person.name);
  const off = person.status !== "active";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: off ? "rgb(255 255 255 / 0.05)" : `color-mix(in srgb, ${tint} 20%, transparent)`,
        color: off ? "var(--faint)" : tint,
        letterSpacing: "-0.02em",
      }}
    >
      {person.initials || "?"}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Add someone
   ══════════════════════════════════════════════════════════════════ */

function AddPerson({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: Person) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const take = (f: File) => {
    if (!f.type.startsWith("image/")) return setError("That's not an image — try a JPG or PNG.");
    if (f.size > 10 * 1024 * 1024) return setError("That photo is over 10MB. Try a smaller one.");
    const r = new FileReader();
    r.onload = (e) => { setPhoto(e.target?.result as string); setError(""); };
    r.onerror = () => setError("That file wouldn't open. Try another.");
    r.readAsDataURL(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("What's their name?");
    if (!telegram.trim()) return setError("A Telegram chat ID is needed — it's where their passcodes go.");
    if (!photo) return setError("Add a clear, front-facing photo.");

    setBusy(true);
    setError("");
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const b64 = photo.includes(",") ? photo.split(",")[1] : photo;
      const data = await fetch(`${API}/enroll/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          telegram_id: telegram.trim(),
          image_base64: b64,
        }),
      }).then((r) => r.json());

      if (data.success) {
        onAdded({
          id: data.person_id ?? Date.now().toString(),
          firestoreId: data.person_id,
          name: name.trim(),
          email: email.trim() || "—",
          telegramid: telegram.trim(),
          irisDate: new Date().toISOString().split("T")[0],
          lastSeen: new Date().toISOString(),
          location: "Front door",
          initials: name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
          status: "active",
        });
      } else {
        setError(data.message ?? "We couldn't read a face in that photo. Try a clearer, front-facing one.");
      }
    } catch {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title="Add someone"
      description="They'll be recognised at the door from their next scan."
      onClose={onClose}
      width="32rem"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 px-6 pb-6 pt-4">
        {!photo ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) take(f); }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            className="flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-dashed px-6 py-10 transition-colors duration-[var(--d-fast)]"
            style={{
              borderColor: drag ? "var(--accent)" : "var(--line-strong)",
              background: drag ? "var(--accent-dim)" : "rgb(255 255 255 / 0.02)",
            }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
            >
              <IconUpload size={20} />
            </span>
            <span className="text-[0.9375rem] font-medium">Drop a photo, or choose one</span>
            <span className="text-[0.8125rem] text-faint">
              One clear face, looking at the camera. Under 10MB.
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-4 rounded-[var(--r-lg)] border border-[var(--line)] bg-[rgb(255_255_255/0.025)] p-3">
            {/* Shown exactly as it will be read — no filter, no tint. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="The photo you're adding"
              className="h-20 w-20 shrink-0 rounded-[var(--r-md)] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-medium">Photo ready</p>
              <p className="mt-0.5 text-[0.8125rem] text-faint">We&rsquo;ll look for a face when you save.</p>
            </div>
            <Button type="button" size="sm" onClick={() => { setPhoto(null); setError(""); }}>
              Change
            </Button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) take(f); }}
        />

        <Field label="Name" required value={name} placeholder="Ada Lovelace"
               onChange={(e) => { setName(e.target.value); setError(""); }} disabled={busy} />
        <Field label="Telegram chat ID" required value={telegram} placeholder="123456789"
               hint="Where their one-time passcodes are sent."
               onChange={(e) => { setTelegram(e.target.value); setError(""); }} disabled={busy} />
        <Field label="Email" type="email" inputMode="email" value={email} placeholder="ada@example.com"
               hint="Optional. Lets them use a passcode at the door."
               onChange={(e) => setEmail(e.target.value)} disabled={busy} />

        {error && (
          <p role="alert" className="flex items-start gap-2 text-[0.875rem] leading-snug" style={{ color: "var(--denied)" }}>
            <IconAlert size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="button" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Adding…" : "Add them"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Dashboard
   ══════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [offline, setOffline] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const d = await fetch(`${API}/admin/logs/`).then((r) => r.json());
      setLogs(Array.isArray(d.logs) ? d.logs : []);
      setOffline(false);
    } catch { setOffline(true); } finally { setLoadingLogs(false); }
  }, []);

  const loadPeople = useCallback(async () => {
    setLoadingPeople(true);
    try {
      const d = await fetch(`${API}/admin/enrolled-users/`).then((r) => r.json());
      setPeople(Array.isArray(d.users) ? d.users : []);
      setOffline(false);
    } catch { setOffline(true); } finally { setLoadingPeople(false); }
  }, []);

  useEffect(() => { loadLogs(); loadPeople(); }, [loadLogs, loadPeople]);

  const remove = async () => {
    if (!selected) return;
    setRemoving(true);
    if (selected.firestoreId) {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        await fetch(`${API}/enroll/${selected.firestoreId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch { /* removal from the list proceeds either way */ }
    }
    setPeople((p) => p.filter((x) => x.id !== selected.id));
    setSelected(null);
    setConfirming(false);
    setRemoving(false);
  };

  const today = logs.filter((l) => isToday(l.timestamp));
  const granted = today.filter((l) => l.status === "granted").length;
  const denied = today.filter((l) => l.status === "denied").length;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Header
        subtle="Dashboard"
        right={
          <ButtonLink href="/" variant="ghost" size="sm" icon={<IconLogout size={16} />}>
            Sign out
          </ButtonLink>
        }
      />

      <main id="main" className="mx-auto w-full max-w-[1180px] px-5 pb-20 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[clamp(1.75rem,4vw,2.25rem)]">Who can get in</h1>
            <p className="mt-2 text-[0.9375rem] text-muted">
              {people.length === 0
                ? "Nobody yet."
                : `${people.length} ${people.length === 1 ? "person" : "people"} · ${granted} let in today`}
            </p>
          </div>
          <Button variant="primary" icon={<IconPlus size={17} />} onClick={() => setAdding(true)}>
            Add someone
          </Button>
        </div>

        {offline && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-[var(--r-lg)] px-5 py-4 text-[0.9375rem]"
            style={{ background: "var(--warn-dim)", color: "var(--warn)" }}
          >
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <span>Can&rsquo;t reach the IrisGuard server — showing the last thing we saw.</span>
          </div>
        )}

        {/* ── At a glance ────────────────────────────────────────── */}
        <Card className="stagger mt-7 grid divide-y divide-[var(--line)] p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat label="People" value={people.length} />
          <Stat label="Let in today" value={granted} tone="var(--granted)" />
          <Stat label="Turned away today" value={denied} tone={denied ? "var(--denied)" : "var(--text)"} />
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* ── People ───────────────────────────────────────────── */}
          <section>
            <h2 className="px-1 pb-3 text-[0.9375rem] font-semibold text-muted">People</h2>
            <Card className="overflow-hidden p-2 sm:p-3">
              {loadingPeople && people.length === 0 ? (
                <div className="flex flex-col gap-1 p-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-3 py-3.5">
                      <span className="h-11 w-11 shrink-0 rounded-full bg-[rgb(255_255_255/0.06)]" />
                      <span className="h-3.5 flex-1 rounded-full bg-[rgb(255_255_255/0.06)]" />
                    </div>
                  ))}
                </div>
              ) : people.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                  <p className="max-w-[30ch] text-[0.9375rem] leading-relaxed text-muted">
                    Add the first person and the door will start recognising them.
                  </p>
                  <Button variant="primary" size="sm" icon={<IconPlus size={15} />} onClick={() => setAdding(true)}>
                    Add someone
                  </Button>
                </div>
              ) : (
                people.map((p) => {
                  const on = selected?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(on ? null : p)}
                      aria-expanded={on}
                      className="flex w-full items-center gap-4 rounded-[var(--r-md)] px-3 py-3 text-left transition-colors duration-[var(--d-fast)] hover:bg-[rgb(255_255_255/0.04)]"
                      style={{ background: on ? "rgb(255 255 255 / 0.05)" : undefined }}
                    >
                      <Avatar person={p} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium">{p.name}</span>
                        <span className="mt-0.5 block truncate text-[0.8125rem] text-faint">
                          {p.status === "active" ? `Seen ${timeAgo(p.lastSeen)}` : "Not allowed in"}
                        </span>
                      </span>
                      {p.status === "active" ? (
                        <Dot tone="var(--granted)" />
                      ) : (
                        <Chip tone="neutral">Off</Chip>
                      )}
                      <IconArrow
                        size={16}
                        className="shrink-0 text-faint transition-transform duration-[var(--d-fast)]"
                      />
                    </button>
                  );
                })
              )}
            </Card>

            {/* ── Detail ────────────────────────────────────────── */}
            {selected && (
              <Card className="a-rise mt-4 p-6">
                <div className="flex items-center gap-4">
                  <Avatar person={selected} size={56} />
                  <div className="min-w-0">
                    <h3 className="truncate text-[1.125rem] font-semibold tracking-[-0.02em]">
                      {selected.name}
                    </h3>
                    <p className="mt-1 truncate text-[0.875rem] text-muted">
                      {selected.email && selected.email !== "—" ? selected.email : "No email on file"}
                    </p>
                  </div>
                </div>

                <dl className="mt-6 flex flex-col gap-3">
                  {[
                    { k: "Added", v: selected.irisDate || "—" },
                    { k: "Last seen", v: `${dayLabel(selected.lastSeen)} at ${clock(selected.lastSeen)}` },
                    { k: "Where", v: selected.location || "Front door" },
                  ].map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                      <dt className="text-muted">{r.k}</dt>
                      <dd className="min-w-0 truncate text-right">{r.v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-5 text-[0.8125rem] leading-relaxed text-faint">
                  Removing someone deletes their face data for good. Past activity stays in the log.
                </p>

                <div className="mt-5 flex gap-3">
                  <Button className="flex-1" onClick={() => setSelected(null)}>Close</Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    icon={<IconTrash size={16} />}
                    onClick={() => setConfirming(true)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            )}
          </section>

          {/* ── Activity ─────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <h2 className="text-[0.9375rem] font-semibold text-muted">Activity</h2>
              <Button size="sm" variant="ghost" icon={<IconRefresh size={15} />} onClick={loadLogs}>
                Refresh
              </Button>
            </div>
            <Card className="overflow-hidden p-0">
              <Activity entries={logs} loading={loadingLogs} />
            </Card>
          </section>
        </div>
      </main>

      {adding && (
        <AddPerson
          onClose={() => setAdding(false)}
          onAdded={(p) => { setPeople((prev) => [p, ...prev]); setAdding(false); loadLogs(); }}
        />
      )}

      {confirming && selected && (
        <Sheet
          title={`Remove ${selected.name}?`}
          description="Their face data is deleted and the door stops recognising them straight away. This can't be undone."
          onClose={() => setConfirming(false)}
          width="26rem"
        >
          <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-3">
            <Button onClick={() => setConfirming(false)} disabled={removing}>Keep them</Button>
            <Button variant="danger" onClick={remove} disabled={removing}>
              {removing ? "Removing…" : "Remove"}
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

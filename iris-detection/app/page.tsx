"use client";

import Link from "next/link";
import Eye from "./components/Eye";
import {
  ButtonLink,
  Card,
  Chip,
  Dot,
  Header,
  IconCamera,
  IconShield,
} from "./components/ui";

const STEPS = [
  { n: "Look at the camera", d: "One frame is taken. Nothing is streamed or stored on the device." },
  { n: "It finds your eyes", d: "The frame comes back with the regions it looked at drawn on it." },
  { n: "It says how sure", d: "A real confidence figure, and the same one lands in the log." },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div aria-hidden="true" className="aurora" />

      <Header
        right={
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
        }
      />

      <main
        id="main"
        className="relative mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center px-5 pb-8 pt-8 sm:px-8 lg:pt-4"
      >
        {/* ── Hero: the eye sits beside the words, not above them, so the
               whole page lands inside one screen. ────────────────────── */}
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-14">
          <div className="a-pop flex justify-center lg:justify-start">
            <Eye size={400} mood="idle" />
          </div>

          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="a-fade" style={{ animationDelay: "80ms" }}>
              <Chip tone="accent">
                <Dot tone="var(--accent)" pulse />
                Biometric access
              </Chip>
            </div>

            {/* No forced break — `.display` carries `text-wrap: balance`,
                which splits this into even lines at any column width. A
                manual <br> here stranded "saw." on a line of its own. */}
            <h1
              className="a-rise display mt-5 text-[clamp(1.875rem,4.2vw,2.875rem)]"
              style={{ animationDelay: "160ms" }}
            >
              It looks you in the eye, then tells you what it saw.
            </h1>

            <p
              className="a-rise measure mt-4 text-[1.0625rem] leading-relaxed text-muted"
              style={{ animationDelay: "240ms" }}
            >
              IrisGuard recognises the people you&rsquo;ve let in and shows its
              working — the frame it looked at, the eyes it found, and how sure
              it is.
            </p>

            <div
              className="a-rise mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
              style={{ animationDelay: "320ms" }}
            >
              <ButtonLink href="/access" variant="primary" size="lg" icon={<IconCamera size={19} />}>
                Let me in
              </ButtonLink>
              <ButtonLink href="/login" variant="soft" size="lg" icon={<IconShield size={19} />}>
                I&rsquo;m the admin
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* ── How it works, in one compact row ─────────────────────── */}
        <ol className="stagger mt-10 grid gap-3 sm:grid-cols-3 lg:mt-12">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-medium"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    {i + 1}
                  </span>
                  <h2 className="text-[0.9375rem] font-semibold tracking-[-0.02em]">{s.n}</h2>
                </div>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-muted">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </main>

      <footer className="relative border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[0.875rem] text-faint sm:px-8">
          <span>IrisGuard — an academic capstone project.</span>
          <Link href="/access" className="transition-colors hover:text-muted">
            Door terminal
          </Link>
        </div>
      </footer>
    </div>
  );
}

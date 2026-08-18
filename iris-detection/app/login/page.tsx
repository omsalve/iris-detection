"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import Eye from "../components/Eye";
import { Button, ButtonLink, Card, Field, Header, IconBack } from "../components/ui";

/** Firebase codes aren't messages. Say what's wrong and what to do. */
function readable(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like an email address.";
    case "auth/user-disabled":
      return "This account is disabled. Another admin will need to re-enable it.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match an admin account.";
    case "auth/too-many-requests":
      return "Too many tries. Wait a minute, or reset the password.";
    case "auth/network-request-failed":
      return "No connection. Check your network and try again.";
    default:
      return "That didn't work. Check the details and try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => router.push("/dashboard"), 620);
    return () => window.clearTimeout(t);
  }, [done, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setDone(true);
    } catch (err) {
      setError(readable(err));
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div aria-hidden="true" className="aurora" />

      <Header
        subtle="Admin"
        right={
          <ButtonLink href="/" variant="ghost" size="sm" icon={<IconBack size={16} />}>
            Back
          </ButtonLink>
        }
      />

      <main
        id="main"
        className="relative mx-auto flex w-full max-w-[480px] flex-col items-center px-5 pb-20 pt-10 sm:pt-16"
      >
        <Eye
          size={240}
          mood={done ? "granted" : error ? "denied" : loading ? "scanning" : "idle"}
          tracking={!loading && !done}
        />

        <h1 className="display mt-8 text-center text-[clamp(1.75rem,5vw,2.25rem)]">
          {done ? "Welcome back" : "Sign in"}
        </h1>
        <p className="mt-2.5 text-center text-[0.9375rem] leading-relaxed text-muted">
          {done
            ? "Taking you to your dashboard…"
            : "For admins only. If you're at the door, use the terminal."}
        </p>

        <Card className="mt-8 w-full p-6 sm:p-7">
          <form onSubmit={submit} className="flex flex-col gap-5">
            <Field
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@example.com"
              disabled={loading || done}
              autoFocus
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              disabled={loading || done}
              error={error || undefined}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-1 w-full"
              disabled={loading || done || !email || !password}
            >
              {done ? "Signed in" : loading ? "Checking…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p aria-live="polite" className="sr-only">
          {error || (done ? "Signed in." : "")}
        </p>

        <p className="mt-7 text-center text-[0.875rem] text-faint">
          At the door?{" "}
          <Link href="/access" className="underline decoration-[var(--line-strong)] transition-colors hover:text-muted">
            Open the terminal
          </Link>
        </p>
      </main>
    </div>
  );
}

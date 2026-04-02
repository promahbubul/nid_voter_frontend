"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, sendJson } from "../lib/api";

const inputClassName =
  "h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-500/10";

export function LoginView() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        await fetchJson("/api/v1/auth/me", {
          cache: "no-store",
        });

        if (active) {
          router.replace("/overview");
          router.refresh();
        }
      } catch (_error) {
        // Unauthenticated users should stay on the login screen.
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await sendJson("/api/v1/auth/login", {
        body: { username, password },
      });

      router.replace("/overview");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-md border border-white/10 bg-[#111a20]/95 p-7 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm">
        <div className="mb-7 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400/80">Secure Access</p>
          <h1 className="text-[2rem] font-semibold tracking-tight text-white">Login</h1>
          <p className="text-sm leading-6 text-slate-400">Enter your username and password to access the voter dashboard.</p>
        </div>

        {checkingSession ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-md border border-white/10 bg-white/[0.03] text-center">
            <div className="h-11 w-11 animate-pulse rounded-md bg-emerald-500/80" />
            <strong className="text-base font-semibold text-white">Checking session...</strong>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Username</span>
              <input
                className={inputClassName}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input
                className={inputClassName}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </label>

            {error ? (
              <div className="rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

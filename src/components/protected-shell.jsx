"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchJson, sendJson } from "../lib/api";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="currentColor" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M4 5h16v14H4z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 10h16M9 10v9M15 10v9" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5">
      <path d="M9 4H6.75A1.75 1.75 0 0 0 5 5.75v12.5C5 19.216 5.784 20 6.75 20H9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 8l4 4-4 4M9 12h9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19.2a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: GridIcon },
  { href: "/records", label: "Records", icon: TableIcon },
];

export function ProtectedShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const profileRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const data = await fetchJson("/api/v1/auth/me", {
          cache: "no-store",
        });

        if (active) {
          setUser(data.user);
        }
      } catch (_error) {
        if (active) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setBootLoading(false);
        }
      }
    }

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await sendJson("/api/v1/auth/logout");
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (bootLoading) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="grid min-w-[min(320px,100%)] place-items-center gap-3 rounded-md border border-white/10 bg-[#111a20]/95 p-6 text-center shadow-[0_24px_72px_rgba(0,0,0,0.35)]">
          <div className="h-11 w-11 animate-pulse rounded-md bg-emerald-500" />
          <strong className="text-base font-semibold text-white">Preparing secure dashboard...</strong>
        </div>
      </main>
    );
  }

  return (
    <div className="grid h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col gap-5 border-r border-white/10 bg-[#081015]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-200 lg:static lg:h-dvh lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="grid gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center gap-3 rounded-md border px-3 py-3 text-sm font-semibold transition",
                  active
                    ? "border-emerald-500/20 bg-emerald-500/10 text-white"
                    : "border-transparent bg-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.03] hover:text-slate-100",
                )}
              >
                <span
                  className={cx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                    active ? "border-emerald-400/10 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.03] text-slate-300",
                  )}
                >
                  <Icon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto relative" ref={profileRef}>
          {profileOpen ? (
            <div className="absolute inset-x-0 bottom-[calc(100%+12px)] grid gap-4 rounded-md border border-white/10 bg-[#111a20]/98 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/12 text-emerald-300">
                  <UserIcon />
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-white">{user?.username || "admin"}</strong>
                  <span className="block text-xs text-slate-400">Administrator</span>
                </div>
              </div>

              <div className="grid gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Username</span>
                <strong className="truncate text-sm text-slate-100">{user?.username || "admin"}</strong>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400"
                onClick={handleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition hover:bg-white/[0.05]"
            onClick={() => setProfileOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-slate-300">
              <UserIcon />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold text-white">{user?.username || "admin"}</strong>
              <span className="block text-xs text-slate-500">Profile</span>
            </span>
            <span className="text-slate-500">
              <ChevronIcon />
            </span>
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <section className="relative min-w-0 min-h-0 bg-[#0b1419]/80">
        <button
          type="button"
          className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#111a20]/95 text-slate-100 shadow-[0_14px_30px_rgba(0,0,0,0.3)] lg:hidden"
          onClick={() => setSidebarOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>

        <main className="h-full min-h-0 overflow-auto px-4 pb-5 pt-18 sm:px-5 lg:px-7 lg:pb-7 lg:pt-6">{children}</main>
      </section>
    </div>
  );
}

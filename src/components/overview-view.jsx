"use client";

import { startTransition, useEffect, useState } from "react";
import { fetchJson } from "../lib/api";

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatDateTime(value) {
  if (!value) return "No data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const EMPTY_OVERVIEW = {
  totals: {
    totalVoters: 0,
    declaredVoters: 0,
    activeVoters: 0,
    migratedVoters: 0,
    totalAreas: 0,
    totalSourceFolders: 0,
    totalFiles: 0,
  },
  genderTotals: {},
  topAreas: [],
  normalization: null,
  generatedAt: null,
  importedAt: null,
};

const panelClassName = "rounded-md border border-white/10 bg-[#111a20]/95 shadow-[0_18px_44px_rgba(0,0,0,0.22)]";

export function OverviewView() {
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchJson("/api/v1/dashboard/overview", {
          signal: controller.signal,
          cache: "no-store",
        });

        startTransition(() => {
          setOverview({
            ...EMPTY_OVERVIEW,
            ...data,
          });
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOverview();
    return () => controller.abort();
  }, []);

  const statCards = [
    { label: "Total Voters", value: overview.totals.totalVoters },
    { label: "Declared Voters", value: overview.totals.declaredVoters },
    { label: "Active Records", value: overview.totals.activeVoters },
    { label: "Migrated Records", value: overview.totals.migratedVoters },
    { label: "Source Areas", value: overview.totals.totalAreas },
    { label: "PDF Files", value: overview.totals.totalFiles },
  ];

  const genderRows = [
    { label: "Male", value: overview.genderTotals.male },
    { label: "Female", value: overview.genderTotals.female },
    { label: "Hijra", value: overview.genderTotals.hijra },
  ];

  const metaItems = [
    { label: "Generated", value: formatDateTime(overview.generatedAt) },
    { label: "Imported", value: formatDateTime(overview.importedAt) },
  ];

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      {error ? (
        <div className="rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((item) => (
          <article key={item.label} className={`${panelClassName} p-4`}>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</span>
            <strong className="mt-4 block text-2xl font-semibold tracking-tight text-white">{loading ? "..." : formatNumber(item.value)}</strong>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
        {metaItems.map((item) => (
          <span key={item.label} className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
            <strong className="mr-2 text-slate-200">{item.label}:</strong>
            {item.value}
          </span>
        ))}
      </div>

      <section className="grid min-h-0 gap-4 xl:grid-cols-[1.2fr_0.9fr]">
        <article className={`${panelClassName} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Normalization and Source Summary</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-md border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Source Folders</span>
              <strong className="mt-3 block text-xl font-semibold text-white">
                {loading ? "..." : formatNumber(overview.totals.totalSourceFolders)}
              </strong>
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Changed Documents</span>
              <strong className="mt-3 block text-xl font-semibold text-white">
                {loading ? "..." : formatNumber(overview.normalization?.changed_documents)}
              </strong>
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Changed Fields</span>
              <strong className="mt-3 block text-xl font-semibold text-white">
                {loading ? "..." : formatNumber(overview.normalization?.changed_fields)}
              </strong>
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.03] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Residual Suspicious Fields</span>
              <strong className="mt-3 block text-xl font-semibold text-white">
                {loading ? "..." : formatNumber(overview.normalization?.residual_suspicious_fields)}
              </strong>
            </div>
          </div>
        </article>

        <article className={`${panelClassName} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Declared Voter Breakdown</h2>
          </div>

          <div className="grid gap-3">
            {genderRows.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-sm font-medium text-slate-300">{item.label}</span>
                <strong className="text-base font-semibold text-white">{loading ? "..." : formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={`${panelClassName} flex min-h-0 flex-1 flex-col overflow-hidden p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Top Source Folders by Declared Voters</h2>
        </div>

        <div className="min-h-0 overflow-auto pr-1">
          <div className="grid gap-3">
          {loading ? (
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-4 py-5 text-sm font-medium text-slate-400">
              Loading area data...
            </div>
          ) : overview.topAreas.length ? (
            overview.topAreas.map((item) => (
              <div
                key={item.source_folder}
                className="flex flex-col gap-3 rounded-md border border-white/8 bg-white/[0.03] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <strong className="block truncate text-base font-semibold text-white">{item.source_folder}</strong>
                  <span className="mt-1 block text-sm text-slate-400">{formatNumber(item.files)} files</span>
                </div>
                <div className="text-sm md:text-right">
                  <span className="block font-semibold text-slate-100">{formatNumber(item.voters)} voters</span>
                  <small className="mt-1 block text-slate-400">
                    Male {formatNumber(item.male)} / Female {formatNumber(item.female)} / Hijra {formatNumber(item.hijra)}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-4 py-5 text-sm font-medium text-slate-400">
              No top area data available.
            </div>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}

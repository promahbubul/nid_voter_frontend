"use client";

import { createPortal } from "react-dom";
import { startTransition, useEffect, useMemo, useState } from "react";
import { buildQuery, fetchJson } from "../lib/api";

const initialFilters = {
  name: "",
  dob: "",
  fatherName: "",
  motherName: "",
  area: "",
  voterNo: "",
};

const inputClassName =
  "h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-500/10";

const panelClassName = "rounded-md border border-white/10 bg-[#111a20]/95 shadow-[0_18px_44px_rgba(0,0,0,0.22)]";
const fullWidthDetailLabels = new Set(["Address", "Area Name", "Source File", "Migration Status"]);

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function translateGender(value) {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  if (value === "hijra") return "Hijra";
  return value || "-";
}

function translateRecordStatus(value) {
  if (value === "active") return "Active";
  if (value === "migrated") return "Migrated";
  return value || "-";
}

function translateListType(value) {
  if (value === "supplementary") return "Supplementary";
  if (value === "draft") return "Draft";
  if (value === "final") return "Final";
  return value || "-";
}

function getVisiblePages(currentPage, totalPages) {
  const start = Math.max(currentPage - 1, 1);
  const end = Math.min(start + 2, totalPages);
  const pages = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function LoadingRows() {
  return Array.from({ length: 10 }).map((_, index) => (
    <tr key={`loading-row-${index}`}>
      <td colSpan={11} className="px-4 py-4">
        <span className="block h-11 animate-pulse rounded-md bg-white/[0.05]" />
      </td>
    </tr>
  ));
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M1.5 12s3.9-6.75 10.5-6.75S22.5 12 22.5 12s-3.9 6.75-10.5 6.75S1.5 12 1.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function buildDetailRows(voter) {
  return [
    ["Name", voter.name_raw],
    ["Voter No", voter.voter_no],
    ["Father Name", voter.father_name_raw],
    ["Mother Name", voter.mother_name_raw],
    ["Birth Date", voter.birth_date],
    ["Birth Date (Raw)", voter.birth_date_raw],
    ["Birth Year", voter.birth_year],
    ["Gender", translateGender(voter.gender)],
    ["Occupation", voter.occupation_raw],
    ["Address", voter.address_raw],
    ["Area", voter.source_folder],
    ["Area Code", voter.voter_area_code],
    ["Area Name", voter.voter_area_name_raw],
    ["Union or Board", voter.union_or_board_raw],
    ["Ward", voter.ward_no],
    ["District", voter.district_raw],
    ["Upazila", voter.upazila_raw],
    ["Serial", voter.serial],
    ["Record Status", translateRecordStatus(voter.record_status)],
    ["Special Tag", voter.special_tag],
    ["List Type", translateListType(voter.list_type)],
    ["Part No", voter.part_no],
    ["Migration Status", voter.migration_status_raw],
    ["Publish Date", voter.publish_date],
    ["Source File", voter.source_path],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");
}

export function VoterDashboard() {
  const [hasMounted, setHasMounted] = useState(false);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("50");
  const [pageInput, setPageInput] = useState("1");
  const [results, setResults] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 50,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = results.totalPages || 1;
  const pageNumbers = getVisiblePages(page, totalPages);
  const rowFrom = results.total ? (page - 1) * Number(pageSize) + 1 : 0;
  const rowTo = results.total ? Math.min(page * Number(pageSize), results.total) : 0;
  const hasPendingChanges = useMemo(
    () => JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters),
    [appliedFilters, draftFilters],
  );
  const detailRows = useMemo(
    () => (selectedVoter ? buildDetailRows(selectedVoter) : []),
    [selectedVoter],
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResults() {
      setLoading(true);
      setError("");

      try {
        const query = buildQuery({
          ...appliedFilters,
          page,
          limit: pageSize,
          sortBy: "serial",
          sortOrder: "asc",
        });

        const data = await fetchJson(`/api/v1/voters?${query}`, {
          signal: controller.signal,
        });

        startTransition(() => {
          setResults(data);
          setSelectedVoter(null);
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

    loadResults();
    return () => controller.abort();
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    if (!selectedVoter) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedVoter(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedVoter]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleApply(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }

  function handlePageSizeChange(event) {
    setPage(1);
    setPageSize(event.target.value);
  }

  function handlePageJump(event) {
    event.preventDefault();

    if (!pageInput) {
      setPageInput(String(page));
      return;
    }

    const requestedPage = Number.parseInt(pageInput, 10);

    if (Number.isNaN(requestedPage)) {
      setPageInput(String(page));
      return;
    }

    const nextPage = Math.min(Math.max(requestedPage, 1), totalPages);
    setPage(nextPage);
    setPageInput(String(nextPage));
  }

  function handleReset() {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedVoter(null);
    setPageSize("50");
    setPage(1);
  }

  const modal =
    hasMounted && selectedVoter
      ? createPortal(
          <div className="fixed inset-0 z-[2147483000] grid place-items-center bg-black/72 p-4 backdrop-blur-sm sm:p-6" onClick={() => setSelectedVoter(null)} role="presentation">
            <section
              className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-md border border-white/10 bg-[#101920] shadow-[0_36px_120px_rgba(0,0,0,0.55)]"
              style={{ maxHeight: "min(88vh, 900px)" }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="voter-detail-title"
            >
              <header className="flex flex-col gap-4 border-b border-white/10 bg-[#131d24] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400/75">Details</p>
                    <h2 id="voter-detail-title" className="break-words text-2xl font-semibold leading-tight text-white">
                      {selectedVoter.name_raw || "Voter details"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Voter No: <span className="font-semibold text-slate-200">{selectedVoter.voter_no || "Not available"}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
                    onClick={() => setSelectedVoter(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md border border-emerald-400/12 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    {translateGender(selectedVoter.gender)}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {translateRecordStatus(selectedVoter.record_status)}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {selectedVoter.source_folder || "Area unavailable"}
                  </span>
                </div>
              </header>

              <div className="overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {detailRows.map(([label, value]) => (
                    <article
                      key={label}
                      className={cx(
                        "rounded-md border border-white/10 bg-white/[0.03] p-4",
                        fullWidthDetailLabels.has(label) ? "md:col-span-2" : "",
                      )}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className="mt-3 break-words text-[15px] font-semibold leading-7 text-white">{String(value)}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <main className="flex h-full min-h-0 flex-col gap-4">
        <form className={`${panelClassName} p-4 md:p-5`} onSubmit={handleApply}>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasPendingChanges}
            >
              Apply
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">নাম</span>
              <input className={inputClassName} name="name" value={draftFilters.name} onChange={handleFilterChange} placeholder="নাম" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">জন্ম তারিখ</span>
              <input className={inputClassName} type="date" name="dob" value={draftFilters.dob} onChange={handleFilterChange} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">পিতার নাম</span>
              <input
                className={inputClassName}
                name="fatherName"
                value={draftFilters.fatherName}
                onChange={handleFilterChange}
                placeholder="পিতার নাম"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">মাতার নাম</span>
              <input
                className={inputClassName}
                name="motherName"
                value={draftFilters.motherName}
                onChange={handleFilterChange}
                placeholder="মাতার নাম"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">এলাকা</span>
              <input className={inputClassName} name="area" value={draftFilters.area} onChange={handleFilterChange} placeholder="এলাকা" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">ভোটার নম্বর</span>
              <input
                className={inputClassName}
                name="voterNo"
                value={draftFilters.voterNo}
                onChange={handleFilterChange}
                placeholder="ভোটার নম্বর"
              />
            </label>
          </div>
        </form>

        <section className={`${panelClassName} flex min-h-0 flex-1 flex-col overflow-hidden`}>
          {error ? (
            <div className="m-4 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              {error}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[1320px] border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#17222a]">
                  {["Name", "Voter No", "Father Name", "Mother Name", "Birth Date", "Gender", "Area", "Ward", "Address", "Occupation", "View"].map(
                    (heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : results.items.length ? (
                  results.items.map((item) => (
                    <tr key={item._id} className="border-b border-white/[0.05] transition hover:bg-emerald-500/[0.06]">
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-200">{item.name_raw || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.voter_no || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.father_name_raw || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.mother_name_raw || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.birth_date || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                          {translateGender(item.gender)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="grid gap-1">
                          <strong className="text-sm font-semibold text-slate-100">{item.source_folder || "-"}</strong>
                          <span className="text-xs text-slate-500">{item.voter_area_code || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.ward_no ?? "-"}</td>
                      <td className="px-4 py-4 align-top text-sm leading-6 text-slate-300">{item.address_raw || "-"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-300">{item.occupation_raw || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-emerald-400/15 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/18"
                          onClick={() => setSelectedVoter(item)}
                          aria-label={`View details for ${item.voter_no || item.name_raw || "voter"}`}
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="shrink-0 flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-400">
              <strong className="mr-2 font-semibold text-slate-100">
                {rowFrom}-{rowTo}
              </strong>
              of {formatNumber(results.total)} total records
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <span>Per page</span>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-emerald-400/70"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                >
                  <option value="25" className="bg-slate-100 text-slate-900">
                    25
                  </option>
                  <option value="50" className="bg-slate-100 text-slate-900">
                    50
                  </option>
                  <option value="100" className="bg-slate-100 text-slate-900">
                    100
                  </option>
                </select>
              </label>

              <form className="flex items-center gap-2" onSubmit={handlePageJump}>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Page</span>
                  <input
                    className="h-10 w-20 rounded-md border border-white/10 bg-white/[0.04] px-3 text-center text-sm text-white outline-none focus:border-emerald-400/70"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
                    aria-label="Jump to page"
                  />
                </label>
                <span className="text-sm text-slate-500">/ {formatNumber(totalPages)}</span>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || !pageInput}
                >
                  Go
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1 || loading}
                >
                  Prev
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={cx(
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                      pageNumber === page
                        ? "border-emerald-400/20 bg-emerald-500 text-slate-950"
                        : "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]",
                    )}
                    onClick={() => setPage(pageNumber)}
                    disabled={loading}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </button>
              </div>
            </div>
          </footer>
        </section>
      </main>

      {modal}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { PageLoader } from "@/src/components/ui/page-loader";
import { useAudit } from "@/src/components/dashboard/audit-provider";
import { CalendarIcon, ChevronDownIcon, DownloadIcon, SearchIcon, ZapIcon } from "@/src/components/icons";
import { Pagination } from "@/src/components/visitors/pagination";
import { Button } from "@/src/components/ui/button";
import { ALL, actionCounts, type AuditFilters, emptyAuditFilters, filterEvents, messageText } from "@/src/lib/audit";
import { downloadCsv } from "@/src/lib/download-csv";
import { getPresets, type PresetKey } from "@/src/lib/visitor-filters";
import { AuditEventRow } from "./audit-event-row";

const PAGE_SIZE = 40;

const control =
  "w-full rounded-lg border border-line-strong bg-surface py-2 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

export function AuditTrailPage() {
  const { events, loading, error, reload } = useAudit();
  const [filters, setFilters] = useState<AuditFilters>(emptyAuditFilters);
  const [preset, setPreset] = useState<PresetKey | null>(null);
  const [page, setPage] = useState(1);
  const [openIds, setOpenIds] = useState<string[]>([]);

  // GET /api/audit every time the page opens
  useEffect(() => {
    void reload();
  }, [reload]);

  const actions = useMemo(() => [...new Set(events.map((event) => event.action))].sort(), [events]);
  const staff = useMemo(() => [...new Set(events.map((event) => event.actor.name))].sort((a, b) => a.localeCompare(b)), [events]);

  // the summary badges ignore the action filter, so they still show what you could switch to
  const counts = useMemo(() => actionCounts(filterEvents(events, { ...filters, action: ALL })).slice(0, 4), [events, filters]);
  const filtered = useMemo(() => filterEvents(events, filters), [events, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function update(patch: Partial<AuditFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function exportCsv() {
    downloadCsv(
      "audit-trail.csv",
      ["Date", "Time", "Action", "Category", "Performed By", "Role", "Description", "Location"],
      filtered.map((event) => [event.date, event.time, event.action, event.category, event.actor.name, event.actor.role ?? "", messageText(event), event.location ?? ""]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Audit Trail</h1>
          <p className="text-xs text-soft">{events.length} recorded events</p>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          <DownloadIcon size={14} /> Export CSV
        </Button>
      </div>

      {/* Quick date ranges and the busiest actions */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-medium">
          {getPresets().map(({ key, label, range }) => {
            const active = preset === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPreset(active ? null : key);
                  update(active ? { from: "", to: "" } : { from: range[0], to: range[1] });
                }}
                className={`flex items-center gap-1.5 transition-colors ${active ? "text-brand" : "text-soft hover:text-fg"}`}
              >
                <CalendarIcon size={14} className={active ? "text-brand" : "text-muted"} />
                {label}
              </button>
            );
          })}
        </div>

        {counts.length > 0 && <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />}

        <div className="flex flex-wrap items-center gap-2">
          {counts.map(({ action, count }) => {
            const active = filters.action === action;
            return (
              <button
                key={action}
                type="button"
                aria-pressed={active}
                onClick={() => update({ action: active ? ALL : action })}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition ${
                  active ? "border-brand bg-brand-soft text-brand" : "border-line-strong bg-surface text-soft hover:border-brand/40"
                }`}
              >
                <ZapIcon size={13} className={active ? "text-brand" : "text-muted"} />
                <span className="font-bold text-fg">{count}</span>
                <span className="font-medium">{action}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <section aria-label="Filters" className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search activity, performer..."
            aria-label="Search the audit trail"
            className={`${control} pl-9 pr-3`}
          />
        </div>

        <Select label="Filter by action" value={filters.action} onChange={(value) => update({ action: value })} allLabel="All Actions" options={actions} />
        <Select label="Filter by staff" value={filters.staff} onChange={(value) => update({ staff: value })} allLabel="All Staff" options={staff} />

        <input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => {
            setPreset(null);
            update({ from: event.target.value });
          }}
          aria-label="From date"
          className={`${control} w-auto px-3`}
        />
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => {
            setPreset(null);
            update({ to: event.target.value });
          }}
          aria-label="To date"
          className={`${control} w-auto px-3`}
        />
      </section>

      {/* Event feed */}
      <ul className="space-y-2" aria-label="Audit events">
        {pageRows.map((event) => (
          <AuditEventRow
            key={event.id}
            event={event}
            open={openIds.includes(event.id)}
            onToggle={() => setOpenIds((current) => (current.includes(event.id) ? current.filter((id) => id !== event.id) : [...current, event.id]))}
          />
        ))}

        {loading && events.length === 0 && (
          <li><PageLoader label="Loading audit trail…" /></li>
        )}

        {error && (
          <li role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-6 text-center text-xs text-red-600 dark:text-red-300">
            <p className="mb-2">{error}</p>
            <button type="button" onClick={() => void reload()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </li>
        )}

        {!loading && !error && filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-line-strong px-5 py-12 text-center text-xs text-muted">No events match these filters.</li>
        )}
      </ul>

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
          <Pagination page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, allLabel, options }: { label: string; value: string; onChange: (value: string) => void; allLabel: string; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={`${control} min-w-[140px] cursor-pointer appearance-none pl-3 pr-8 font-medium`}
      >
        <option value={ALL}>{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

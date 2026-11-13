"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  ChevronDownIcon,
  DocumentIcon,
  DownloadIcon,
  FilterIcon,
  type IconProps,
  ReportIcon,
  ShieldIcon,
  UsersIcon,
  WarningIcon,
} from "@/src/components/icons";
import { useAudit } from "@/src/components/dashboard/audit-provider";
import { Button } from "@/src/components/ui/button";
import {
  api,
  type ApiCategoryReport,
  type ApiLedgerReport,
  type ApiLobbyReport,
  type ApiOccupancyReport,
  type ApiOverstayReport,
  type ApiTenant,
  type ApiTenantList,
  type ApiWatchlistReport,
  errorMessage,
} from "@/src/lib/api";
import { auditMessages } from "@/src/lib/audit";
import { downloadCsv } from "@/src/lib/download-csv";
import { ALL_COMPANIES, categoryRows, ledgerRows, lobbyRows, occupancyRows, overstayRows, UNASSIGNED } from "@/src/lib/report-calculations";
import { shiftDays, todayIso } from "@/src/lib/visitor-filters";
import { CategoryTable, LedgerTable, LobbyTable, OccupancyTable, OverstayTable } from "./report-tables";
import { WatchlistReport, watchlistCsv } from "./watchlist-report";

type ReportId = "overstay" | "occupancy" | "lobby" | "category" | "watchlist" | "ledger";

type Tone = "red" | "green" | "teal" | "blue" | "amber" | "slate";

const tones: Record<Tone, string> = {
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  green: "bg-brand-soft text-brand",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  slate: "bg-slate-500/10 text-soft",
};

type ReportDef = {
  id: ReportId;
  title: string;
  description: string;
  tableDescription: string;
  icon: ComponentType<IconProps>;
  tone: Tone;
};

const reports: ReportDef[] = [
  {
    id: "overstay",
    title: "Daily Overstay & Security Exception Report",
    description: "Visitors who checked in on the selected date but failed to check out by operating hours.",
    tableDescription: "Daily exception log of visitors currently onsite past normal operating hours.",
    icon: WarningIcon,
    tone: "red",
  },
  {
    id: "occupancy",
    title: "Resident Company Occupancy & Footprint Report",
    description: "Total visitors, host sessions, and average stay duration broken down by Resident Company.",
    tableDescription: "Visitor foot-traffic breakdown by Resident Company for property management & service charge tracking.",
    icon: BuildingIcon,
    tone: "green",
  },
  {
    id: "lobby",
    title: "Lobby Traffic & Peak Arrival Report",
    description: "Hourly arrival distribution and daily visitor volume heatmaps to optimize security & reception shifts.",
    tableDescription: "Hourly visitor arrival distribution & peak traffic metrics for shift optimization.",
    icon: ReportIcon,
    tone: "teal",
  },
  {
    id: "category",
    title: "Visitor Category & Vendor Intelligence Report",
    description: "Categorized breakdown of VIPs, Clients, Candidates, Contractors, and Delivery drop-offs.",
    tableDescription: "Categorized footprint breakdown of VIPs, Clients, Candidates, Contractors, and Delivery drop-offs.",
    icon: UsersIcon,
    tone: "blue",
  },
  {
    id: "watchlist",
    title: "Security Watchlist & Incident Audit Report",
    description: "Summary of flagged watchlist entries, digital NDA signatures, and emergency roll-call history.",
    tableDescription: "Flagged watchlist entries, digital NDA signatures, and emergency roll-call history.",
    icon: ShieldIcon,
    tone: "amber",
  },
  {
    id: "ledger",
    title: "Master Visitor Audit Ledger",
    description: "Complete raw timestamped visitor log with date range filtering for compliance auditing.",
    tableDescription: "Complete raw timestamped visitor log for compliance auditing.",
    icon: DocumentIcon,
    tone: "slate",
  },
];

type PresetKey = "today" | "7d" | "30d" | "90d";

/** Worked out from today's date every time they are needed, so "Today" is always really today */
function getPresets(): { key: PresetKey; label: string; range: [string, string] }[] {
  const today = todayIso();
  return [
    { key: "today", label: "Today", range: [today, today] },
    { key: "7d", label: "Last 7 Days", range: [shiftDays(today, -6), today] },
    { key: "30d", label: "Last 30 Days", range: [shiftDays(today, -29), today] },
    { key: "90d", label: "Last 90 Days", range: [shiftDays(today, -89), today] },
  ];
}

const control =
  "rounded-lg border border-line-strong bg-surface py-1.5 text-xs text-fg shadow-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20";

/** How each report is named in the audit trail */
const auditNames: Record<ReportId, string> = {
  overstay: "overstay",
  occupancy: "resident-company",
  lobby: "peak-traffic",
  category: "visitor-categories",
  watchlist: "watchlist-security",
  ledger: "master-ledger",
};

type Csv = { headers: string[]; rows: string[][] };

/** What GET /api/reports/:type sends back for each report */
type ReportData = {
  overstay: ApiOverstayReport;
  occupancy: ApiOccupancyReport;
  lobby: ApiLobbyReport;
  category: ApiCategoryReport;
  watchlist: ApiWatchlistReport;
  ledger: ApiLedgerReport;
};
/** One loaded report, tagged with which one it is so the page never shows a table with another report's data */
type Loaded = { [K in ReportId]: { id: K; data: ReportData[K] } }[ReportId];

/** The server never sends more ledger rows than this; a longer range has to be split up to export */
const MAX_EXPORT = 20000;

/** The watchlist report is mostly not about one resident company, so the company filter is left out of it */
const reportPath = (id: ReportId, from: string, to: string, company: string) =>
  `/reports/${id}?from=${from}&to=${to}${id === "watchlist" ? "" : `&company=${encodeURIComponent(company)}`}`;

/** The rows of the CSV download: the same text the tables show */
function csvOf(loaded: Loaded): Csv {
  switch (loaded.id) {
    case "overstay":
      return {
        headers: ["Visitor Name", "Company", "Host Name", "Check In Time", "Status", "Duration", "Resident Company", "Suite"],
        rows: overstayRows(loaded.data).map((r) => [r.visitor, r.company, r.host, r.checkIn, r.status === "pending_clearance" ? "Pending clearance" : "Overstay warning", r.duration, r.residentCompany, r.suite]),
      };
    case "occupancy":
      return {
        headers: ["Resident Company", "Floor Suite", "Total Visitors", "Avg Duration", "Percentage Traffic"],
        rows: occupancyRows(loaded.data).map((r) => [r.company, r.suite, String(r.visitors), r.avgDuration, r.share]),
      };
    case "lobby":
      return {
        headers: ["Time Slot", "Total Check Ins", "Percentage Traffic", "Volume Level"],
        rows: lobbyRows(loaded.data).map((r) => [r.slot, String(r.checkIns), r.share, r.level]),
      };
    case "category":
      return {
        headers: ["Visitor Category", "Total Visits", "Avg Stay Duration", "Percentage Share"],
        rows: categoryRows(loaded.data).map((r) => [r.category, String(r.visits), r.avgStay, r.share]),
      };
    case "watchlist":
      return watchlistCsv(loaded.data);
    case "ledger":
      return {
        headers: ["Visitor", "Type", "Company", "Host", "Resident Company", "Check In", "Check Out", "Status", "Duration"],
        rows: ledgerRows(loaded.data).map((r) => [r.visitor, r.type, r.company, r.host, r.residentCompany, r.checkIn, r.checkOut, r.status, r.duration]),
      };
  }
}

export function ReportsPage() {
  // Every report is worked out by the server (GET /api/reports/:type) for the dates and company picked here.
  const { record } = useAudit();
  const [activeId, setActiveId] = useState<ReportId>("overstay");
  const [preset, setPreset] = useState<PresetKey | null>("30d");
  const [from, setFrom] = useState(() => getPresets()[2].range[0]);
  const [to, setTo] = useState(() => getPresets()[2].range[1]);
  const [company, setCompany] = useState(ALL_COMPANIES);
  const [tenants, setTenants] = useState<ApiTenant[]>([]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  function viewReport(id: ReportId) {
    record({ action: "REPORTS_VIEW", category: "Report", message: auditMessages.reportView(auditNames[id]), meta: { type: auditNames[id] } });
  }

  // opening the page shows the first report, so that counts as a view too
  const loggedFirstView = useRef(false);
  useEffect(() => {
    if (loggedFirstView.current) return;
    loggedFirstView.current = true;
    record({ action: "REPORTS_VIEW", category: "Report", message: auditMessages.reportView(auditNames.overstay), meta: { type: auditNames.overstay } });
  }, [record]);

  // the resident companies to offer in the filter (GET /api/tenants)
  useEffect(() => {
    api<ApiTenantList>("/tenants")
      .then((data) => setTenants(data.items))
      .catch(() => setTenants([]));
  }, []);

  const path = reportPath(activeId, from, to, company);

  // GET /api/reports/:type whenever the report, the dates or the company change
  useEffect(() => {
    if (!from || !to || from > to) {
      setError(!from || !to ? "Choose a start and an end date." : "The start date can't be after the end date.");
      setLoading(false);
      return;
    }
    let current = true; // ignore an answer that arrives after the person picked something else
    setLoading(true);
    api<ReportData[ReportId]>(path)
      .then((data) => {
        if (!current) return;
        setLoaded({ id: activeId, data } as Loaded);
        setError("");
      })
      .catch((err) => current && setError(errorMessage(err, "Couldn't load the report.")))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [activeId, path, from, to, reloadKey]);

  /** Downloads what the table shows. A ledger that was cut short is fetched in full first, so the file is never silently partial. */
  async function exportCsv() {
    if (!view) return;
    setExporting(true);
    setExportError("");
    try {
      let source: Loaded = view;
      if (view.id === "ledger" && view.data.total > view.data.items.length) {
        if (view.data.total > MAX_EXPORT) {
          throw new Error(`This range has ${view.data.total.toLocaleString()} visits. Choose a shorter range (up to ${MAX_EXPORT.toLocaleString()}) to export them all.`);
        }
        source = { id: "ledger", data: await api<ApiLedgerReport>(`${path}&limit=${MAX_EXPORT}`) };
      }
      const csv = csvOf(source);
      downloadCsv(`${view.id}-report.csv`, csv.headers, csv.rows);
    } catch (err) {
      setExportError(errorMessage(err, "Couldn't export the report."));
    } finally {
      setExporting(false);
    }
  }

  const active = reports.find((report) => report.id === activeId) ?? reports[0];
  const ActiveIcon = active.icon;
  // only show a report's data under its own tab (right after switching tabs there is nothing to show yet)
  const view = loaded?.id === active.id ? loaded : null;
  const csv = useMemo(() => (view ? csvOf(view) : null), [view]);

  // The lobby report always lists every hour slot, so count the arrivals; the ledger can be cut short, so it says how many exist
  const count = !view ? 0 : view.id === "lobby" ? view.data.total : view.id === "ledger" ? view.data.total : (csv?.rows.length ?? 0);
  const shownOfTotal = view?.id === "ledger" && view.data.items.length < view.data.total ? `${view.data.items.length.toLocaleString()} of ${view.data.total.toLocaleString()}` : count.toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-[7px] text-[21px] font-bold leading-tight tracking-[-0.035em] sm:text-[25px]">Detailed Reports</h1>
          <p className="text-xs text-soft">Executive reporting, resident company analytics, and daily security exception audits</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <Button disabled={!view || exporting} onClick={() => void exportCsv()}>
            <DownloadIcon size={15} />
            {exporting ? "Preparing..." : "Export Report (CSV)"}
          </Button>
          {exportError && (
            <p role="alert" className="max-w-xs text-xs text-red-600 dark:text-red-400 sm:text-right">
              {exportError}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <section aria-label="Report filters" className="space-y-3 rounded-xl border border-line bg-surface p-4 [box-shadow:var(--shadow)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5 font-semibold">
            <FilterIcon size={15} className="text-muted" />
            Report Date Range:
          </span>

          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface-soft p-1 font-medium">
            {getPresets().map(({ key, label, range }) => {
              const selected = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPreset(key);
                    setFrom(range[0]);
                    setTo(range[1]);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${
                    selected ? "bg-brand text-white shadow-sm dark:text-[#04130a]" : "text-soft hover:text-fg"
                  }`}
                >
                  <CalendarIcon size={13} className={selected ? "" : "text-muted"} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-soft">
            <span>Or Custom:</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                setPreset(null);
              }}
              aria-label="From date"
              className={`${control} px-3`}
            />
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPreset(null);
              }}
              aria-label="To date"
              className={`${control} px-3`}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <div className="relative w-full sm:w-64">
            <BuildingIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              disabled={activeId === "watchlist"}
              title={activeId === "watchlist" ? "This report is not filtered by resident company" : undefined}
              aria-label="Filter by resident company"
              className={`${control} w-full cursor-pointer appearance-none pl-9 pr-8 font-medium disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value={ALL_COMPANIES}>All Resident Companies</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
              <option value={UNASSIGNED}>No resident company</option>
            </select>
            <ChevronDownIcon size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </section>

      {/* Report type cards */}
      <section aria-label="Report types" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          const selected = report.id === activeId;
          return (
            <button
              key={report.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (report.id !== activeId) viewReport(report.id);
                setActiveId(report.id);
              }}
              className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition [box-shadow:var(--shadow)] ${
                selected
                  ? "border-brand bg-surface ring-[3px] ring-brand/15"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-soft"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[report.tone]}`}>
                <Icon size={20} />
              </span>
              <span>
                <span className={`block text-[13px] font-semibold leading-snug ${selected ? "text-brand" : ""}`}>{report.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-soft">{report.description}</span>
              </span>
            </button>
          );
        })}
      </section>

      {/* Selected report */}
      <section aria-label={active.title} className="overflow-hidden rounded-xl border border-line bg-surface [box-shadow:var(--shadow)]">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[active.tone]}`}>
              <ActiveIcon size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold">{active.title}</h2>
              <p className="mt-0.5 text-xs text-soft">{active.tableDescription}</p>
            </div>
          </div>
          {view && (
            <span className="self-start whitespace-nowrap rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-medium text-brand sm:self-auto">
              {shownOfTotal} {active.id === "lobby" ? (count === 1 ? "Check-In" : "Check-Ins") : count === 1 ? "Entry" : "Entries"} Found
            </span>
          )}
        </div>

        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-red-50 px-5 py-3 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        )}

        {!view && !error && <p className="px-5 py-14 text-center text-xs text-muted">Loading report...</p>}

        {view && (
          <div aria-busy={loading} className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {view.id === "overstay" && <OverstayTable rows={overstayRows(view.data)} />}
            {view.id === "occupancy" && <OccupancyTable rows={occupancyRows(view.data)} />}
            {view.id === "lobby" && <LobbyTable rows={lobbyRows(view.data)} />}
            {view.id === "category" && <CategoryTable rows={categoryRows(view.data)} />}
            {view.id === "ledger" && <LedgerTable rows={ledgerRows(view.data)} />}
            {view.id === "watchlist" && <WatchlistReport report={view.data} />}
          </div>
        )}
      </section>
    </div>
  );
}

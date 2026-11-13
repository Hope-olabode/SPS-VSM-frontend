import type { ReactNode } from "react";
import { SeverityBadge } from "@/src/components/watchlist/severity-badge";
import type { ApiWatchlistReport } from "@/src/lib/api";
import { fullStamp } from "@/src/lib/report-calculations";
import type { Severity } from "@/src/lib/mock-watchlist";

const th = "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted";
const td = "px-4 py-3";
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

/** One titled list inside the Security Watchlist & Incident Audit report */
function Section({ title, note, count, truncated, columns, empty, children }: { title: string; note: string; count: number; truncated: boolean; columns: string[]; empty: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex flex-col gap-1 border-b border-line bg-surface-soft px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-bold">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{note}</p>
        </div>
        <span className="self-start whitespace-nowrap text-[11px] font-medium text-soft sm:self-auto">
          {truncated ? `First ${count.toLocaleString()} shown` : `${count} ${count === 1 ? "entry" : "entries"}`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => (
                <th key={column} scope="col" className={th}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {children}
            {count === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-muted">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const rowClass = "transition-colors hover:bg-surface-soft";

export function WatchlistReport({ report }: { report: ApiWatchlistReport }) {
  const { entries, blocked, signatures, emergencies } = report;
  return (
    <div className="divide-y divide-line">
      <Section
        title="Watchlist entries"
        note="Everyone on the watchlist right now, most severe first. The watchlist is shared by every location."
        count={entries.items.length}
        truncated={entries.truncated}
        columns={["Name", "Company", "Severity", "Reason", "Added"]}
        empty="No one is on the watchlist."
      >
        {entries.items.map((entry) => (
          <tr key={entry.id} className={rowClass}>
            <td className={`${td} whitespace-nowrap font-semibold`}>{entry.name}</td>
            <td className={`${td} text-soft`}>{entry.company || "-"}</td>
            <td className={td}>
              <SeverityBadge severity={entry.severity} />
            </td>
            <td className={`${td} max-w-[320px] text-soft`}>{entry.reason}</td>
            <td className={`${td} whitespace-nowrap text-soft`}>{fullStamp(entry.createdAt)}</td>
          </tr>
        ))}
      </Section>

      <Section
        title="Blocked check-ins"
        note="Check-ins stopped by a watchlist match at this location, in the selected dates."
        count={blocked.items.length}
        truncated={blocked.truncated}
        columns={["Time", "Visitor", "Severity"]}
        empty="No check-ins were blocked in this date range."
      >
        {blocked.items.map((item) => (
          <tr key={item.id} className={rowClass}>
            <td className={`${td} whitespace-nowrap text-soft`}>{fullStamp(item.at)}</td>
            <td className={`${td} font-semibold`}>{item.visitor}</td>
            <td className={td}>{SEVERITIES.includes(item.severity) ? <SeverityBadge severity={item.severity as Severity} /> : <span className="text-muted">{item.severity}</span>}</td>
          </tr>
        ))}
      </Section>

      <Section
        title="Digital signatures"
        note="NDAs and other documents visitors signed at this location, in the selected dates and resident company."
        count={signatures.items.length}
        truncated={signatures.truncated}
        columns={["Signed", "Visitor", "Document", "Resident Company"]}
        empty="No documents were signed in this date range."
      >
        {signatures.items.map((item) => (
          <tr key={item.id} className={rowClass}>
            <td className={`${td} whitespace-nowrap text-soft`}>{fullStamp(item.signedAt)}</td>
            <td className={`${td} font-semibold`}>{item.visitor}</td>
            <td className={td}>
              {item.document}
              <div className="text-[11px] text-muted">{item.documentType}</div>
            </td>
            <td className={`${td} text-soft`}>{item.residentCompany}</td>
          </tr>
        ))}
      </Section>

      <Section
        title="Emergency roll-call history"
        note="Emergency mode and evacuations at this location, in the selected dates."
        count={emergencies.items.length}
        truncated={emergencies.truncated}
        columns={["Time", "Event", "Staff", "Checked Out"]}
        empty="Emergency mode was not used in this date range."
      >
        {emergencies.items.map((item) => (
          <tr key={item.id} className={rowClass}>
            <td className={`${td} whitespace-nowrap text-soft`}>{fullStamp(item.at)}</td>
            <td className={td}>
              <span
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                  item.event === "Evacuation" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                {item.event.toUpperCase()}
              </span>
            </td>
            <td className={`${td} font-medium`}>{item.actor}</td>
            <td className={`${td} text-soft`}>{item.checkedOut === undefined ? "-" : `${item.checkedOut} ${item.checkedOut === 1 ? "visitor" : "visitors"}`}</td>
          </tr>
        ))}
      </Section>
    </div>
  );
}

/** One CSV for the whole report: the first column says which list each line belongs to */
export function watchlistCsv(report: ApiWatchlistReport) {
  const { entries, blocked, signatures, emergencies } = report;
  const rows: string[][] = [
    ...entries.items.map((e) => ["Watchlist entry", fullStamp(e.createdAt), e.name, e.severity, e.reason]),
    ...blocked.items.map((b) => ["Blocked check-in", fullStamp(b.at), b.visitor, b.severity, "Check-in stopped by a watchlist match"]),
    ...signatures.items.map((s) => ["Signature", fullStamp(s.signedAt), s.visitor, s.documentType, `${s.document} (${s.residentCompany})`]),
    ...emergencies.items.map((m) => ["Emergency", fullStamp(m.at), m.actor, m.event, m.checkedOut === undefined ? "" : `${m.checkedOut} checked out`]),
  ];
  return { headers: ["Section", "Date", "Person", "Severity / Type / Event", "Details"], rows };
}

import type { ReactNode } from "react";
import { StatusBadge, TypeBadge } from "@/src/components/visitors/badges";
import type { CategoryRow, LedgerRow, LobbyRow, OccupancyRow, OverstayRow, VolumeLevel } from "@/src/lib/report-calculations";

const th = "px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted";
const td = "px-4 py-3.5";

function TableShell({ minWidth, head, children }: { minWidth: string; head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} border-collapse text-left text-xs`}>
        <thead>
          <tr className="border-b border-line bg-surface-soft">{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children: ReactNode }) => (
  <th scope="col" className={th}>
    {children}
  </th>
);

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-muted">
        No visitors match this date range and company.
      </td>
    </tr>
  );
}

const rowClass = "transition-colors hover:bg-surface-soft";

export function OverstayTable({ rows }: { rows: OverstayRow[] }) {
  return (
    <TableShell
      minWidth="min-w-[980px]"
      head={
        <>
          <Th>Visitor Name</Th>
          <Th>Company</Th>
          <Th>Host Name</Th>
          <Th>Check In Time</Th>
          <Th>Check Out Time</Th>
          <Th>Status</Th>
          <Th>Duration</Th>
          <Th>Resident Company</Th>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.id} className={rowClass}>
          <td className={`${td} whitespace-nowrap font-semibold`}>{row.visitor}</td>
          <td className={`${td} text-soft`}>{row.company}</td>
          <td className={td}>{row.host}</td>
          <td className={`${td} whitespace-nowrap text-soft`}>{row.checkIn}</td>
          <td className={`${td} text-soft`}>
            {row.status === "pending_clearance" ? "Awaiting clearance" : "Unresolved"}
            <div className="text-[11px] text-muted">{row.status === "pending_clearance" ? "(Check-out requested)" : "(Overstay)"}</div>
          </td>
          <td className={td}>
            <span
              className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                row.status === "pending_clearance"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {row.status === "pending_clearance" ? "PENDING CLEARANCE" : "OVERSTAY WARNING"}
            </span>
          </td>
          <td className={`${td} whitespace-nowrap font-medium`}>{row.duration}</td>
          <td className={td}>
            {row.residentCompany}
            <div className="text-[11px] text-muted">({row.suite})</div>
          </td>
        </tr>
      ))}
      {rows.length === 0 && <EmptyRow colSpan={8} />}
    </TableShell>
  );
}

export function OccupancyTable({ rows }: { rows: OccupancyRow[] }) {
  return (
    <TableShell
      minWidth="min-w-[720px]"
      head={
        <>
          <Th>Resident Company</Th>
          <Th>Floor Suite</Th>
          <Th>Total Visitors</Th>
          <Th>Avg Duration</Th>
          <Th>Percentage Traffic</Th>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.company} className={rowClass}>
          <td className={`${td} font-medium`}>{row.company}</td>
          <td className={`${td} whitespace-nowrap text-soft`}>{row.suite}</td>
          <td className={td}>{row.visitors}</td>
          <td className={`${td} whitespace-nowrap`}>{row.avgDuration}</td>
          <td className={`${td} font-medium`}>{row.share}</td>
        </tr>
      ))}
      {rows.length === 0 && <EmptyRow colSpan={5} />}
    </TableShell>
  );
}

const levels: Record<VolumeLevel, string> = {
  Quiet: "border-transparent bg-slate-500/10 text-soft",
  Normal: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Moderate: "border-brand/20 bg-brand-soft text-brand",
  Peak: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function LobbyTable({ rows }: { rows: LobbyRow[] }) {
  return (
    <TableShell
      minWidth="min-w-[560px]"
      head={
        <>
          <Th>Time Slot</Th>
          <Th>Total Check Ins</Th>
          <Th>Percentage Traffic</Th>
          <Th>Volume Level</Th>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.slot} className={rowClass}>
          <td className={`${td} whitespace-nowrap`}>{row.slot}</td>
          <td className={td}>{row.checkIns}</td>
          <td className={td}>{row.share}</td>
          <td className={td}>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${levels[row.level]}`}>
              {row.level}
            </span>
          </td>
        </tr>
      ))}
      {rows.length === 0 && <EmptyRow colSpan={4} />}
    </TableShell>
  );
}

export function CategoryTable({ rows }: { rows: CategoryRow[] }) {
  return (
    <TableShell
      minWidth="min-w-[560px]"
      head={
        <>
          <Th>Visitor Category</Th>
          <Th>Total Visits</Th>
          <Th>Avg Stay Duration</Th>
          <Th>Percentage Share</Th>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.category} className={rowClass}>
          <td className={`${td} font-medium`}>{row.category}</td>
          <td className={td}>{row.visits}</td>
          <td className={td}>{row.avgStay}</td>
          <td className={td}>{row.share}</td>
        </tr>
      ))}
      {rows.length === 0 && <EmptyRow colSpan={4} />}
    </TableShell>
  );
}

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  return (
    <TableShell
      minWidth="min-w-[1100px]"
      head={
        <>
          <Th>Visitor</Th>
          <Th>Type</Th>
          <Th>Company</Th>
          <Th>Host</Th>
          <Th>Resident Company</Th>
          <Th>Check In</Th>
          <Th>Check Out</Th>
          <Th>Status</Th>
          <Th>Duration</Th>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.id} className={rowClass}>
          <td className={`${td} whitespace-nowrap font-semibold`}>{row.visitor}</td>
          <td className={td}>
            <TypeBadge type={row.type} />
          </td>
          <td className={`${td} text-soft`}>{row.company}</td>
          <td className={td}>{row.host}</td>
          <td className={`${td} text-soft`}>{row.residentCompany}</td>
          <td className={`${td} whitespace-nowrap text-soft`}>{row.checkIn}</td>
          <td className={`${td} whitespace-nowrap text-soft`}>{row.checkOut}</td>
          <td className={td}>
            <StatusBadge status={row.status} />
          </td>
          <td className={`${td} whitespace-nowrap font-medium`}>{row.duration}</td>
        </tr>
      ))}
      {rows.length === 0 && <EmptyRow colSpan={9} />}
    </TableShell>
  );
}

import type { Visitor, VisitorStatus, VisitorType } from "./mock-visitors";

export type PresetKey = "today" | "7d" | "30d" | "month";

export type Filters = {
  query: string;
  status: "all" | VisitorStatus;
  type: "all" | VisitorType;
  /** yyyy-mm-dd, or "" for no limit */
  from: string;
  to: string;
  preset: PresetKey | null;
};

export const emptyFilters: Filters = { query: "", status: "all", type: "all", from: "", to: "", preset: null };

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shiftDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** Today in this browser, as yyyy-mm-dd. Call it when needed (not at the top of a file) so it is never stale. */
export const todayIso = () => toIso(new Date());

/** "Nov 9, 2026" -> "2026-11-09" */
export const displayToIso = (display: string) => toIso(new Date(display));

/** The quick date ranges, worked out from today's date every time they are needed */
export function getPresets(): { key: PresetKey; label: string; range: [string, string] }[] {
  const today = todayIso();
  return [
    { key: "today", label: "Today", range: [today, today] },
    { key: "7d", label: "Last 7 Days", range: [shiftDays(today, -6), today] },
    { key: "30d", label: "Last 30 Days", range: [shiftDays(today, -29), today] },
    { key: "month", label: "This Month", range: [`${today.slice(0, 8)}01`, today] },
  ];
}

export function matchesFilters(visitor: Visitor, filters: Filters) {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = [visitor.name, visitor.company, visitor.residentCompany, visitor.host, visitor.type].join(" ").toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.status !== "all" && visitor.status !== filters.status) return false;
  if (filters.type !== "all" && visitor.type !== filters.type) return false;

  const day = displayToIso(visitor.checkIn.date);
  if (filters.from && day < filters.from) return false;
  if (filters.to && day > filters.to) return false;
  return true;
}
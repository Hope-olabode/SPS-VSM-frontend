import type { ApiCategoryReport, ApiLedgerReport, ApiLobbyReport, ApiOccupancyReport, ApiOverstayReport } from "./api";
import type { VisitorStatus, VisitorType } from "./mock-visitors";

// The numbers in every report are worked out by the server (GET /api/reports/:type, see backend/src/routes/reports.js).
// This file only turns what the server sends into the text the tables and CSV files show.

/** The Resident Company filter: everyone, or visitors who have no resident company */
export const ALL_COMPANIES = "all";
export const UNASSIGNED = "none";

/** 368 -> "6h 8m", 55 -> "55m" */
export function formatMinutes(total: number) {
  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** "09:49 AM" -> 9, "01:14 PM" -> 13 */
export function hourOf(time: string) {
  const [clock, meridiem] = time.trim().split(" ");
  const hour = Number(clock.split(":")[0]) % 12;
  return meridiem?.toUpperCase() === "PM" ? hour + 12 : hour;
}

const clock = (when: Date) => when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
/** "Nov 9, 02:15 PM" */
const shortStamp = (iso: string) => `${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${clock(new Date(iso))}`;
/** "Nov 9, 2026 02:15 PM" */
const fullStamp = (iso: string) => `${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${clock(new Date(iso))}`;
const hourLabel = (hour: number) => `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;

/* ───────── 1. Daily Overstay & Security Exception ───────── */

export type OverstayRow = {
  id: string;
  visitor: string;
  company: string;
  host: string;
  checkIn: string;
  duration: string;
  residentCompany: string;
  suite: string;
  status: Extract<VisitorStatus, "onsite" | "pending_clearance">;
};

export const overstayRows = (report: ApiOverstayReport): OverstayRow[] =>
  report.items.map((item) => ({
    id: item.id,
    visitor: item.visitor,
    company: item.company || "N/A",
    host: item.host,
    checkIn: shortStamp(item.checkInAt),
    duration: formatMinutes(item.durationMinutes),
    residentCompany: item.residentCompany,
    suite: item.suite || "-",
    status: item.status,
  }));

/* ───────── 2. Resident Company Occupancy & Footprint ───────── */

export type OccupancyRow = { company: string; suite: string; visitors: number; avgDuration: string; share: string };

export const occupancyRows = (report: ApiOccupancyReport): OccupancyRow[] =>
  report.items.map((item) => ({
    company: item.company,
    suite: item.suite || "-",
    visitors: item.visitors,
    avgDuration: formatMinutes(item.avgMinutes),
    share: `${item.sharePct}%`,
  }));

/* ───────── 3. Lobby Traffic & Peak Arrival ───────── */

export type VolumeLevel = "Quiet" | "Normal" | "Moderate" | "Peak";
export type LobbyRow = { slot: string; checkIns: number; share: string; level: VolumeLevel };

export const lobbyRows = (report: ApiLobbyReport): LobbyRow[] =>
  report.items.map((item) => ({
    slot: `${hourLabel(item.hour)} - ${hourLabel(item.hour + 1)}`,
    checkIns: item.checkIns,
    share: `${item.sharePct}%`,
    level: item.level,
  }));

/* ───────── 4. Visitor Category & Vendor Intelligence ───────── */

export type CategoryRow = { category: VisitorType; visits: number; avgStay: string; share: string };

export const categoryRows = (report: ApiCategoryReport): CategoryRow[] =>
  report.items.map((item) => ({
    category: item.category as VisitorType,
    visits: item.visits,
    avgStay: formatMinutes(item.avgMinutes),
    share: `${item.sharePct}%`,
  }));

/* ───────── 6. Master Visitor Audit Ledger ───────── */

export type LedgerRow = {
  id: string;
  visitor: string;
  type: VisitorType;
  company: string;
  host: string;
  residentCompany: string;
  checkIn: string;
  checkOut: string;
  status: VisitorStatus;
  duration: string;
};

export const ledgerRows = (report: ApiLedgerReport): LedgerRow[] =>
  report.items.map((item) => ({
    id: item.id,
    visitor: item.visitor,
    type: item.type as VisitorType,
    company: item.company || "N/A",
    host: item.host,
    residentCompany: item.residentCompany,
    checkIn: fullStamp(item.checkInAt),
    checkOut: item.checkOutAt ? fullStamp(item.checkOutAt) : "-",
    status: item.status,
    duration: formatMinutes(item.durationMinutes),
  }));

/** "Nov 9, 2026 02:15 PM", for the watchlist report's lists */
export { fullStamp };

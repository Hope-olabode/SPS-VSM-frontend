// Types and options for the Watchlist page. The entries themselves come from GET /api/watchlist.

export const severities = ["Low", "Medium", "High", "Critical"] as const;
export type Severity = (typeof severities)[number];

export type WatchlistEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Country code and number kept apart, e.g. "+234" and "801 234 5678" */
  phoneCode: string;
  phone: string;
  company: string;
  severity: Severity;
  reason: string;
  /** "Nov 11, 2026", as shown on screen */
  addedOn: string;
};

/** What the Add to Watchlist form hands back */
export type NewWatchlistEntry = Omit<WatchlistEntry, "id" | "addedOn">;

export { phoneCodes } from "./phone-codes";

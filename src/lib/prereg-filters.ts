import type { PresetKey } from "./visitor-filters";
import type { PreRegistration, PreRegStatus } from "./mock-preregistrations";

export type PreRegFilters = {
  query: string;
  status: "all" | PreRegStatus;
  /** yyyy-mm-dd, or "" for no limit */
  from: string;
  to: string;
  preset: PresetKey | null;
};

export const emptyPreRegFilters: PreRegFilters = { query: "", status: "all", from: "", to: "", preset: null };

export function matchesPreRegFilters(item: PreRegistration, filters: PreRegFilters) {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = [item.name, item.email, item.company, item.jobTitle ?? "", item.residentCompany, item.qrCode]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.status !== "all" && item.status !== filters.status) return false;

  // expectedDate is already yyyy-mm-dd, so plain string comparison works
  if (filters.from && item.expectedDate < filters.from) return false;
  if (filters.to && item.expectedDate > filters.to) return false;
  return true;
}

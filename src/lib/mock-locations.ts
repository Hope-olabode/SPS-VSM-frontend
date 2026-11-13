// Types for the Locations pages. The locations themselves come from GET /api/locations.

export type LocationStatus = "active" | "inactive";

export type Location = {
  id: string;
  name: string;
  /** Street address, optional */
  address: string;
  /** "Lagos, Nigeria" */
  city: string;
  status: LocationStatus;
  /** The first location can't be removed */
  primary: boolean;
  /** "Aug 1, 2026", as shown on screen */
  created: string;
};

/** What the Add / Edit form hands back */
export type LocationInput = Pick<Location, "name" | "address" | "city" | "status">;

/** Visitors saved before locations existed belong here. */
export const DEFAULT_LOCATION = "Main Lobby";

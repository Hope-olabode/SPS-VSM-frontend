/** Calls the kiosk API with the kiosk's token and code attached (see KioskApp). Rejects with ApiError. */
export type Call = <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>;

/** What POST /api/kiosk/check-in and /api/kiosk/pass-check-in answer */
export type CheckInResult = { id: string; status: "checked_in" | "pending_approval" };

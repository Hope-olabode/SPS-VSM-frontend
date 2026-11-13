/**
 * Talks to the Express API in backend-node.
 * Requests go to /backend/... on this site; next.config.ts forwards them to the API (API_URL),
 * so the login cookie is sent automatically and there is no CORS to worry about.
 */

export const LOGIN_PATH = "/auth/Login";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issues?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, "body"> & {
  /** Sent as JSON */
  body?: unknown;
  /** Set false on the login call so a wrong password doesn't bounce you to the login page */
  redirectOn401?: boolean;
};

/** api<{ user: ApiUser }>("/auth/me") — throws ApiError with the server's message when it fails */
export async function api<T = unknown>(path: string, { body, redirectOn401 = true, headers, ...init }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/backend${path}`, {
      ...init,
      credentials: "same-origin",
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401 && redirectOn401 && typeof window !== "undefined") {
    const next = window.location.pathname + window.location.search;
    // a full page load (not router.push) so no signed-in data stays in memory
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
  }
  if (!res.ok || data?.ok === false) {
    // the dev proxy answers 500 with an HTML page when the API isn't running
    const fallback = res.status >= 500 && !data ? "The server isn't responding. Is the API running?" : "Something went wrong.";
    throw new ApiError(data?.error ?? fallback, res.status, data?.issues);
  }
  return data as T;
}

// ----- shapes the API sends back -----

export type ApiRole = "GLOBAL_ADMIN" | "LOCATION_ADMIN" | "MANAGER" | "TENANT_REP" | "USER";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  /** The location they are working in now. A global admin can pick any location in the top bar. */
  locationId: string;
  locationName: string;
  /** The location the user belongs to */
  homeLocationId: string;
};

/** The API stores roles as GLOBAL_ADMIN; the UI shows and compares them as "GLOBAL ADMIN" */
export const toUiRole = (role: ApiRole) => role.replace(/_/g, " ");

export type ApiVisit = {
  id: string;
  name: string;
  phone: string;
  type: string;
  company: string;
  residentCompany: string;
  floor?: string;
  host: string;
  status: "PENDING_APPROVAL" | "ONSITE" | "PENDING_CLEARANCE" | "LEFT" | "DECLINED";
  checkInAt: string;
  checkOutAt: string | null;
  clearanceRequestedAt: string | null;
  /** Inside for longer than the Control Panel's overstay threshold */
  overstay?: boolean;
  /** The scheduled job checked this visitor out (nobody signed them out) */
  autoCheckedOut?: boolean;
};

export type ApiVisitList = { ok: true; total: number; page: number; items: ApiVisit[] };

/** GET /api/visitors/:id: everything the visitor details drawer shows (the photo and signature are fetched as images from /visitors/:id/photo and /signature) */
export type ApiVisitDetails = {
  id: string;
  name: string;
  /** Masked for staff who may not see full numbers */
  phone: string;
  email: string;
  company: string;
  type: string;
  purpose: string;
  notes: string;
  host: string;
  residentCompany: string;
  floor?: string;
  status: ApiVisit["status"];
  checkInAt: string;
  checkOutAt: string | null;
  clearanceRequestedAt: string | null;
  /** The staff member who let the visitor in or turned them away (host approval) */
  decidedBy: string | null;
  decidedAt: string | null;
  hasPhoto: boolean;
  hasSignature: boolean;
  documentsSigned: { title: string; signedAt: string }[];
  /** How many earlier visits this person made to this location */
  earlierVisits: number;
  recentVisits: { id: string; type: string; host: string; status: ApiVisit["status"]; checkInAt: string; checkOutAt: string | null }[];
};
export type ApiVisitDetailsResponse = { ok: true; visit: ApiVisitDetails };

export type ApiTenant = { id: string; name: string; floor?: string };
export type ApiTenantList = { ok: true; items: ApiTenant[] };

export type ApiWatchlistEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  company: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  createdAt: string;
};
export type ApiWatchlistList = { ok: true; items: ApiWatchlistEntry[] };

export type ApiAuditEvent = {
  id: string;
  seq: number;
  action: string;
  category: "Visitor" | "Report" | "Security";
  actor: { name: string; role?: string };
  message: { text: string; strong?: boolean }[];
  location?: string;
  createdAt: string;
};
export type ApiAuditList = { ok: true; items: ApiAuditEvent[] };

export type ApiManagedUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  /** The name of the location the user belongs to */
  branch: string;
  locationId: string;
  createdAt: string;
  lastActiveAt: string | null;
};

/** The UI spells roles "LOCATION ADMIN"; the API wants LOCATION_ADMIN */
export const toApiRole = (role: string) => role.replace(/ /g, "_");

export type ApiLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  status: "active" | "inactive";
  primary: boolean;
  createdAt: string;
};

/** The server's message when it sent one, otherwise a general one */
export const errorMessage = (err: unknown, fallback = "Something went wrong. Please try again.") => (err instanceof ApiError ? err.message : fallback);

/** Same shape as PreRegistration in lib/mock-preregistrations.ts, so the list can be used as it arrives */
export type ApiPreRegistration = {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle?: string;
  /** yyyy-mm-dd */
  expectedDate: string;
  /** "8:00 AM", or "" when no time was given */
  expectedTime: string;
  residentCompany: string;
  status: "expected" | "checked_in" | "checked_out" | "cancelled";
  qrCode: string;
  phoneCode?: string;
  phone?: string;
  visitorType?: string;
  host?: string;
  purpose?: string;
};
export type ApiPreRegistrationList = { ok: true; items: ApiPreRegistration[] };

/** GET /api/pre-registrations/lookup?code=PR-123456: what the QR scanner finds. `expectedToday` is false when the visit is for another day. */
export type ApiPreRegistrationLookup = { ok: true; item: ApiPreRegistration; expectedToday: boolean };

/** Same shape as EventItem in lib/mock-events.ts, so the list can be used as it arrives */
export type ApiEvent = {
  id: string;
  title: string;
  /** The name of the location the event is at */
  location: string;
  /** yyyy-mm-dd */
  startDate: string;
  /** HH:mm (24-hour) */
  startTime: string;
  endDate: string;
  endTime: string;
  capacity: number;
  registered: number;
  /** Registrations waiting for staff to approve them (they already count in `registered`) */
  pending: number;
  description: string;
  requireNda: boolean;
  requirePhoto: boolean;
  requireApproval: boolean;
  /** The secret in the public registration link, /register/<token> */
  registrationToken: string;
};
export type ApiEventList = { ok: true; items: ApiEvent[] };

export type ApiEventRegistration = {
  id: string;
  name: string;
  email: string;
  /** Masked for staff who may not see full numbers */
  phone: string;
  company: string;
  /** PENDING waits for staff when the event requires host approval; staff registrations are APPROVED straight away */
  status: "PENDING" | "APPROVED";
  registeredAt: string;
};
export type ApiRegistrationList = { ok: true; items: ApiEventRegistration[]; registered: number; pending: number; capacity: number };

/** GET /api/public/events/:token: what the public registration page shows (no login) */
export type ApiPublicEvent = {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  requireApproval: boolean;
  ended: boolean;
  full: boolean;
};

export type ApiDocument = {
  id: string;
  title: string;
  type: "NDA" | "Safety Briefing" | "Wi-Fi Policy" | "Other";
  content: string;
  requireSignature: boolean;
  active: boolean;
  createdAt: string;
};
export type ApiDocumentList = { ok: true; items: ApiDocument[] };

export type ApiAnalytics = {
  from: string;
  to: string;
  /** How many days the range covers (both dates included) */
  days: number;
  total: number;
  avgDurationMinutes: number | null;
  /** Percent of visits made by someone who had visited before */
  returnRate: number;
  /** Percent of visits from before today that were checked out, or null when there are none yet */
  compliance: number | null;
  /** Percent change against the period right before, or null when that had no visits */
  change: number | null;
  trend: { label: string; count: number }[];
  byType: { name: string; value: number }[];
  peakHours: { hour: string; count: number }[];
  busiestDays: { day: string; count: number }[];
  byPurpose: { label: string; count: number }[];
  topVisitors: { name: string; company?: string; visits: number }[];
  topHosts: { name: string; visits: number }[];
  topCompanies: { name: string; visits: number }[];
};

/** GET /api/settings/kiosk and POST /api/settings/kiosk/regenerate. url (and code) are null when they can't be shown any more: regenerate them. */
export type ApiKioskLink = { ok: true; url: string | null; code?: string | null };

/** GET /api/locations/kiosk-codes (global admins): every location's 6-digit kiosk code */
export type ApiKioskCode = { locationId: string; name: string; active: boolean; code: string | null };

/** POST /api/kiosk/pass-lookup { code }: the pre-registration behind a scanned pass. Anything that can't be used comes back as an error with the message to show. */
export type ApiKioskPass = {
  ok: true;
  /** the pass was saved without a phone number, so the kiosk asks for it */
  needsPhone: boolean;
  visitor: { firstName: string; lastName: string; company: string; visitorType: string; residentCompany: string; host: string; purpose: string };
};

/** GET /api/kiosk/config: everything the kiosk screen needs (sent with the x-kiosk-token header) */
export type ApiKioskConfig = {
  ok: true;
  locationName: string;
  welcomeMessage: string;
  allowWalkIns: boolean;
  requirePhoto: boolean;
  requireSignature: boolean;
  requireCheckoutClearance: boolean;
  tenants: ApiTenant[];
  documents: { id: string; title: string; content: string }[];
};

/**
 * POST /api/kiosk/lookup { phone }: what the kiosk learns from the number before the form. A watchlist hit or a refused walk-in comes
 * back as an error (403) with the message to show. `visitor` fills the form in for "expected" (pre-registered today) and "returning".
 */
export type ApiKioskLookup = {
  ok: true;
  status: "expected" | "returning" | "new";
  /** Staff will have to let this visitor in ("Require host approval", for visitors who weren't pre-registered) */
  requiresApproval: boolean;
  visitor?: {
    firstName: string;
    lastName: string;
    company: string;
    visitorType: string;
    residentCompany: string;
    host: string;
    purpose: string;
  };
};

export type ApiSmsContact = { phone: string; name: string; company: string; type: string };

export type ApiSmsCampaign = {
  id: string;
  message: string;
  /** How many numbers the provider accepted */
  recipients: number;
  failed: number;
  segments: number;
  /** true when no SMS provider is connected, so nothing really went out */
  testMode: boolean;
  sentBy?: string;
  createdAt: string;
};

/** GET /api/old-records: a record moved out of the live tables by data retention (global admins only) */
export type ApiOldRecord = {
  id: string;
  source: "VISIT" | "PRE_REGISTRATION" | "EVENT_REGISTRATION";
  name: string;
  phone: string | null;
  email: string | null;
  company: string;
  jobTitle: string | null;
  type: string | null;
  host: string;
  purpose: string;
  notes: string | null;
  residentCompany: string | null;
  floor: string | null;
  status: string;
  eventTitle: string | null;
  recordAt: string;
  checkOutAt: string | null;
  autoCheckedOut: boolean;
  documentsSigned: { title: string; signedAt: string }[];
  hasPhoto: boolean;
  hasSignature: boolean;
  archivedAt: string;
  /** Set once the personal details were removed (the second retention stage) */
  anonymizedAt: string | null;
};
export type ApiOldRecordList = { ok: true; total: number; page: number; items: ApiOldRecord[] };

/* ───────── Reports: GET /api/reports/:type (see backend/src/routes/reports.js) ───────── */

/** Every report answer carries the dates it covered */
type ApiReportBase = { ok: true; from: string; to: string };
/** A list the server cuts off at 1000 rows and says so */
type ApiCutList<T> = { items: T[]; truncated: boolean };

export type ApiReportStatus = "onsite" | "pending_clearance" | "left";

export type ApiOverstayReport = ApiReportBase & {
  items: {
    id: string;
    visitor: string;
    company: string | null;
    host: string;
    checkInAt: string;
    status: Extract<ApiReportStatus, "onsite" | "pending_clearance">;
    durationMinutes: number;
    residentCompany: string;
    suite: string;
  }[];
  truncated: boolean;
};

export type ApiOccupancyReport = ApiReportBase & {
  items: { company: string; suite: string; visitors: number; avgMinutes: number; sharePct: number }[];
};

export type ApiLobbyReport = ApiReportBase & {
  total: number;
  items: { hour: number; checkIns: number; sharePct: number; level: "Quiet" | "Normal" | "Moderate" | "Peak" }[];
};

export type ApiCategoryReport = ApiReportBase & {
  items: { category: string; visits: number; avgMinutes: number; sharePct: number }[];
};

export type ApiLedgerReport = ApiReportBase & {
  /** The full number of visits in the range, even when `items` was cut short by ?limit= */
  total: number;
  items: {
    id: string;
    visitor: string;
    type: string;
    company: string | null;
    host: string;
    residentCompany: string;
    checkInAt: string;
    checkOutAt: string | null;
    status: ApiReportStatus;
    durationMinutes: number;
  }[];
};

export type ApiWatchlistReport = ApiReportBase & {
  entries: ApiCutList<{ id: string; name: string; company: string | null; severity: ApiWatchlistEntry["severity"]; reason: string; createdAt: string }>;
  blocked: ApiCutList<{ id: string; visitor: string; severity: string; at: string }>;
  signatures: ApiCutList<{ id: string; visitor: string; document: string; documentType: string; residentCompany: string; signedAt: string }>;
  emergencies: ApiCutList<{ id: string; event: "Activated" | "Deactivated" | "Evacuation"; actor: string; checkedOut?: number; at: string }>;
};

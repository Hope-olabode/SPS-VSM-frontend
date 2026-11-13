import type { ApiAuditEvent } from "./api";
import { hourOf } from "./report-calculations";
import { displayToIso } from "./visitor-filters";

// The audit trail is an append-only list of events. The API writes most of them itself (check-in, sign-out,
// watchlist, login...) and GET /api/audit returns them; see AuditProvider for how the page loads and adds to them.
// Events for features that are not connected to the API yet are kept in the browser only (marked `local`).

export type AuditAction =
  | "KIOSK_CHECK_IN"
  | "KIOSK_APPROVAL_REQUESTED"
  | "VISITOR_APPROVED"
  | "VISITOR_DECLINED"
  | "KIOSK_CHECKOUT_REQUESTED"
  | "VISITOR_CLEARANCE_APPROVED"
  | "VISITOR_CLEARANCE_DECLINED"
  | "VISITOR_SIGN_OUT"
  | "VISITOR_CHECK_OUT"
  | "VISITOR_AUTO_CHECK_OUT"
  | "VISITOR_OVERSTAY"
  | "DATA_RETENTION_RUN"
  | "REPORTS_VIEW"
  | "PII_UNLOCKED"
  | "EMERGENCY_ACTIVATED"
  | "EMERGENCY_DEACTIVATED"
  | "EMERGENCY_EVACUATION"
  | "USER_INVITED"
  | "USER_UPDATED"
  | "USER_REMOVED"
  | "USER_PASSWORD_RESET"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_REMOVED"
  | "SETTINGS_UPDATED"
  | "KIOSK_TOKEN_REGENERATED"
  | "KIOSK_CODE_REGENERATED"
  | "KIOSK_UNLOCK_FAILED"
  | "USER_ROLE_CHANGED"
  | "PRE_REGISTRATION_CREATED"
  | "PRE_REGISTRATION_DELETED"
  | "EVENT_CREATED"
  | "EVENT_DELETED"
  | "EVENT_UPDATED"
  | "EVENT_LINK_REGENERATED"
  | "EVENT_REGISTRATION_ADDED"
  | "EVENT_REGISTRATION_REMOVED"
  | "EVENT_REGISTRATION_SELF"
  | "EVENT_REGISTRATION_APPROVED"
  | "EVENT_REGISTRATION_DECLINED"
  | "RESIDENT_COMPANY_ADDED"
  | "RESIDENT_COMPANY_UPDATED"
  | "RESIDENT_COMPANY_REMOVED"
  | "LOCATION_CREATED"
  | "LOCATION_UPDATED"
  | "LOCATION_REMOVED"
  | "PROFILE_UPDATED"
  | "PASSWORD_CHANGED"
  | "SMS_CAMPAIGN_SENT"
  | "WATCHLIST_ADDED"
  | "WATCHLIST_REMOVED"
  | "WATCHLIST_MATCH"
  | "USER_LOGIN";

export type AuditCategory = "Visitor" | "Report" | "Security";
export type Segment = { text: string; strong?: boolean };
export type AuditActor = { name: string; role?: string };

export const SYSTEM_ACTOR: AuditActor = { name: "System" };

export type AuditEvent = {
  id: string;
  /** Higher = recorded later. Breaks ties between events in the same minute. */
  seq: number;
  action: AuditAction;
  category: AuditCategory;
  actor: AuditActor;
  message: Segment[];
  location?: string;
  /** "Nov 9, 2026" and "11:47 AM", as shown on screen */
  date: string;
  time: string;
  /** Sortable "2026-11-09 11:47" */
  at: string;
  /** Only in this browser (the feature behind it is not connected to the API yet). Gone after a refresh. */
  local?: boolean;
};

const plain = (text: string): Segment => ({ text });
const bold = (text: string): Segment => ({ text, strong: true });

export const auditMessages = {
  checkIn: (visitor: string, location: string) => [plain("Visitor "), bold(visitor), plain(` checked in via kiosk (Location: ${location})`)],
  checkoutRequested: (visitor: string, kiosk: string) => [
    plain("Visitor "),
    bold(visitor),
    plain(` requested checkout at kiosk ${kiosk}. Awaiting staff clearance.`),
  ],
  clearanceApproved: (staff: string, visitor: string) => [plain("Staff "), bold(staff), plain(" approved checkout clearance for visitor "), bold(visitor), plain(".")],
  clearanceDeclined: (staff: string, visitor: string) => [plain("Staff "), bold(staff), plain(" declined checkout clearance for visitor "), bold(visitor), plain(".")],
  signOut: (staff: string, visitor: string) => [plain("Staff "), bold(staff), plain(" signed out visitor "), bold(visitor), plain(".")],
  checkOut: (visitor: string) => [plain("Visitor "), bold(visitor), plain(" checked out.")],
  reportView: (type: string) => [plain("Generated executive report (Type: "), bold(type), plain(")")],
  emergencyActivated: (staff: string) => [plain("Staff "), bold(staff), plain(" activated emergency mode.")],
  emergencyDeactivated: (staff: string) => [plain("Staff "), bold(staff), plain(" deactivated emergency mode.")],
  emergencyEvacuation: (staff: string, count: number) => [
    plain("Staff "),
    bold(staff),
    plain(" ran an emergency evacuation and checked out "),
    bold(`${count} onsite ${count === 1 ? "visitor" : "visitors"}`),
    plain("."),
  ],
  userInvited: (staff: string, user: string) => [plain("Staff "), bold(staff), plain(" invited user "), bold(user), plain(".")],
  userUpdated: (staff: string, user: string) => [plain("Staff "), bold(staff), plain(" updated user "), bold(user), plain(".")],
  userRemoved: (staff: string, user: string) => [plain("Staff "), bold(staff), plain(" removed user "), bold(user), plain(".")],
  userPasswordReset: (staff: string, user: string) => [plain("Staff "), bold(staff), plain(" sent a password reset to user "), bold(user), plain(".")],
  documentCreated: (staff: string, title: string) => [plain("Staff "), bold(staff), plain(" created document "), bold(title), plain(".")],
  documentActivated: (staff: string, title: string) => [plain("Staff "), bold(staff), plain(" activated document "), bold(title), plain(".")],
  documentDeactivated: (staff: string, title: string) => [plain("Staff "), bold(staff), plain(" deactivated document "), bold(title), plain(".")],
  documentRemoved: (staff: string, title: string) => [plain("Staff "), bold(staff), plain(" removed document "), bold(title), plain(".")],
  settingsUpdated: (staff: string, changed: string[]) => [
    plain("Staff "),
    bold(staff),
    plain(` updated ${changed.length === 1 ? "a setting" : `${changed.length} settings`}: `),
    bold(changed.join(", ")),
    plain("."),
  ],
  kioskTokenRegenerated: (staff: string) => [plain("Staff "), bold(staff), plain(" regenerated the branch kiosk URL. The old link no longer works.")],
  userRoleChanged: (staff: string, user: string, role: string) => [plain("Staff "), bold(staff), plain(" changed the role of "), bold(user), plain(" to "), bold(role), plain(".")],
  preRegistrationCreated: (staff: string, visitor: string, residentCompany: string) => [
    plain("Staff "),
    bold(staff),
    plain(" pre-registered visitor "),
    bold(visitor),
    plain(" for "),
    bold(residentCompany),
    plain("."),
  ],
  locationCreated: (staff: string, name: string) => [plain("Staff "), bold(staff), plain(" created location "), bold(name), plain(".")],
  locationUpdated: (staff: string, name: string) => [plain("Staff "), bold(staff), plain(" updated location "), bold(name), plain(".")],
  locationRemoved: (staff: string, name: string) => [plain("Staff "), bold(staff), plain(" removed location "), bold(name), plain(".")],
  profileUpdated: (user: string) => [bold(user), plain(" updated their account profile.")],
  passwordChanged: (user: string) => [bold(user), plain(" changed their password.")],
  smsCampaignSent: (staff: string, count: number, testMode: boolean) => [
    plain("Staff "),
    bold(staff),
    plain(" sent an SMS campaign to "),
    bold(`${count} ${count === 1 ? "recipient" : "recipients"}`),
    plain(testMode ? " (test mode, nothing was delivered)." : "."),
  ],
  piiUnlocked: (staff: string) => [plain("Staff "), bold(staff), plain(" revealed unmasked visitor phone numbers in the Visitor Log.")],
};

export const messageText = (event: AuditEvent) => event.message.map((segment) => segment.text).join("");

/* ───────── time helpers ───────── */

export function stampOf(when: Date) {
  return {
    date: when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

export const nowStamp = () => stampOf(new Date());

/** "Nov 9, 2026" + "11:47 AM" -> "2026-11-09 11:47" */
export function stampKey(date: string, time: string) {
  const minutes = time.split(":")[1]?.slice(0, 2) ?? "00";
  return `${displayToIso(date)} ${String(hourOf(time)).padStart(2, "0")}:${minutes}`;
}

/* ───────── events from the API ───────── */

/** GET /api/audit sends an ISO timestamp; show it in the viewer's own time zone */
export function fromApiEvent(event: ApiAuditEvent): AuditEvent {
  const { date, time } = stampOf(new Date(event.createdAt));
  return {
    id: event.id,
    seq: event.seq,
    action: event.action as AuditAction,
    category: event.category,
    actor: event.actor,
    message: event.message,
    location: event.location,
    date,
    time,
    at: stampKey(date, time),
  };
}

/* ───────── filtering ───────── */

export const ALL = "all";

export type AuditFilters = {
  query: string;
  action: string;
  staff: string;
  /** yyyy-mm-dd, or "" for no limit */
  from: string;
  to: string;
};

export const emptyAuditFilters: AuditFilters = { query: "", action: ALL, staff: ALL, from: "", to: "" };

/** Newest first. */
const byNewest = (a: AuditEvent, b: AuditEvent) => b.at.localeCompare(a.at) || b.seq - a.seq;

export function filterEvents(events: AuditEvent[], filters: AuditFilters) {
  const query = filters.query.trim().toLowerCase();
  return events
    .filter((event) => {
      const day = displayToIso(event.date);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      if (filters.action !== ALL && event.action !== filters.action) return false;
      if (filters.staff !== ALL && event.actor.name !== filters.staff) return false;
      if (query) {
        const haystack = [event.action, event.actor.name, event.actor.role ?? "", messageText(event)].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort(byNewest);
}

/** How many events of each action, biggest first. */
export function actionCounts(events: AuditEvent[]) {
  const counts = new Map<string, number>();
  events.forEach((event) => counts.set(event.action, (counts.get(event.action) ?? 0) + 1));
  return [...counts.entries()].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count || a.action.localeCompare(b.action));
}

// Mock data for the dashboard. Replace with real API/database calls later.

import { formatFullPhone } from "./phone-codes";

/**
 * pending_approval: a kiosk visitor waiting for staff to let them in (Control Panel "Require host approval")
 * declined:         staff turned them away, so they never entered
 */
export type VisitorStatus = "pending_approval" | "onsite" | "pending_clearance" | "left" | "declined";

/** Inside the building: onsite, or waiting on a checkout clearance */
export const isInBuilding = (visitor: { status: VisitorStatus }) => visitor.status === "onsite" || visitor.status === "pending_clearance";

/** Was actually let in (so it counts in reports and visitor totals). Waiting or declined visitors were not. */
export const wasAdmitted = (visitor: { status: VisitorStatus }) => visitor.status !== "pending_approval" && visitor.status !== "declined";
/** Matches the visitorType values the API accepts (backend-node/src/routes/visitors.js) */
export type VisitorType = "Client" | "Guest" | "Contractor" | "Candidate" | "Vendor" | "Interviewee";

export const visitorTypes: VisitorType[] = ["Client", "Guest", "Contractor", "Candidate", "Vendor", "Interviewee"];

type Stamp = { date: string; time: string };

export type Visitor = {
  id: string;
  name: string;
  /** Full number, e.g. +2348012345621 (shown masked unless PII is unlocked) */
  phone: string;
  type: VisitorType;
  company: string;
  residentCompany: string;
  floor?: string;
  host: string;
  /** Which location they checked in at. Missing means the original location, Main Lobby. */
  location?: string;
  status: VisitorStatus;
  checkIn: Stamp;
  checkOut?: Stamp;
  duration: string;
  /** Inside for longer than the overstay threshold in the Control Panel */
  overstay?: boolean;
  /** Checked out by the scheduled job, not by a person */
  autoCheckedOut?: boolean;
  /** Present while a kiosk check-out is waiting for staff clearance */
  clearance?: { requestedAt: string; location: string };
};

/** +2348012345621 -> +23480 ••• ••21 */
export const maskPhone = (phone: string) => (phone.startsWith("+") ? `${phone.slice(0, 6)} ••• ••${phone.slice(-2)}` : "Removed");

/** +2348012345621 -> +234 801 234 5621, +447911123456 -> +44 7911123456 */
export const formatPhone = (phone: string) => formatFullPhone(phone);

export const mockStats = {
  visitorsToday: 22,
  currentlyOnsite: 21,
  checkedOut: 4,
  preRegistered: 0,
};

const TODAY = "Nov 9, 2026";
const SQUARE = "The Square Serviced Offices";
const ULTIMUM = "Ultimum Limited";
const TETRA = "Tetra Pak West Africa";
const NIVEA = "Beiersdorf (NIVEA)";
const GROUND = "Ground Floor";
const SECOND = "2nd Floor";

/** "80:21" -> a fake but stable number that starts +23480 and ends in 21 */
function fakePhone(spec: string, seed: number) {
  const [prefix, last2] = spec.split(":");
  const filler = String((seed * 7919 + 123456) % 1_000_000).padStart(6, "0");
  return `+234${prefix}${filler}${last2}`;
}

// name, type, company, resident company, floor, host, phone ("prefix:last2"), check-in time, duration, status, check-out time
type Row = [string, VisitorType, string, string, string, string, string, string, string, VisitorStatus, string?];

const rows: Row[] = [
  ["Samuel Ajayi", "Client", "Zenith Bank", "Tope Adebayo LP", "3rd Floor", "Mr Tope", "80:21", "11:47 AM", "17m", "onsite"],
  ["Kunle Awesu", "Guest", "Teris Print Production", "SPS Facilities Management", "All Floors", "MrTunde", "80:84", "11:44 AM", "20m", "pending_clearance"],
  ["Ibrahim Sanusi", "Guest", "Dragnet", "Troloppe Property Services", GROUND, "Mr Tunde", "80:90", "11:37 AM", "16m", "left", "11:53 AM"],
  ["Rapheal Jonathan", "Guest", "Nikichis", TETRA, "3rd Floor", "Tetra Pak", "70:97", "11:29 AM", "10m", "left", "11:39 AM"],
  ["Ifeoluwa Adejumo", "Guest", "Nikichis", TETRA, "3rd Floor", "Tetra Pak", "80:50", "11:28 AM", "11m", "left", "11:39 AM"],
  ["Anya Skukura", "Guest", "", NIVEA, "4th Floor", "Omotolani", "70:41", "11:23 AM", "41m", "onsite"],
  ["Omoyemi Shukura", "Guest", "S&S", NIVEA, "4th Floor", "Omotola", "80:73", "11:22 AM", "42m", "onsite"],
  ["Christy Osheghale", "Guest", "4 quarters", SQUARE, GROUND, "MrTunde", "80:21", "10:32 AM", "1h 32m", "onsite"],
  ["Funsho Jamiu", "Guest", "Plentyplus", NIVEA, "4th Floor", "Omotolani", "81:86", "10:01 AM", "1h 38m", "left", "11:39 AM"],
  ["Samuel Ogundele", "Guest", "21st Century", ULTIMUM, SECOND, "Habeeb", "90:68", "09:49 AM", "2h 15m", "onsite"],
  ["Abeeb Isiaka", "Contractor", "Maclevi Projects Limited", ULTIMUM, SECOND, "Dimeji", "81:42", "09:42 AM", "2h 22m", "onsite"],
  ["Kunle Oyedele", "Guest", "21st Century", ULTIMUM, SECOND, "Mr Habeeb", "90:24", "09:31 AM", "2h 34m", "onsite"],
  ["Olamide Agusto", "Guest", "Harde Business School", SQUARE, GROUND, "MrTunde", "81:09", "09:29 AM", "2h 36m", "onsite"],
  ["Samuel Ijtusin", "Contractor", "Maclevi Projects Limited", ULTIMUM, SECOND, "Nancy", "90:00", "09:27 AM", "2h 38m", "onsite"],
  ["Deji Alaka", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "70:44", "09:15 AM", "2h 49m", "onsite"],
  ["J A", "Guest", "Harde Business School", SQUARE, GROUND, "Mr Tunde", "", "09:13 AM", "2h 51m", "onsite"],
  ["Lateefat Oguntoye", "Guest", "Ernst & Young", "Tetra Pak West Africa (Floor)", "", "Oladayo", "", "09:11 AM", "2h 53m", "onsite"],
  ["Emmanuella Nwaokono", "Guest", "", "Tetra Pak West Africa (Floor)", "", "Oladayo", "", "09:10 AM", "2h 54m", "onsite"],
  ["Onome Agbi", "Guest", "Harde Business School", SQUARE, GROUND, "Mr Tunde", "", "09:10 AM", "2h 54m", "onsite"],
  ["Funmi Oguntade", "Guest", "4 quarters", SQUARE, GROUND, "Mr Tunde", "", "08:59 AM", "3h 5m", "onsite"],
  ["Damilola Oluwole", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "", "08:58 AM", "3h 6m", "onsite"],
  ["Salam Ademola", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "", "08:52 AM", "3h 12m", "onsite"],
  ["Awusa Joshua", "Guest", "LTT", SQUARE, GROUND, "Mr Tunde", "", "08:46 AM", "3h 18m", "onsite"],
  ["Maria Hassan", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "", "08:41 AM", "3h 23m", "onsite"],
  ["Dami Oguntunde", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "", "08:41 AM", "3h 23m", "onsite"],
  ["Segun Okubayeje", "Guest", "HBS", SQUARE, GROUND, "Mr Tunde", "", "08:33 AM", "3h 31m", "onsite"],
  ["Juliana Meduju", "Guest", "", SQUARE, GROUND, "Mr Tunde", "", "08:30 AM", "3h 34m", "onsite"],
  ["Nengi Jaja", "Candidate", "", "Tops Adebayo LP", "", "Nancy", "", "08:22 AM", "3h 42m", "onsite"],
  ["Joshua Omeonu", "Guest", "Hbs", SQUARE, GROUND, "Mr Tunde", "", "08:15 AM", "3h 49m", "onsite"],
];

const today: Visitor[] = rows.map(
  ([name, type, company, residentCompany, floor, host, phone, time, duration, status, outTime], index) => ({
    id: `v-${index + 1}`,
    name,
    phone: fakePhone(phone || `80:${String((index * 37) % 100).padStart(2, "0")}`, index + 1),
    type,
    company,
    residentCompany,
    floor: floor || undefined,
    host,
    status,
    checkIn: { date: TODAY, time },
    checkOut: outTime ? { date: TODAY, time: outTime } : undefined,
    duration,
    clearance:
      status === "pending_clearance" ? { requestedAt: `${TODAY} 12:03 PM`, location: "Main Lobby" } : undefined,
  }),
);

const earlier: Visitor[] = [
  ["Yekini Toyin", "Contractor", "Calculus global resource", "SPS Facilities Management", "Mr wale", "02:29 PM", "16h 56m"],
  ["Mark Ojei", "Guest", "21st Century Evolution system", ULTIMUM, "Habeeb", "01:14 PM", "18h 11m"],
  ["Azeez Adeneye", "Contractor", "21st Century Evolution", ULTIMUM, "Habeeb", "10:46 AM", "20h 38m"],
].map(([name, type, company, residentCompany, host, time, duration], index) => ({
  id: `v-${today.length + index + 1}`,
  name,
  phone: fakePhone(`80:${String(10 + index * 17)}`, today.length + index + 1),
  type: type as VisitorType,
  company,
  residentCompany,
  host,
  status: "left" as const,
  checkIn: { date: "Nov 7, 2026", time },
  checkOut: { date: "Nov 8, 2026", time: "07:25 AM" },
  duration,
}));

export const mockVisitors: Visitor[] = [...today, ...earlier];
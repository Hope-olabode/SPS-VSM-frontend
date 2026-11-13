// Types and helpers for the Pre-Registration page. The records themselves come from GET /api/pre-registrations.

export type PreRegStatus = "expected" | "checked_in" | "checked_out" | "cancelled";

export const preRegStatuses: { value: PreRegStatus; label: string }[] = [
  { value: "expected", label: "Expected" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
];

export type PreRegistration = {
  id: string;
  name: string;
  email: string;
  company: string;
  /** Small line under the company name, e.g. "Chef 5" */
  jobTitle?: string;
  /** yyyy-mm-dd */
  expectedDate: string;
  /** e.g. "8:00 AM" */
  expectedTime: string;
  residentCompany: string;
  status: PreRegStatus;
  /** Code printed under the visitor's QR, e.g. PR-605309 */
  qrCode: string;
  /** Only set on visitors added through the form */
  phoneCode?: string;
  phone?: string;
  visitorType?: string;
  /** Person being visited; empty when the visit is to the company as a whole */
  host?: string;
  purpose?: string;
};

/** What the "Pre-Register Visitor" form hands back */
export type NewPreRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  company: string;
  visitorType: string;
  residentCompany: string;
  host: string;
  purpose: string;
  /** yyyy-mm-dd */
  expectedDate: string;
  /** "8:00 AM", or "" when no time was picked */
  expectedTime: string;
};

export const visitorTypes = ["Client", "Vendor", "Interviewee", "Guest"] as const;
export { phoneCodes } from "./phone-codes";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-05" -> "Nov 5, 2026" (done by hand so server and browser always agree) */
export function formatExpectedDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

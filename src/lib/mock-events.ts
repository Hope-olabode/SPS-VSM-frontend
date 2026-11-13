// Types and limits for the Events page. The events themselves come from GET /api/events.

export type EventItem = {
  id: string;
  title: string;
  location: string;
  /** yyyy-mm-dd */
  startDate: string;
  /** HH:mm (24-hour, what <input type="time"> gives) */
  startTime: string;
  endDate: string;
  endTime: string;
  capacity: number;
  registered: number;
  /** Registrations waiting for staff approval */
  pending: number;
  description: string;
  requireNda: boolean;
  requirePhoto: boolean;
  requireApproval: boolean;
  /** The secret in the public registration link */
  registrationToken: string;
};

/** What the event form hands back */
export type NewEvent = Omit<EventItem, "id" | "location" | "registered" | "pending" | "registrationToken">;

export const MAX_CAPACITY = 500;

// TODO: use the location picked in the top bar (the "Main Lobby" pill) instead of this constant
export const CURRENT_LOCATION = "Main Lobby";


/** "14:00" -> "2:00 PM" */
export function formatEventTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

/** "Nov 9, 2026, 2:00 PM to 4:00 PM" on one day, or both dates in full when the event runs longer */
export function formatEventWhen(event: Pick<EventItem, "startDate" | "startTime" | "endDate" | "endTime">, formatDate: (iso: string) => string) {
  const start = `${formatDate(event.startDate)}, ${formatEventTime(event.startTime)}`;
  if (event.startDate === event.endDate) return `${start} to ${formatEventTime(event.endTime)}`;
  return `${start} to ${formatDate(event.endDate)}, ${formatEventTime(event.endTime)}`;
}

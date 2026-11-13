// The Control Panel settings: their shape, defaults, option lists and audit labels.
// The values themselves come from GET /api/settings and are saved with PUT /api/settings
// (see components/dashboard/settings-provider.tsx). Keep this in step with backend/src/utils/settings.js.

export type Option = { value: string; label: string };

export type Settings = {
  // check-in
  requirePhoto: boolean;
  requireSignature: boolean;
  requireHostApproval: boolean;
  allowWalkIns: boolean;
  // check-out
  requireCheckoutClearance: boolean;
  autoCheckout: string;
  overstayHours: string;
  // security & privacy
  screenWatchlist: boolean;
  maskPhones: boolean;
  retentionDays: string;
  // notifications
  notifyHostOnArrival: boolean;
  notifyWatchlistMatch: boolean;
  notifyOverstay: boolean;
  dailySummary: boolean;
  // kiosk
  welcomeMessage: string;
};

export const defaultSettings: Settings = {
  requirePhoto: true,
  requireSignature: true,
  requireHostApproval: false,
  allowWalkIns: true,
  requireCheckoutClearance: true,
  autoCheckout: "end_of_day",
  overstayHours: "4",
  screenWatchlist: true,
  maskPhones: true,
  retentionDays: "90",
  notifyHostOnArrival: true,
  notifyWatchlistMatch: true,
  notifyOverstay: true,
  dailySummary: false,
  welcomeMessage: "Welcome! Please check in to let your host know you've arrived.",
};

export const autoCheckoutOptions: Option[] = [
  { value: "never", label: "Never" },
  { value: "end_of_day", label: "End of day (midnight)" },
  { value: "8", label: "After 8 hours" },
  { value: "12", label: "After 12 hours" },
];

export const overstayOptions: Option[] = [
  { value: "2", label: "2 hours" },
  { value: "4", label: "4 hours" },
  { value: "8", label: "8 hours" },
  { value: "12", label: "12 hours" },
];

export const retentionOptions: Option[] = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

/** Names shown in the audit trail when a setting changes */
export const settingLabels: Record<keyof Settings, string> = {
  requirePhoto: "Photo capture",
  requireSignature: "Signature requirement",
  requireHostApproval: "Host approval",
  allowWalkIns: "Walk-ins",
  requireCheckoutClearance: "Checkout clearance",
  autoCheckout: "Auto check-out",
  overstayHours: "Overstay alert",
  screenWatchlist: "Watchlist screening",
  maskPhones: "Phone masking",
  retentionDays: "Data retention",
  notifyHostOnArrival: "Host arrival alerts",
  notifyWatchlistMatch: "Watchlist match alerts",
  notifyOverstay: "Overstay alerts",
  dailySummary: "Daily summary email",
  welcomeMessage: "Kiosk welcome message",
};

/** Which settings differ between two copies, as readable names */
export function changedSettings(saved: Settings, draft: Settings) {
  return (Object.keys(saved) as (keyof Settings)[]).filter((key) => saved[key] !== draft[key]).map((key) => settingLabels[key]);
}

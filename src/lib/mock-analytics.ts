// The date ranges the Analytics page offers. The numbers come from GET /api/analytics.

export type RangeKey = "today" | "7d" | "30d" | "month";

export const ranges: { key: RangeKey; label: string; description: string }[] = [
  { key: "today", label: "Today", description: "Visitor insights for today" },
  { key: "7d", label: "Last 7 Days", description: "Visitor insights for the last 7 days" },
  { key: "30d", label: "Last 30 Days", description: "Visitor insights for the last 30 days" },
  { key: "month", label: "This Month", description: "Visitor insights for this month" },
];

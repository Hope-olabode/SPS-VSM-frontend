import type { PreRegStatus } from "@/src/lib/mock-preregistrations";

const statuses: Record<PreRegStatus, { label: string; badge: string; dot: string }> = {
  expected: {
    label: "Expected",
    badge: "border-teal-600/25 bg-teal-600/10 text-teal-700 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  checked_in: {
    label: "Checked In",
    badge: "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  checked_out: { label: "Checked Out", badge: "border-transparent bg-slate-500/10 text-soft", dot: "bg-slate-400" },
  cancelled: {
    label: "Cancelled",
    badge: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export function PreRegStatusBadge({ status }: { status: PreRegStatus }) {
  const { label, badge, dot } = statuses[status];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

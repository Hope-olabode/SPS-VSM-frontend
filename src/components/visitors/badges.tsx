import type { VisitorStatus, VisitorType } from "@/src/lib/mock-visitors";

const statuses: Record<VisitorStatus, { label: string; badge: string; dot: string }> = {
  pending_approval: {
    label: "Awaiting Approval",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500 animate-pulse",
  },
  declined: {
    label: "Declined",
    badge: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  onsite: {
    label: "Onsite",
    badge: "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  pending_clearance: {
    label: "Pending Clearance",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  left: { label: "Left", badge: "border-transparent bg-slate-500/10 text-soft", dot: "bg-slate-400" },
};

const types: Record<VisitorType, string> = {
  Client: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Guest: "bg-green-600/10 text-green-700 dark:text-green-400",
  Contractor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Candidate: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Vendor: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  Interviewee: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export function StatusBadge({ status }: { status: VisitorStatus }) {
  const { label, badge, dot } = statuses[status];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function TypeBadge({ type }: { type: VisitorType }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${types[type] ?? types.Guest}`}>{type}</span>;
}
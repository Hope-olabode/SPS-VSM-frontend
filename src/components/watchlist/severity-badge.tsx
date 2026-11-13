import type { Severity } from "@/src/lib/mock-watchlist";

const styles: Record<Severity, { badge: string; dot: string }> = {
  Low: { badge: "border-transparent bg-slate-500/10 text-soft", dot: "bg-slate-400" },
  Medium: { badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  High: { badge: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  Critical: { badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { badge, dot } = styles[severity];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dot}`} />
      {severity}
    </span>
  );
}

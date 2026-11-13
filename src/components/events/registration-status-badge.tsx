import type { ApiEventRegistration } from "@/src/lib/api";

const styles: Record<ApiEventRegistration["status"], string> = {
  APPROVED: "bg-brand-soft text-brand",
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const labels: Record<ApiEventRegistration["status"], string> = { APPROVED: "Approved", PENDING: "Awaiting approval" };

export function RegistrationStatusBadge({ status }: { status: ApiEventRegistration["status"] }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>{labels[status]}</span>;
}

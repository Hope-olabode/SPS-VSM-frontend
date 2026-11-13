"use client";

import Link from "next/link";
import { AlertCircleIcon, ArrowRightIcon } from "../icons";
import { VisitorAvatar } from "./visitor-avatar";
import { useVisitors } from "./visitors-provider";

export function ClearanceBanner() {
  const { visitors, resolveClearance } = useVisitors();
  const requests = visitors.filter((visitor) => visitor.status === "pending_clearance");

  if (requests.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircleIcon size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-sm font-bold leading-snug text-amber-900 dark:text-amber-200">
              Pending Kiosk Checkout Clearance ({requests.length})
            </h2>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
              Visitor check-out requires staff clearance before sign-out is finalized.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/visitors"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
        >
          <span className="hidden sm:inline">View All in Visitor Log</span>
          <ArrowRightIcon size={14} />
        </Link>
      </div>

      <div className="mt-3.5 grid gap-2.5">
        {requests.map((visitor) => (
          <div
            key={visitor.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200/80 bg-surface p-3 dark:border-amber-500/20 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <VisitorAvatar name={visitor.name} size="md" />
              <div className="min-w-0">
                <div className="text-xs font-bold">
                  {visitor.name} <span className="text-[11px] font-normal text-muted">({visitor.type})</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-soft">
                  <span>
                    Host: <strong className="font-medium text-fg">{visitor.host}</strong>
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Location: <strong className="font-medium text-fg">{visitor.clearance?.location}</strong>
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Requested: <strong className="font-medium text-fg">{visitor.clearance?.requestedAt}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => resolveClearance(visitor.id, "approve")}
                className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-green-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => resolveClearance(visitor.id, "decline")}
                className="rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircleIcon, ArrowRightIcon } from "../icons";
import { VisitorAvatar } from "./visitor-avatar";
import { useVisitors } from "./visitors-provider";

/**
 * Kiosk visitors waiting for staff to let them in (Control Panel: "Require host approval").
 * Shows on every dashboard page until each one has been approved or declined.
 */
export function ApprovalBanner() {
  const { visitors, resolveApproval } = useVisitors();
  const [busy, setBusy] = useState<string[]>([]);
  const waiting = visitors.filter((visitor) => visitor.status === "pending_approval");

  if (waiting.length === 0) return null;

  async function decide(id: string, decision: "approve" | "decline") {
    setBusy((current) => [...current, id]);
    await resolveApproval(id, decision);
    setBusy((current) => current.filter((item) => item !== id));
  }

  return (
    <section className="mb-6 rounded-xl border border-blue-300/70 bg-blue-50 p-4 dark:border-blue-500/25 dark:bg-blue-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircleIcon size={20} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm font-bold leading-snug text-blue-900 dark:text-blue-200">Visitors Waiting for Approval ({waiting.length})</h2>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300/80">These visitors checked in at the kiosk and are waiting for staff to let them in.</p>
          </div>
        </div>
        <Link
          href="/dashboard/visitors"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <span className="hidden sm:inline">View All in Visitor Log</span>
          <ArrowRightIcon size={14} />
        </Link>
      </div>

      <div className="mt-3.5 grid gap-2.5">
        {waiting.map((visitor) => (
          <div
            key={visitor.id}
            className="flex flex-col gap-3 rounded-lg border border-blue-200/80 bg-surface p-3 dark:border-blue-500/20 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <VisitorAvatar name={visitor.name} size="md" />
              <div className="min-w-0">
                <div className="text-xs font-bold">
                  {visitor.name} <span className="text-[11px] font-normal text-muted">({visitor.type})</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-soft">
                  <span>
                    Here to see: <strong className="font-medium text-fg">{visitor.host || "Not given"}</strong>
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Company: <strong className="font-medium text-fg">{visitor.residentCompany || "Not given"}</strong>
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Arrived: <strong className="font-medium text-fg">{visitor.checkIn.time}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={busy.includes(visitor.id)}
                onClick={() => void decide(visitor.id, "approve")}
                className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
              >
                Let in
              </button>
              <button
                type="button"
                disabled={busy.includes(visitor.id)}
                onClick={() => void decide(visitor.id, "decline")}
                className="rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
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
